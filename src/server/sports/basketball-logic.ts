// PSEUDOCODE: Basketball shot resolution for challenges.

type PlayerStats = {
  accuracy: number;
  stamina: number;
  power: number;
  speed: number;
};

type ShotInput = {
  playerId: string;
  sessionId: string;
  shotType: "layup" | "midrange" | "three";
  timing: number;    // 0–1, 1 = perfect release
  aimOffset: number; // 0–1, 0 = perfect aim
  contested: boolean;
};

export type ShotResult = {
  made: boolean;
  points: number;
  reason: "perfect" | "good" | "okay" | "bad_timing" | "bad_aim" | "contested_miss";
};

export class BasketballLogic {
  constructor(private getPlayerStats: (playerId: string) => PlayerStats) {}

  resolveShot(input: ShotInput): ShotResult {
    const stats = this.getPlayerStats(input.playerId);

    let baseMakeChance: number;
    let basePoints: number;

    switch (input.shotType) {
      case "layup":
        baseMakeChance = 0.85;
        basePoints = 2;
        break;
      case "midrange":
        baseMakeChance = 0.65;
        basePoints = 2;
        break;
      case "three":
        baseMakeChance = 0.45;
        basePoints = 3;
        break;
      default:
        baseMakeChance = 0.5;
        basePoints = 2;
    }

    const timingDelta = Math.abs(1 - input.timing);
    let timingModifier: number;
    let timingReason: ShotResult["reason"] = "okay";

    if (timingDelta <= 0.05) {
      timingModifier = 1.2;
      timingReason = "perfect";
    } else if (timingDelta <= 0.15) {
      timingModifier = 1.0;
      timingReason = "good";
    } else if (timingDelta <= 0.3) {
      timingModifier = 0.8;
      timingReason = "okay";
    } else {
      timingModifier = 0.5;
      timingReason = "bad_timing";
    }

    let aimModifier: number;
    let aimReason: ShotResult["reason"] | null = null;
    if (input.aimOffset <= 0.1) {
      aimModifier = 1.1;
    } else if (input.aimOffset <= 0.3) {
      aimModifier = 1.0;
    } else if (input.aimOffset <= 0.5) {
      aimModifier = 0.8;
      aimReason = "bad_aim";
    } else {
      aimModifier = 0.5;
      aimReason = "bad_aim";
    }

    const contestModifier = input.contested ? 0.7 : 1.0;
    const statModifier = 0.9 + stats.accuracy * 0.2;

    let finalChance = baseMakeChance * timingModifier * aimModifier * contestModifier * statModifier;
    finalChance = Math.max(0.05, Math.min(0.95, finalChance));

    const roll = Math.random();
    const made = roll <= finalChance;

    let resultReason: ShotResult["reason"] =
      aimReason ?? timingReason ?? "okay";
    if (!made && input.contested) {
      resultReason = "contested_miss";
    }

    return {
      made,
      points: made ? basePoints : 0,
      reason: resultReason
    };
  }
}
