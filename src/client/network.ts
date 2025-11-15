// Bridge raw server messages to client event system

type EventHandler = (data: any) => void;

export class EventEmitter {
  private handlers: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  emit(event: string, data?: any) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

export function setupNetworkBridge(client: any) {
  const emitter = new EventEmitter();

  // Expose event methods on client
  client.on = emitter.on.bind(emitter);
  client.emit = emitter.emit.bind(emitter);

  // Listen for UI messages from server
  if (client.ui && client.ui.on) {
    client.ui.on('message', (msg: any) => {
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'zoneChanged':
        case 'challengeStarted':
        case 'challengeScoreUpdated':
        case 'challengeEnded':
        case 'xpUpdated':
        case 'coinsUpdated':
        case 'notification':
        case 'enteredSportsFieldTrigger':
        case 'exitedSportsFieldTrigger':
        case 'basketballShotResult':
          emitter.emit(msg.type, msg);
          break;
        default:
          console.log('Unknown message type:', msg.type);
          break;
      }
    });
  }

  return emitter;
}
