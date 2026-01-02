import { ChallengeSystem } from "./systems/challenge-system";
import { BasketballLogic } from "./sports/basketball-logic";
import { BallSpawnSystem } from "./systems/ball-spawn-system";
import type { World, Player } from "hytopia";
import { PlayerManager } from "hytopia";

type ServerConnection = {
  id: string;
  send(msg: any): void;
};

type IncomingMessage = {
  type: string;
  [key: string]: any;
};

export class UiMessageHandler {
  private ballSpawnSystem?: BallSpawnSystem;

  constructor(
    private challengeSystem: ChallengeSystem,
    private basketballLogic: BasketballLogic,
    private world?: World
  ) {
    if (world) {
      this.ballSpawnSystem = new BallSpawnSystem(world);
    }
  }

  handle(connection: ServerConnection, msg: IncomingMessage) {
    switch (msg.type) {
      case "uiRequestStartChallenge":
        this.handleStartChallenge(connection, msg);
        break;
      case "uiCancelChallenge":
        this.handleCancelChallenge(connection);
        break;
      case "basketballShotAttempt":
        this.handleBasketballShotAttempt(connection, msg);
        break;
      case "uiEmote":
        this.handleEmote(connection, msg);
        break;
      case "uiQuickChat":
        this.handleQuickChat(connection, msg);
        break;
      default:
        console.log('Unknown UI message type:', msg.type);
        break;
    }
  }

  private handleStartChallenge(conn: ServerConnection, msg: any) {
    const playerId = conn.id;
    const { sport, challengeId } = msg;
    this.challengeSystem.startChallenge(playerId, sport, challengeId);
  }

  private handleCancelChallenge(conn: ServerConnection) {
    const playerId = conn.id;
    this.challengeSystem.cancelChallenge(playerId);
  }

  private handleBasketballShotAttempt(conn: ServerConnection, msg: any) {
    const playerId = conn.id;
    const { challengeSessionId, timing, aimOffset } = msg;

    const challenge = this.challengeSystem.getChallengeForSession(challengeSessionId);
    if (!challenge || challenge.playerId !== playerId || challenge.sport !== "basketball") {
      console.error('Invalid challenge for basketball shot');
      return;
    }

    if (!this.ballSpawnSystem || !this.world) {
      console.error('BallSpawnSystem not initialized');
      return;
    }

    // Get player to get camera direction
    const player = PlayerManager.instance.getConnectedPlayers().find((p: Player) => p.id === playerId);
    if (!player) {
      console.error('Player not found');
      return;
    }

    // Use camera facing direction for shot
    const direction = player.camera.facingDirection;

    // Spawn ball if player doesn't have one
    if (!this.ballSpawnSystem.hasActiveBall(playerId)) {
      const ball = this.ballSpawnSystem.spawnBallForPlayer(
        playerId,
        (points: number, shotType: string) => {
          // Ball scored!
          console.log(`Player ${playerId} scored ${points} points (${shotType})`);
          this.challengeSystem.registerHit(playerId, points);

          // Send success result to client
          conn.send({
            type: "basketballShotResult",
            challengeSessionId,
            playerId,
            made: true,
            points,
            reason: timing > 0.8 ? "perfect" : timing > 0.6 ? "good" : "okay"
          });
        },
        () => {
          // Ball missed
          console.log(`Player ${playerId} missed the shot`);

          // Send miss result to client
          conn.send({
            type: "basketballShotResult",
            challengeSessionId,
            playerId,
            made: false,
            points: 0,
            reason: aimOffset > 0.5 ? "bad_aim" : "bad_timing"
          });
        }
      );

      if (!ball) {
        console.error('Failed to spawn basketball');
        return;
      }
    }

    // Throw the ball
    const power = timing; // Use timing as power (0-1)
    const aim = 1 - aimOffset; // Convert aim offset to aim accuracy

    const thrown = this.ballSpawnSystem.throwBall(playerId, power, aim, direction);

    if (!thrown) {
      console.error('Failed to throw basketball');
    } else {
      console.log(`Ball thrown with timing: ${timing.toFixed(2)}, aim: ${aim.toFixed(2)}`);
    }
  }

  private handleEmote(conn: ServerConnection, msg: any) {
    const playerId = conn.id;
    const { emoteId } = msg;

    console.log(`Player ${playerId} used emote: ${emoteId}`);

    // Broadcast emote to all players in the world
    if (this.world) {
      // In a full implementation, you would:
      // 1. Trigger an emote animation on the player entity
      // 2. Broadcast to nearby players
      // For now, broadcast to chat
      const emoteIcons: Record<string, string> = {
        wave: '👋',
        thumbsup: '👍',
        clap: '👏',
        fire: '🔥',
        heart: '❤️',
        laugh: '😂',
        flex: '💪',
        thinking: '🤔'
      };
      const icon = emoteIcons[emoteId] || '⭐';
      this.world.chatManager.sendBroadcastMessage(`Player used emote: ${icon}`, 'AAAAAA');
    }
  }

  private handleQuickChat(conn: ServerConnection, msg: any) {
    const playerId = conn.id;
    const { messageId, message } = msg;

    console.log(`Player ${playerId} quick chat: ${message}`);

    // Broadcast quick chat to all players
    if (this.world) {
      this.world.chatManager.sendBroadcastMessage(`Player: ${message}`, 'FFFFFF');
    }
  }

  /**
   * Clean up resources for a player who left
   */
  public cleanupPlayer(playerId: string) {
    if (this.ballSpawnSystem) {
      this.ballSpawnSystem.cleanupPlayer(playerId);
    }
  }
}
