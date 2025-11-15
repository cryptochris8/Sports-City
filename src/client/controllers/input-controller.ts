// Handles E/G/C input and nearby field context

type NearbyFieldContext = {
  fieldId: string;
  sport: string;
};

export class InputController {
  private nearbyField: NearbyFieldContext | null = null;

  constructor(private client: any) {
    this.registerKeybinds();
    this.registerFieldEvents();
  }

  private registerKeybinds() {
    window.addEventListener('keydown', e => {
      // Ignore if user is typing in chat or other input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        if (this.nearbyField) {
          this.startChallengeForField(this.nearbyField);
        }
      }

      if (e.key === 'g' || e.key === 'G') {
        console.log('Open emote wheel (stub)');
        // TODO: Implement emote wheel UI
      }

      if (e.key === 'c' || e.key === 'C') {
        console.log('Open quick chat (stub)');
        // TODO: Implement quick chat UI
      }
    });
  }

  private registerFieldEvents() {
    this.client.on('enteredSportsFieldTrigger', (data: any) => {
      this.nearbyField = {
        fieldId: data.fieldId,
        sport: data.sport,
      };
      console.log(`Entered ${data.sport} field: ${data.fieldId}`);
    });

    this.client.on('exitedSportsFieldTrigger', () => {
      this.nearbyField = null;
      console.log('Exited field');
    });
  }

  private startChallengeForField(field: NearbyFieldContext) {
    console.log(`Starting challenge for ${field.sport} at ${field.fieldId}`);

    if (this.client.ui && this.client.ui.send) {
      this.client.ui.send({
        type: 'uiRequestStartChallenge',
        sport: field.sport,
        challengeId: this.getDefaultChallengeId(field.sport),
        fieldId: field.fieldId,
      });
    }
  }

  private getDefaultChallengeId(sport: string): string {
    switch (sport) {
      case 'basketball':
        return 'basketball_shooting_60s';
      case 'soccer':
        return 'soccer_penalty_kicks';
      case 'football':
        return 'football_passing';
      case 'baseball':
        return 'baseball_batting';
      case 'tennis':
        return 'tennis_serving';
      default:
        return 'basketball_shooting_60s';
    }
  }
}
