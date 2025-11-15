# Sports City - Development Roadmap

## Current Status ✅

### What's Working
- ✅ **Server & World**: Map generation, player spawning, zones configured
- ✅ **UI System**: Complete HUD, notifications, emotes, quick chat, scoreboard
- ✅ **Challenge System**: Server-authoritative challenges with timers and scoring
- ✅ **Progression System**: XP, coins, ranks (Rookie → Amateur → Collegiate → Pro)
- ✅ **Trigger System**: Field proximity detection
- ✅ **Input System**: Shot meter UI with power/aim mechanics

### What's Missing
- ❌ **Actual Basketball Gameplay**: No physical hoops, balls, or shooting mechanics
- ❌ **3D Entities**: Basketball hoops and balls don't exist yet
- ❌ **Physics Integration**: No ball throwing or collision detection
- ❌ **Visual Feedback**: No score popups, ball trails, or hoop animations
- ❌ **Other Sports**: Soccer, football, baseball, tennis not implemented

---

## Phase 1: Basketball Core Gameplay 🏀

### Goal
Make basketball actually playable with physical balls and hoops.

### Tasks

#### 1.1 Create Basketball Hoop Entity
**File:** `src/server/entities/BasketballHoopEntity.ts`

```typescript
import { Entity, RigidBodyType, ColliderShape } from 'hytopia';

export class BasketballHoopEntity extends Entity {
  constructor() {
    super({
      modelUri: 'models/sports/basketball-hoop.gltf', // Need to create/find
      modelScale: 1.0,
      rigidBodyOptions: {
        type: RigidBodyType.FIXED, // Static, doesn't move
      },
    });
  }

  // Add sensor collider for scoring zone
  private setupScoringTrigger() {
    // Create a sphere sensor at the basket
    // Detects when ball enters
  }
}
```

**Assets Needed:**
- 3D model: `assets/models/sports/basketball-hoop.gltf`
- Or use block entities to build hoops from blocks

