import sportsConfig from "../../../config/sports_minigames.json" with { type: "json" };

type ChallengeConfig = {
  id: string;
  displayName: string;
  durationSeconds: number;
  xpPerHit?: number;
  coinsPerHit?: number;
  bonusXpOnFinish?: number;
};

type ActiveChallenge = {
  challengeSessionId: string;
  playerId: string;
  sport: string;
  challengeId: string;
  config: ChallengeConfig;
  score: number;
  hits: number;
  timeRemaining: number;
  state: "active" | "ended";
};

type WorldLike = {
  sendEventToPlayer(playerId: string, type: string, payload: any): void;
};

export class ChallengeSystem {
  private activeChallenges: Map<string, ActiveChallenge> = new Map(); // key: playerId

  constructor(private world: WorldLike) {}

  private getChallengeConfig(sport: string, challengeId: string): ChallengeConfig | null {
    const sports = (sportsConfig as any).sports;
    const sportCfg = sports[sport];
    if (!sportCfg) return null;
    const challenges = sportCfg.challenges || [];
    return challenges.find((c: any) => c.id === challengeId) ?? null;
  }

  startChallenge(playerId: string, sport: string, challengeId: string): ActiveChallenge | null {
    const cfg = this.getChallengeConfig(sport, challengeId);
    if (!cfg) {
      this.world.sendEventToPlayer(playerId, "notification", {
        category: "info",
        message: "Challenge not available yet."
      });
      return null;
    }

    const existing = this.activeChallenges.get(playerId);
    if (existing && existing.state === "active") {
      this.endChallenge(playerId, "replaced");
    }

    const challengeSessionId = `challenge_${sport}_${playerId}_${Date.now()}`;
    const challenge: ActiveChallenge = {
      challengeSessionId,
      playerId,
      sport,
      challengeId,
      config: cfg,
      score: 0,
      hits: 0,
      timeRemaining: cfg.durationSeconds,
      state: "active"
    };

    this.activeChallenges.set(playerId, challenge);

    this.world.sendEventToPlayer(playerId, "challengeStarted", {
      challengeSessionId,
      challengeId,
      sport,
      durationSeconds: cfg.durationSeconds
    });

    return challenge;
  }

  cancelChallenge(playerId: string) {
    this.endChallenge(playerId, "cancelled");
  }

  private endChallenge(playerId: string, reason: "completed" | "cancelled" | "replaced") {
    const challenge = this.activeChallenges.get(playerId);
    if (!challenge || challenge.state === "ended") return;

    challenge.state = "ended";
    this.activeChallenges.delete(playerId);

    const cfg = challenge.config;
    const xpEarned = (challenge.hits * (cfg.xpPerHit ?? 0)) + (cfg.bonusXpOnFinish ?? 0);
    const coinsEarned = challenge.hits * (cfg.coinsPerHit ?? 0);

    this.world.sendEventToPlayer(playerId, "challengeEnded", {
      challengeSessionId: challenge.challengeSessionId,
      sport: challenge.sport,
      challengeId: challenge.challengeId,
      finalScore: challenge.score,
      xpEarned,
      coinsEarned,
      reason
    });
  }

  update(dt: number) {
    for (const [playerId, challenge] of Array.from(this.activeChallenges.entries())) {
      if (challenge.state !== "active") continue;
      challenge.timeRemaining -= dt;
      if (challenge.timeRemaining <= 0) {
        challenge.timeRemaining = 0;
        this.endChallenge(playerId, "completed");
      }
    }
  }

  registerHit(playerId: string, points: number) {
    const challenge = this.activeChallenges.get(playerId);
    if (!challenge || challenge.state !== "active") return;
    challenge.hits += 1;
    challenge.score += points;

    this.world.sendEventToPlayer(playerId, "challengeScoreUpdated", {
      challengeSessionId: challenge.challengeSessionId,
      sport: challenge.sport,
      score: challenge.score,
      timeRemaining: challenge.timeRemaining
    });
  }

  getChallengeForSession(sessionId: string): ActiveChallenge | null {
    for (const ch of this.activeChallenges.values()) {
      if (ch.challengeSessionId === sessionId) return ch;
    }
    return null;
  }
}
