import type { World, Player } from 'hytopia';
import { PlayerManager } from 'hytopia';
import { BasketballEntity } from '../entities/BasketballEntity';

type BallInfo = {
  ball: BasketballEntity;
  playerId: string;
  spawnTime: number;
};

export class BallSpawnSystem {
  private activeBalls: Map<string, BallInfo> = new Map(); // playerId -> ball info
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  /**
   * Spawn a basketball for a player
   * Returns the spawned ball entity
   */
  public spawnBallForPlayer(
    playerId: string,
    onScore?: (points: number, shotType: string) => void,
    onMiss?: () => void
  ): BasketballEntity | null {
    // Clean up any existing ball for this player
    const existing = this.activeBalls.get(playerId);
    if (existing && existing.ball.isSpawned) {
      console.log(`Despawning existing ball for player ${playerId}`);
      existing.ball.despawn();
      this.activeBalls.delete(playerId);
    }

    // Get player entity to determine spawn position
    const player = PlayerManager.instance.getConnectedPlayers().find((p: Player) => p.id === playerId);
    if (!player) {
      console.error(`Cannot spawn ball: No player found for ${playerId}`);
      return null;
    }

    const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
    if (playerEntities.length === 0) {
      console.error(`Cannot spawn ball: No entity found for player ${playerId}`);
      return null;
    }

    const playerEntity = playerEntities[0];
    const playerPos = playerEntity.position;

    // Calculate spawn position in front of player at chest height
    const spawnDistance = 1.0;
    const spawnHeight = 1.2;

    // Get player's forward direction from camera orientation
    const yaw = player.camera.orientation.yaw;
    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);

    const spawnPosition = {
      x: playerPos.x + forwardX * spawnDistance,
      y: playerPos.y + spawnHeight,
      z: playerPos.z + forwardZ * spawnDistance,
    };

    // Create the basketball with event handlers
    const ball = new BasketballEntity(playerId, {
      onScore: (points, shotType) => {
        onScore?.(points, shotType);
        this.activeBalls.delete(playerId);
      },
      onMiss: () => {
        onMiss?.();
        this.activeBalls.delete(playerId);
      },
    });

    // Spawn the ball
    ball.spawn(this.world, spawnPosition);

    // Track the ball
    this.activeBalls.set(playerId, {
      ball,
      playerId,
      spawnTime: Date.now(),
    });

    console.log(`Spawned basketball for player ${playerId} at`, spawnPosition);
    return ball;
  }

  /**
   * Throw the ball for a player
   * Uses power (0-1) and aim (0-1) from the UI shot meter
   */
  public throwBall(
    playerId: string,
    power: number,
    aim: number,
    playerDirection: { x: number; y: number; z: number }
  ): boolean {
    const ballInfo = this.activeBalls.get(playerId);
    if (!ballInfo) {
      console.error(`Cannot throw: No active ball for player ${playerId}`);
      return false;
    }

    const { ball } = ballInfo;
    if (!ball.isSpawned) {
      console.error('Cannot throw: Ball is not spawned');
      return false;
    }

    // Add slight upward angle for arc (basketball shot)
    const throwDirection = {
      x: playerDirection.x,
      y: Math.max(0.3, playerDirection.y + 0.4), // Ensure upward arc
      z: playerDirection.z,
    };

    // Normalize direction
    const magnitude = Math.sqrt(
      throwDirection.x ** 2 + throwDirection.y ** 2 + throwDirection.z ** 2
    );
    const normalizedDirection = {
      x: throwDirection.x / magnitude,
      y: throwDirection.y / magnitude,
      z: throwDirection.z / magnitude,
    };

    // Throw the ball with calculated direction and power
    ball.throw(normalizedDirection, power, aim);

    console.log(`Player ${playerId} threw ball with power ${power.toFixed(2)}, aim ${aim.toFixed(2)}`);
    return true;
  }

  /**
   * Get active ball for a player
   */
  public getPlayerBall(playerId: string): BasketballEntity | null {
    const ballInfo = this.activeBalls.get(playerId);
    return ballInfo?.ball ?? null;
  }

  /**
   * Check if player has an active ball
   */
  public hasActiveBall(playerId: string): boolean {
    const ballInfo = this.activeBalls.get(playerId);
    return ballInfo?.ball?.isSpawned ?? false;
  }

  /**
   * Clean up all balls (useful for server shutdown or testing)
   */
  public cleanup() {
    for (const [playerId, ballInfo] of this.activeBalls.entries()) {
      if (ballInfo.ball.isSpawned) {
        ballInfo.ball.despawn();
      }
    }
    this.activeBalls.clear();
    console.log('BallSpawnSystem cleaned up');
  }

  /**
   * Clean up balls for a specific player (when they leave)
   */
  public cleanupPlayer(playerId: string) {
    const ballInfo = this.activeBalls.get(playerId);
    if (ballInfo?.ball?.isSpawned) {
      ballInfo.ball.despawn();
    }
    this.activeBalls.delete(playerId);
    console.log(`Cleaned up balls for player ${playerId}`);
  }
}
