import {
  Entity,
  RigidBodyType,
  ColliderShape,
  EntityEvent,
  type World,
  type Vector3Like,
} from 'hytopia';

export type BasketballEventHandlers = {
  onScore?: (points: number, shotType: string) => void;
  onMiss?: () => void;
};

export class BasketballEntity extends Entity {
  private owner: string;
  private scored: boolean = false;
  private eventHandlers: BasketballEventHandlers;
  private despawnTimer?: NodeJS.Timeout;

  constructor(playerId: string, handlers: BasketballEventHandlers = {}) {
    super({
      // Use a simple orange block for now (can be replaced with model later)
      blockTextureUri: 'blocks/orange-concrete.png',
      blockHalfExtents: { x: 0.15, y: 0.15, z: 0.15 }, // Small ball
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC, // Affected by physics
        linearDamping: 0.2,  // Air resistance
        angularDamping: 0.3, // Rotation resistance
        ccdEnabled: true,    // Continuous collision detection (prevents tunneling)
        gravityScale: 1.0,   // Full gravity
        colliders: [
          {
            shape: ColliderShape.BALL, // Sphere collider for ball
            radius: 0.15,
            bounciness: 0.65, // Bounciness (0-1)
            friction: 0.4,
            mass: 0.6,
          },
        ],
      },
    });

    this.owner = playerId;
    this.eventHandlers = handlers;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for collisions with other entities (like hoops)
    this.on(EntityEvent.ENTITY_COLLISION, ({ otherEntity, started }) => {
      if (!started || this.scored) return;

      // Check if we hit a hoop (we'll handle this in BasketballHoopEntity)
      console.log('Ball collided with entity:', otherEntity.constructor.name);
    });

    // Listen for block collisions (ground, walls, etc.)
    this.on(EntityEvent.BLOCK_COLLISION, ({ started }) => {
      if (started) {
        // Play bounce sound here in the future
        console.log('Ball bounced');
      }
    });
  }

  /**
   * Throw the basketball with given direction and power
   */
  public throw(direction: Vector3Like, power: number, arc: number = 1.0) {
    if (!this.isSpawned) {
      console.error('Cannot throw ball that is not spawned');
      return;
    }

    // Calculate throw force
    // Power is 0-1 from UI shot meter
    const throwStrength = 15 + (power * 10); // 15-25 force
    const arcBoost = 3 + (arc * 5); // 3-8 upward force

    const force = {
      x: direction.x * throwStrength,
      y: direction.y * throwStrength + arcBoost, // Add arc for realistic shot
      z: direction.z * throwStrength,
    };

    this.applyImpulse(force);

    // Add realistic backspin
    this.applyTorqueImpulse({
      x: -direction.z * 2,  // Side spin based on direction
      y: 0,
      z: direction.x * 2,
    });

    console.log(`Ball thrown with power ${power.toFixed(2)}, force:`, force);

    // Auto-despawn after 15 seconds if still active
    this.despawnTimer = setTimeout(() => {
      if (this.isSpawned && !this.scored) {
        console.log('Ball auto-despawning after timeout');
        this.despawn();
        this.eventHandlers.onMiss?.();
      }
    }, 15000);
  }

  /**
   * Mark the ball as scored
   */
  public markScored(points: number, shotType: string) {
    if (this.scored) return;

    this.scored = true;
    console.log(`SCORE! +${points} points (${shotType})`);

    // Call score handler
    this.eventHandlers.onScore?.(points, shotType);

    // Despawn after a brief delay to show the score
    setTimeout(() => {
      if (this.isSpawned) {
        this.despawn();
      }
    }, 2000);
  }

  /**
   * Mark the ball as missed
   */
  public markMissed() {
    if (this.scored) return;

    console.log('Shot missed');
    this.eventHandlers.onMiss?.();
  }

  /**
   * Clean up when despawning
   */
  public override despawn() {
    if (this.despawnTimer) {
      clearTimeout(this.despawnTimer);
      this.despawnTimer = undefined;
    }
    super.despawn();
  }

  /**
   * Get the player who owns this ball
   */
  public getOwner(): string {
    return this.owner;
  }

  /**
   * Check if ball has already scored
   */
  public hasScored(): boolean {
    return this.scored;
  }
}
