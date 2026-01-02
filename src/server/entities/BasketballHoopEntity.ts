import {
  Entity,
  RigidBodyType,
  ColliderShape,
  EntityEvent,
  CollisionGroup,
  type World,
  type Vector3Like,
} from 'hytopia';
import { BasketballEntity } from './BasketballEntity';

export class BasketballHoopEntity extends Entity {
  private scoringBalls: Set<number | undefined> = new Set(); // Track balls that already scored

  constructor() {
    super({
      // Visual representation using blocks (backboard and rim)
      blockTextureUri: 'blocks/white-concrete.png',
      blockHalfExtents: { x: 0.05, y: 1.0, z: 0.75 }, // Thin backboard
      rigidBodyOptions: {
        type: RigidBodyType.FIXED, // Hoop doesn't move
        colliders: [
          // Backboard collider (solid)
          {
            shape: ColliderShape.BLOCK,
            halfExtents: { x: 0.05, y: 1.0, z: 0.75 },
            relativePosition: { x: 0, y: 0, z: 0 },
          },
          // Rim/basket scoring sensor (ghost collider, no physical collision)
          {
            shape: ColliderShape.CYLINDER,
            radius: 0.4,
            halfHeight: 0.025, // Half of 0.05
            relativePosition: { x: -0.5, y: -0.6, z: 0 }, // In front of backboard
            isSensor: true, // Doesn't physically collide, just detects
            collisionGroups: {
              belongsTo: [CollisionGroup.ENTITY_SENSOR],
              collidesWith: [CollisionGroup.ENTITY],
            },
            onCollision: (other: any, started: boolean) => {
              if (!started || !(other instanceof BasketballEntity)) return;

              const ball = other as BasketballEntity;

              // Prevent double-scoring
              const ballId = ball.id;
              if (this.scoringBalls.has(ballId) || ball.hasScored()) return;

              // Check if ball is moving downward (valid shot)
              const velocity = ball.rawRigidBody.linvel();
              if (velocity.y > 0) {
                // Ball is moving upward, not a valid score
                console.log('Ball entered hoop from below, no score');
                return;
              }

              // Valid score!
              this.scoringBalls.add(ballId);
              this.handleScore(ball);

              // Clean up tracking after a delay
              setTimeout(() => {
                this.scoringBalls.delete(ballId);
              }, 5000);
            },
          },
        ],
      },
    });
  }

  private setupScoringDetection() {
    // No longer needed - onCollision callback is set directly in the collider options
  }

  private handleScore(ball: BasketballEntity) {
    // Calculate shot type based on distance
    // For now, default to midrange (2 points)
    // TODO: Calculate actual distance from player to hoop
    const points = 2;
    const shotType = 'midrange';

    console.log(`🏀 BASKET! Player scored ${points} points (${shotType})`);

    // Mark the ball as scored
    ball.markScored(points, shotType);

    // TODO: Play swish sound
    // TODO: Animate net
    // TODO: Show score popup
  }

  /**
   * Calculate shot type based on distance from player position to hoop
   */
  private calculateShotType(ballPosition: Vector3Like, hoopPosition: Vector3Like): {
    points: number;
    shotType: string;
  } {
    const dx = ballPosition.x - hoopPosition.x;
    const dz = ballPosition.z - hoopPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 2) {
      return { points: 2, shotType: 'layup' };
    } else if (distance < 6) {
      return { points: 2, shotType: 'midrange' };
    } else {
      return { points: 3, shotType: 'three' };
    }
  }

  /**
   * Create rim blocks for visual representation
   * Call this after spawning to add visual rim
   */
  public createRimBlocks(world: World) {
    // Create orange rim blocks in a circle
    const rimPosition = this.position;
    const rimRadius = 0.45;
    const rimY = rimPosition.y - 0.6;

    // Create 8 blocks around the rim
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = rimPosition.x - 0.5 + Math.cos(angle) * rimRadius;
      const z = rimPosition.z + Math.sin(angle) * rimRadius;

      // Set orange block
      world.chunkLattice.setBlock(
        {
          x: Math.floor(x),
          y: Math.floor(rimY),
          z: Math.floor(z),
        },
        6 // Orange concrete block ID (from map generator)
      );
    }
  }
}
