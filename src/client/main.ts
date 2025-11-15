// Client bootstrap

import { setupNetworkBridge } from './network';
import { Hud } from './ui/hud';
import { InputController } from './controllers/input-controller';

export async function initClient(client: any) {
  console.log('🎮 Pregame City client initializing...');

  // Set up network event bridge
  setupNetworkBridge(client);

  // Initialize HUD
  new Hud(client, 'hud-root');

  // Initialize input controller
  new InputController(client);

  console.log('✅ Pregame City client ready!');
}

// For standalone testing (if needed)
if (typeof window !== 'undefined' && (window as any).hytopiaClient) {
  initClient((window as any).hytopiaClient).catch(console.error);
}
