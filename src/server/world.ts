// PSEUDOCODE: Wire systems together in your Hytopia server bootstrap.

import { ChallengeSystem } from "./systems/challenge-system";
import { BasketballLogic } from "./sports/basketball-logic";
import { UiMessageHandler } from "./ui-message-handler";

type WorldLike = {
  sendEventToPlayer(playerId: string, type: string, payload: any): void;
  onConnection(handler: (conn: any) => void): void;
  onUpdate(handler: (dt: number) => void): void;
};

export function setupWorld(world: WorldLike) {
  const challengeSystem = new ChallengeSystem(world as any);

  const getPlayerStats = (playerId: string) => ({
    accuracy: 1.0,
    stamina: 1.0,
    power: 1.0,
    speed: 1.0
  });

  const basketballLogic = new BasketballLogic(getPlayerStats);
  const uiHandler = new UiMessageHandler(challengeSystem, basketballLogic);

  world.onConnection(conn => {
    conn.onMessage((msg: any) => uiHandler.handle(conn, msg));
  });

  world.onUpdate((dt: number) => {
    challengeSystem.update(dt);
  });
}
