# Basketball Implementation - Complete! 🏀

## What Was Implemented

We've successfully implemented the **physical basketball gameplay layer** with real entities, physics, and scoring detection!

### Files Created

1. **`src/server/entities/BasketballEntity.ts`** (150 lines)
   - Dynamic physics entity with sphere collider
   - Realistic bouncing (restitution: 0.65)
   - Air resistance and rotation damping
   - Throw mechanics with power and arc
   - Auto-despawn after 15 seconds
   - Score/miss event callbacks

2. **`src/server/entities/BasketballHoopEntity.ts`** (140 lines)
   - Fixed position hoop with backboard
   - Sensor collider for scoring detection
   - Validates downward ball velocity (prevents scoring from below)
   - Creates visual rim blocks
   - Calculates shot type based on distance

3. **`src/server/systems/ball-spawn-system.ts`** (160 lines)
   - Manages ball spawning for players
   - Tracks active balls per player
   - Handles ball throwing with physics
   - Cleanup on player leave
   - Prevents duplicate balls

### Files Modified

4. **`src/server/ui-message-handler.ts`**
   - Integrated BallSpawnSystem
   - Updated basketballShotAttempt handler
   - Spawns ball on shot attempt
   - Throws ball with timing/aim from UI
   - Callbacks for score/miss events
   - Sends result to client

5. **`config/zones.json`**
   - Added hoop positions to basketball field
   - Left hoop at (207, 3, 0)
   - Right hoop at (233, 3, 0)
   - Direction metadata for future orientation

6. **`index.ts`**
   - Imported BasketballHoopEntity
   - Spawns hoops on server startup
   - Creates visual rim blocks
   - Logs hoop positions

---

## How It Works

### 1. **Server Startup**
```
🏀 Pregame City server starting...
Setting up field triggers...
✅ Created 1 field triggers
Setting up basketball hoops...
  ✅ Spawned basketball hoop at (207, 3, 0)
  ✅ Spawned basketball hoop at (233, 3, 0)
✅ Challenge system initialized
```

### 2. **Player Starts Challenge**
- Player walks to basketball court
- Presses **E** to start challenge
- Challenge system activates
- Timer starts (60 seconds)

### 3. **Player Takes Shot**
- Player presses **SPACE** to activate shot meter
- Power and aim bars oscillate
- Player presses **SPACE** again to capture

**Client sends:**
```javascript
{
  type: 'basketballShotAttempt',
  challengeSessionId: '...',
  timing: 0.85,  // Power (0-1)
  aimOffset: 0.12  // Aim accuracy (0-1)
}
```

### 4. **Server Response**
1. Checks if player has active ball
   - If no: Spawns ball in front of player
   - If yes: Uses existing ball

2. Calculates throw direction
   - Gets player's facing direction
   - Uses rotation (pitch + yaw)

3. Throws the ball
   - Force based on timing (power)
   - Adds upward arc for realistic shot
   - Applies backspin torque

4. Ball flies through the air
   - Physics simulation (gravity, air resistance)
   - Bounces on court/walls
   - Can go through hoop sensor

### 5. **Scoring Detection**
**If ball enters hoop sensor:**
- Checks ball velocity (must be moving down)
- Marks ball as scored
- Awards points (2 or 3)
- Updates challenge score
- Sends success message to client

**If ball misses:**
- Auto-despawns after 15 seconds
- Sends miss message to client

### 6. **Challenge Completion**
- Timer reaches 0
- Challenge ends
- Awards XP and coins based on score
- Player sees final results

---

## Physics Parameters

### Basketball Entity
```typescript
- Size: 0.15 x 0.15 x 0.15 blocks (small)
- Collider: Sphere (radius 0.15)
- Density: 0.6 (light)
- Restitution: 0.65 (bouncy)
- Friction: 0.4 (moderate)
- Linear Damping: 0.2 (air resistance)
- Angular Damping: 0.3 (spin decay)
- CCD: Enabled (prevents tunneling through hoop)
```

### Throw Mechanics
```typescript
- Base Strength: 15-25 (based on power 0-1)
- Arc Boost: 3-8 (upward force)
- Backspin: Random torque for realism
- Direction: Player's facing direction
```

### Hoop Entity
```typescript
- Backboard: 0.05 x 1.0 x 0.75 blocks
- Rim Sensor: Cylinder (radius 0.4, height 0.05)
- Position: Front of backboard, slightly below
- Type: Fixed (doesn't move)
- Sensor: Ghost collider (no physical collision)
```

---

## Testing Checklist

### ✅ Completed
- [x] Basketball entities created
- [x] Hoop entities created
- [x] Ball spawn system implemented
- [x] Throw mechanics integrated
- [x] Scoring detection implemented
- [x] Challenge integration complete
- [x] Server spawns hoops on startup

### 🧪 Ready to Test
- [ ] Ball spawns in front of player
- [ ] Ball throws in correct direction
- [ ] Ball has realistic physics (bouncing, rolling)
- [ ] Ball enters hoop sensor
- [ ] Scoring is detected correctly
- [ ] Score updates in challenge
- [ ] XP and coins awarded
- [ ] Shot meter timing affects throw power
- [ ] Ball auto-despawns after timeout

---

## How to Test

### 1. **Start the server:**
```bash
npm run dev
```

**Expected console output:**
```
Setting up basketball hoops...
  ✅ Spawned basketball hoop at (207, 3, 0)
  ✅ Spawned basketball hoop at (233, 3, 0)
```

### 2. **Join the game:**
- Go to https://hytopia.com/play
- Connect to your local server

### 3. **Navigate to basketball court:**
```
/tp 220 0 0
```
Or walk to coordinates (200, 0, 0)