**References:**
- [Entities Documentation](https://dev.hytopia.com/sdk-guides/entities)
- Example: zombies-fps uses fixed entities for props

---

#### 1.2 Create Basketball Entity
**File:** `src/server/entities/BasketballEntity.ts`

```typescript
import { Entity, RigidBodyType, ColliderShape, EntityEvent } from 'hytopia';

export class BasketballEntity extends Entity {
  private owner: string; // Player who threw it
  private scored: boolean = false;

  constructor(playerId: string) {
    super({
      modelUri: 'models/sports/basketball.gltf', // Need to create/find
      modelScale: 0.3,
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC, // Affected by gravity
        linearDamping: 0.3,  // Air resistance
        angularDamping: 0.5, // Rotation resistance
        ccdEnabled: true,    // Prevent tunneling through hoop
        colliders: [{
          shape: ColliderShape.SPHERE,
          radius: 0.15,
          density: 0.6,
          restitution: 0.7,  // Bounciness
          friction: 0.4,
        }],
      },
    });

    this.owner = playerId;
    this.setupCollisionDetection();
  }

  private setupCollisionDetection() {
    this.on(EntityEvent.ENTITY_COLLISION, ({ otherEntity, started }) => {
      if (started && otherEntity instanceof BasketballHoopEntity) {
        this.handleScore();
      }
    });
  }

  private handleScore() {
    if (this.scored) return;
    this.scored = true;
    // Emit score event to challenge system
  }

  public throw(direction: Vector3Like, power: number) {
    // Apply impulse based on direction and power
    const force = {
      x: direction.x * power * 15,
      y: direction.y * power * 15 + 5, // Add arc
      z: direction.z * power * 15,
    };

    this.applyImpulse(force);

    // Add spin
    this.applyTorqueImpulse({
      x: (Math.random() - 0.5) * 2,
      y: 0,
      z: (Math.random() - 0.5) * 2,
    });

    // Auto-despawn after 10 seconds
    setTimeout(() => {
      if (this.isSpawned) {
        this.despawn();
      }
    }, 10000);
  }
}
```

**Assets Needed:**
- 3D model: `assets/models/sports/basketball.gltf`
- Or use orange sphere entity

**References:**
- [Physics Documentation](https://dev.hytopia.com/sdk-guides/physics)
- Example: hygrounds RocketLauncherEntity (projectile physics)
- See Result #2 from search above

---

#### 1.3 Implement Ball Spawning & Throwing
**File:** `src/server/systems/ball-spawn-system.ts`

```typescript
export class BallSpawnSystem {
  private activeBalls: Map<string, BasketballEntity> = new Map();

  spawnBallForPlayer(world: World, playerId: string) {
    // Get player entity
    const playerEntities = world.entityManager.getPlayerEntitiesByPlayerId(playerId);
    if (!playerEntities.length) return;

    const playerEntity = playerEntities[0];
    const position = playerEntity.position;
    const facing = playerEntity.directionFromRotation;

    // Spawn ball in front of player
    const ball = new BasketballEntity(playerId);
    ball.spawn(world, {
      x: position.x + facing.x * 1,
      y: position.y + 1.5,
      z: position.z + facing.z * 1,
    });

    this.activeBalls.set(playerId, ball);
    return ball;
  }

  throwBall(playerId: string, power: number, aim: number) {
    const ball = this.activeBalls.get(playerId);
    if (!ball) return;

    // Calculate throw direction
    // Use power and aim from UI shot meter
    const playerEntities = world.entityManager.getPlayerEntitiesByPlayerId(playerId);
    const playerEntity = playerEntities[0];
    const facing = playerEntity.directionFromRotation;

    ball.throw(facing, power);
    this.activeBalls.delete(playerId);
  }
}
```

**Integration Points:**
- Hook into existing `basketballShotAttempt` UI message
- Use `timing` and `aimOffset` from shot meter
- Connect to `ChallengeSystem.registerHit()` on score

---

#### 1.4 Create Scoring Detection System
**File:** `src/server/systems/scoring-system.ts`

```typescript
export class ScoringSystem {
  private hoops: BasketballHoopEntity[] = [];

  setupHoops(world: World, fieldConfig: any) {
    // Create hoops at field positions
    const hoop = new BasketballHoopEntity();
    hoop.spawn(world, fieldConfig.hoopPosition);
    this.hoops.push(hoop);
  }

  detectScore(ball: BasketballEntity, hoop: BasketballHoopEntity): boolean {
    // Check if ball went through hoop from above
    // Use collision point and velocity to determine valid score
    const ballVelocity = ball.rawRigidBody.linvel();

    // Only score if ball is moving downward
    if (ballVelocity.y > 0) return false;

    return true;
  }
}
```

**Physics Concepts:**
- Use sensor colliders (no physical collision, just detection)
- Check ball entry point and velocity
- Award points based on shot type (determined by distance)

---

#### 1.5 Connect to Existing Challenge System
**File:** `src/server/ui-message-handler.ts` (update)

```typescript
private handleBasketballShotAttempt(conn: ServerConnection, msg: any) {
  const playerId = conn.id;
  const { challengeSessionId, timing, aimOffset } = msg;

  const challenge = this.challengeSystem.getChallengeForSession(challengeSessionId);
  if (!challenge || challenge.playerId !== playerId) return;

  // NEW: Spawn and throw actual ball
  const ball = this.ballSpawnSystem.spawnBallForPlayer(this.world!, playerId);
  if (!ball) return;

  // Use timing/aim to calculate throw power and accuracy
  const power = timing; // 0-1
  const accuracy = 1 - aimOffset; // 0-1

  // Throw the ball
  this.ballSpawnSystem.throwBall(playerId, power, accuracy);

  // Ball will auto-detect scoring via collision events
  // When score is detected, call:
  // this.challengeSystem.registerHit(playerId, points);
}
```

---

### Phase 1 Deliverables

- ✅ Physical basketball hoops on court
- ✅ Throwable basketballs with realistic physics
- ✅ Collision detection for scoring
- ✅ Integration with existing challenge system
- ✅ Score popups when ball goes in

**Estimated Time:** 2-3 days

---

## Phase 2: Visual Polish & Feedback 🎨

### Goal
Add visual effects and feedback to make gameplay feel good.

### Tasks

#### 2.1 Score Popup System
- Create floating "+2" or "+3" text when ball scores
- Use SceneUI attached to score position
- Animate upward and fade out

**References:**
- [SceneUI Documentation](https://dev.hytopia.com/sdk-guides/user-interface)

#### 2.2 Ball Trail Effect
- Add particle trail behind ball in flight
- Use Entity with low opacity following ball

#### 2.3 Hoop Animations
- Net swish animation when ball scores
- Hoop shake effect
- Sound effects (swish, clang for misses)

#### 2.4 Challenge Start/End Effects
- Spotlight on player at challenge start
- Confetti/fireworks on completion
- Better notification animations

**Estimated Time:** 1-2 days

---

## Phase 3: Additional Sports ⚽🏈⚾🎾

### Goal
Implement the other 4 sports using the basketball pattern.

### 3.1 Soccer (Football)
- **Ball:** Round, less bouncy than basketball
- **Goal:** Large net with scoring trigger
- **Mechanic:** Kick (forward impulse), dribbling
- **Challenge:** Penalty kicks, accuracy shooting

### 3.2 American Football
- **Ball:** Oblong (capsule collider)
- **Goal:** Uprights (field goal posts)
- **Mechanic:** Throw with arc, spiral rotation
- **Challenge:** Field goal accuracy from different distances

### 3.3 Baseball
- **Ball:** Small, fast
- **Equipment:** Bat (melee entity), bases
- **Mechanic:** Batting timing, pitching
- **Challenge:** Home run derby, target hitting

### 3.4 Tennis
- **Ball:** Small, very bouncy
- **Equipment:** Racket, net
- **Mechanic:** Serve, volley
- **Challenge:** Serve accuracy, rally points

**Estimated Time:** 1-2 days per sport = 4-8 days total

---

## Phase 4: Leaderboards & Persistence 📊

### Goal
Add competitive elements and save player progress.

### Tasks

#### 4.1 Database Integration
- Replace in-memory `playerDataMap` with database
- Use Hytopia's SaveStates API
- Persist XP, coins, rank, best scores

**References:**
- [SaveStates Documentation](https://dev.hytopia.com/sdk-guides/save-states)

#### 4.2 Leaderboard System
- Track top scores per challenge
- Global and per-sport leaderboards
- Weekly/all-time rankings

#### 4.3 Scoreboard UI Data
- Populate Tab scoreboard with real data
- Show nearby players, friends, global top 10

**Estimated Time:** 2-3 days

---

## Phase 5: Social & Multiplayer Features 👥

### Goal
Make it more social and competitive.

### Tasks

#### 5.1 Spectator Mode
- Players can watch others' challenges
- Camera follows active player
- Scoreboard shows live stats

#### 5.2 Head-to-Head Challenges
- Two players compete simultaneously
- Side-by-side courts
- Real-time score comparison

#### 5.3 Cosmetics Shop
- Spend coins on:
  - Character skins
  - Ball skins
  - Emote animations
  - Hoop designs

#### 5.4 Daily Quests
- "Score 10 three-pointers"
- "Complete 3 challenges"
- Bonus XP and coins

**Estimated Time:** 3-5 days

---

## Phase 6: Map Expansion 🗺️

### Goal
Add more districts and content.

### Tasks

#### 6.1 Generate Full Map
- Run `npm run generate-map` with all zones
- Add soccer field district
- Add football field district
- Add baseball diamond district
- Add tennis courts district

#### 6.2 Central Hub Improvements
- Shops and NPCs
- Leaderboard displays
- Spawn area decorations

#### 6.3 Pathways & Navigation
- Connect all districts
- Add signage
- Teleport pads between zones

**Estimated Time:** 1-2 days

---

## Quick Wins (Do First!) 🎯

Before diving into entities, here are some quick improvements:

1. **Fix Shot Meter Logic** ⚡ (30 mins)
   - Currently shoots on first spacebar press
   - Should require second press to capture
   - Update `assets/ui/index.html` shot meter state machine

2. **Add Debug Commands** ⚡ (15 mins)
   - `/tp court` - Teleport to basketball court
   - `/challenge start` - Force start challenge
   - `/givexp 100` - Add XP for testing

3. **Improve Court Visuals** ⚡ (1 hour)
   - Add more detailed court markings
   - Better hoop placeholders (blocks)
   - Court lighting

4. **Test Full Loop** ⚡ (30 mins)
   - Walk to court
   - Start challenge
   - Test shot meter
   - Verify timer, score, XP rewards

---

## Development Priority

### Recommended Order

1. **Quick Wins** (2-3 hours) ← **START HERE**
2. **Phase 1.1-1.2** - Create ball and hoop entities (1 day)
3. **Phase 1.3-1.4** - Implement throwing and scoring (1 day)
4. **Phase 1.5** - Connect to challenge system (0.5 days)
5. **Phase 2** - Visual polish (1-2 days)
6. **Phase 4** - Leaderboards (2-3 days)
7. **Phase 3** - Other sports (4-8 days)
8. **Phase 5** - Social features (3-5 days)
9. **Phase 6** - Map expansion (1-2 days)

**Total Estimated Time:** 2-4 weeks for full implementation

---

## Next Immediate Steps

### Today's Tasks:

1. **Create entity classes:**
   ```bash
   mkdir -p src/server/entities
   touch src/server/entities/BasketballEntity.ts
   touch src/server/entities/BasketballHoopEntity.ts
   ```

2. **Find or create 3D models:**
   - Search for free GLTF basketball model
   - Search for basketball hoop model
   - Or use simple sphere/cylinder entities

3. **Implement basic ball spawning:**
   - Create `BallSpawnSystem`
   - Hook into UI shot attempt
   - Test ball physics

4. **Test and iterate:**
   - Spawn ball on spacebar
   - Adjust physics (bounciness, weight)
   - Get the feel right

---

## Resources

### Hytopia SDK References
- [Entities](https://dev.hytopia.com/sdk-guides/entities)
- [Physics](https://dev.hytopia.com/sdk-guides/physics)
- [Rigid Bodies](https://dev.hytopia.com/sdk-guides/physics/rigid-bodies)
- [Colliders](https://dev.hytopia.com/sdk-guides/physics/colliders)
- [Raycasts](https://dev.hytopia.com/sdk-guides/physics/raycasts)

### Example Projects
- **hygrounds** - RocketLauncherEntity (projectile physics)
- **zombies-fps** - GunEntity (raycasting and hit detection)
- **frontiers-rpg-game** - Complex entity interactions

### Asset Resources
- **Sketchfab** - Free GLTF models
- **Poly Pizza** - Game-ready models
- **Kenney** - Free game assets

---

## Summary

You have a **solid foundation** with:
- ✅ Working UI and challenge system
- ✅ Server architecture
- ✅ Progression mechanics

**What's missing** is the **physical gameplay layer**:
- Basketball entities with physics
- Ball throwing mechanics
- Collision detection and scoring

**The good news:** The Hytopia SDK makes this straightforward with Entity, RigidBody, and physics systems. Examples from other games show exactly how to do projectiles, collision detection, and scoring.

**Start with Phase 1** to get basketball fully playable, then expand from there! 🏀🚀
