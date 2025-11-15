// HUD – attach to browser DOM and listen for events

type HudState = {
  zoneId: string | null;
  inChallenge: boolean;
  sport: string | null;
  challengeName: string | null;
  timeRemaining: number | null;
  rank: string;
  xp: number;
  coins: number;
  score: number;
};

const initialHudState: HudState = {
  zoneId: null,
  inChallenge: false,
  sport: null,
  challengeName: null,
  timeRemaining: null,
  rank: "rookie",
  xp: 0,
  coins: 0,
  score: 0
};

export class Hud {
  private state: HudState = { ...initialHudState };
  private rootEl: HTMLElement;

  constructor(private client: any, rootElId: string = "hud-root") {
    this.rootEl = document.getElementById(rootElId) ?? this.createRootElement();
    this.registerEventHandlers();
    this.render();
  }

  private createRootElement(): HTMLElement {
    const el = document.createElement("div");
    el.id = "hud-root";
    document.body.appendChild(el);
    return el;
  }

  private registerEventHandlers() {
    this.client.on("zoneChanged", (data: any) => {
      this.state.zoneId = data.zoneId;
      this.render();
    });

    this.client.on("challengeStarted", (data: any) => {
      this.state.inChallenge = true;
      this.state.sport = data.sport;
      this.state.challengeName = data.challengeId;
      this.state.timeRemaining = data.durationSeconds;
      this.state.score = 0;
      this.render();
    });

    this.client.on("challengeScoreUpdated", (data: any) => {
      this.state.score = data.score;
      this.state.timeRemaining = data.timeRemaining;
      this.render();
    });

    this.client.on("challengeEnded", () => {
      this.state.inChallenge = false;
      this.state.timeRemaining = null;
      this.state.challengeName = null;
      this.render();
    });

    this.client.on("xpUpdated", (data: any) => {
      this.state.xp = data.xp;
      this.state.rank = data.rank;
      this.render();
    });

    this.client.on("coinsUpdated", (data: any) => {
      this.state.coins = data.coins;
      this.render();
    });
  }

  private formatTime(seconds: number | null): string {
    if (seconds == null) return "--:--";
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  }

  private render() {
    const s = this.state;

    const banner = s.inChallenge
      ? `
      <div class="hud-banner-main">
        <span class="hud-banner-icon">${this.getSportIcon(s.sport)}</span>
        <span class="hud-banner-title">${(s.sport ?? "").toUpperCase()} – Challenge</span>
        <span class="hud-banner-timer">${this.formatTime(s.timeRemaining)}</span>
        <span class="hud-banner-rank">Rank: ${s.rank.toUpperCase()}</span>
      </div>`
      : `
      <div class="hud-banner-main">
        <span class="hud-banner-icon">🏙️</span>
        <span class="hud-banner-title">Pregame City – Free Roam</span>
        <span class="hud-banner-zone">${s.zoneId ? `Zone: ${s.zoneId}` : ""}</span>
        <span class="hud-banner-rank">Rank: ${s.rank.toUpperCase()}</span>
      </div>`;

    const topBanner = `<div class="hud-top-banner">${banner}</div>`;

    const scorePanel = s.inChallenge
      ? `<div class="hud-mini-scores">
          <div class="hud-mini-score-row">
            <span class="hud-mini-score-name">Score</span>
            <span class="hud-mini-score-value">${s.score}</span>
          </div>
        </div>`
      : "";

    const playerCard = `
      <div class="hud-player-card">
        <div class="hud-player-header">
          <div class="hud-avatar-circle">🏅</div>
          <div class="hud-player-text">
            <div class="hud-player-name">You</div>
            <div class="hud-player-rank">${s.rank.toUpperCase()}</div>
          </div>
        </div>
        <div class="hud-xp-bar">
          <div class="hud-xp-fill" style="width: ${Math.min(100, (s.xp % 1000) / 10)}%;"></div>
        </div>
        <div class="hud-player-meta">
          <span>XP: ${s.xp}</span>
          <span>Coins: ${s.coins}</span>
        </div>
      </div>
    `;

    const actionsBar = `
      <div class="hud-actions-bar">
        <span class="hud-action-key">E</span> <span class="hud-action-text">Interact / Start Challenge</span>
        <span class="hud-action-divider">|</span>
        <span class="hud-action-key">Tab</span> <span class="hud-action-text">Scoreboard</span>
        <span class="hud-action-divider">|</span>
        <span class="hud-action-key">G</span> <span class="hud-action-text">Emote Wheel</span>
        <span class="hud-action-divider">|</span>
        <span class="hud-action-key">C</span> <span class="hud-action-text">Quick Chat</span>
      </div>
    `;

    const emoteChat = `
      <div class="hud-emote-chat">
        <div class="hud-emote-btn">G – Emotes</div>
        <div class="hud-chat-btn">C – Quick Chat</div>
      </div>
    `;

    this.rootEl.innerHTML = `
      <div class="hud-root-inner">
        ${topBanner}
        <div class="hud-top-right-wrapper">
          ${scorePanel}
        </div>
        <div class="hud-bottom-left-wrapper">
          ${playerCard}
        </div>
        <div class="hud-bottom-center-wrapper">
          ${actionsBar}
        </div>
        <div class="hud-bottom-right-wrapper">
          ${emoteChat}
        </div>
      </div>
    `;
  }

  private getSportIcon(sport: string | null): string {
    switch (sport) {
      case "basketball": return "🏀";
      case "football": return "🏈";
      case "soccer": return "⚽";
      case "baseball": return "⚾";
      case "tennis": return "🎾";
      default: return "⭐";
    }
  }
}