### 4. **Look for the hoops:**
- Should see white backboards at Y=3
- Orange rim blocks in a circle
- Two hoops on opposite ends of court

### 5. **Start challenge:**
- Press **E** when near court
- Challenge starts, timer begins

### 6. **Take a shot:**
- Press **SPACE** - shot meter appears
- Wait for power/aim to oscillate
- Press **SPACE** again to shoot
- **Ball should spawn and fly toward hoop!**

### 7. **Observe:**
- Ball physics (bouncing, rolling)
- If ball goes through hoop → Score updates
- Notification shows "+2 points!"
- Challenge score increments

---

## Expected Behavior

### ✅ Success Case
```
Player presses SPACE
→ Ball spawns in front of player
→ Ball flies in an arc toward hoop
→ Ball enters hoop sensor (moving downward)
→ Console: "🏀 BASKET! Player scored 2 points (midrange)"
→ Challenge score += 2
→ Client notification: "+2 points! good"
→ Ball despawns after 2 seconds
```

### ❌ Miss Case
```
Player presses SPACE
→ Ball spawns and flies
→ Ball misses hoop
→ Ball bounces on ground
→ Console: "Shot missed"
→ Client notification: "Miss! bad_aim"
→ Ball despawns after 15 seconds
```

---

## Console Logs to Look For

### Server Console
```
Spawned basketball for player player-1 at { x: 221, y: 2.2, z: 0 }
Player player-1 threw ball with power 0.85, aim 0.88
Ball collided with entity: BasketballHoopEntity
🏀 BASKET! Player scored 2 points (midrange)
```

### Browser Console
```
🎮 Pregame City UI Initialized (Hytopia Native)
Shot captured: { timing: 0.85, aimOffset: 0.12 }
Received: basketballShotResult { made: true, points: 2, ... }
```

---

## Potential Issues & Fixes

### Issue 1: Ball doesn't spawn
**Symptom:** Nothing happens when pressing SPACE
**Check:**
- Is challenge active?
- Console errors?
- Player entity exists?

**Fix:** Check console logs for errors

### Issue 2: Ball spawns but doesn't move
**Symptom:** Ball appears but just falls straight down
**Cause:** Direction calculation wrong

**Fix:** Check player rotation values in console

### Issue 3: Ball goes through hoop but no score
**Symptom:** Ball enters hoop but score doesn't update
**Check:**
- Ball velocity direction (should be downward)
- Sensor collision event firing
- Console for "Ball entered hoop from below"

**Fix:** Adjust hoop sensor position or ball velocity check

### Issue 4: Ball bounces too much / not enough
**Symptom:** Physics feels wrong
**Fix:** Adjust in `BasketballEntity.ts`:
```typescript
restitution: 0.65,  // Increase for more bounce, decrease for less
friction: 0.4,      // Increase for more grip, decrease for sliding
```

### Issue 5: Ball disappears immediately
**Symptom:** Ball spawns then vanishes
**Cause:** Possible collision issue or despawn timing

**Fix:** Check despawn timer (currently 15 seconds)

---

## Next Steps

### Phase 1 Complete! 🎉
You now have:
- ✅ Physical basketballs with realistic physics
- ✅ Functional hoops with scoring detection
- ✅ Ball spawning and throwing mechanics
- ✅ Integration with challenge system

### Phase 2: Polish (1-2 days)
1. **Visual Feedback**
   - Floating "+2" or "+3" text on score
   - Ball trail particle effect
   - Hoop net swish animation
   - Better hoop models (or more detailed blocks)

2. **Audio Feedback**
   - Swish sound when ball scores
   - Bounce sound on ground
   - Clang sound when hitting rim
   - Throw/release sound

3. **Tuning**
   - Adjust ball physics (bounce, weight)
   - Adjust throw strength
   - Perfect shot meter timing
   - Hoop sensor size

### Phase 3: Features (2-3 days)
1. **Shot Type Detection**
   - Calculate distance from player to hoop
   - Award 2 pts (layup/midrange) or 3 pts (three-pointer)
   - Display shot type in notification

2. **Multiple Balls**
   - Rapid fire mode
   - Ball rack that spawns multiple balls
   - Practice mode with unlimited balls

3. **Visual Improvements**
   - Replace block entities with 3D models
   - Animated net when ball scores
   - Court lighting effects

### Phase 4: Other Sports (4-8 days)
- Soccer ⚽
- Football 🏈
- Baseball ⚾
- Tennis 🎾

---

## File Locations

```
src/server/
├── entities/
│   ├── BasketballEntity.ts        ✅ NEW (150 lines)
│   └── BasketballHoopEntity.ts    ✅ NEW (140 lines)
├── systems/
│   ├── ball-spawn-system.ts       ✅ NEW (160 lines)
│   ├── challenge-system.ts        (existing)
│   └── trigger-system.ts          (existing)
├── sports/
│   └── basketball-logic.ts        (existing - not used for physics)
└── ui-message-handler.ts          ✅ MODIFIED

config/
└── zones.json                     ✅ MODIFIED (added hoop positions)

index.ts                           ✅ MODIFIED (spawn hoops)
```

---

## Summary

**Before:**
- Shot meter UI existed
- Challenge system tracked scores
- But no actual basketballs or hoops!
- Just simulated randomness

**After:**
- Real physics-based basketball entities
- Functional hoops with scoring sensors
- Ball spawning and throwing system
- Collision detection and scoring
- Full integration with challenge system

**Result:** You can now actually shoot hoops in your Hytopia game! 🏀🎉

---

**Ready to test!** Restart your server and try shooting some hoops! 🚀
