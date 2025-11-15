import { ChallengeSystem } from "./systems/challenge-system";
import { BasketballLogic } from "./sports/basketball-logic";

type ServerConnection = {
  id: string;
  send(msg: any): void;
};

type IncomingMessage = {
  type: string;
  [key: string]: any;
};

export class UiMessageHandler {
  constructor(
    private challengeSystem: ChallengeSystem,
    private basketballLogic: BasketballLogic
  ) {}

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
      default:
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
    const { challengeSessionId, shotType, timing, aimOffset, contested } = msg;

    const challenge = this.challengeSystem.getChallengeForSession(challengeSessionId);
    if (!challenge || challenge.playerId != playerId || challenge.sport !== "basketball") {
      return;
    }

    const result = this.basketballLogic.resolveShot({
      playerId,
      sessionId: challengeSessionId,
      shotType,
      timing,
      aimOffset,
      contested
    });

    if (result.made) {
      this.challengeSystem.registerHit(playerId, result.points);
    }

    conn.send({
      type: "basketballShotResult",
      challengeSessionId,
      playerId,
      made: result.made,
      points: result.points,
      reason: result.reason
    });
  }
}
