import type { World, Player } from 'hytopia';
import zonesConfig from '../../../config/zones.json' with { type: "json" };

type FieldTrigger = {
  fieldId: string;
  sport: string;
  mode: string;
  position: { x: number; y: number; z: number };
  radius: number;
};

export class TriggerSystem {
  private triggers: FieldTrigger[] = [];
  private playerInTrigger: Map<string, string> = new Map(); // playerId -> fieldId
  private playerMap: Map<string, Player> = new Map();

  constructor(private world: World) {}

  /**
   * Register a player for trigger checking
   */
  registerPlayer(player: Player) {
    this.playerMap.set(player.id, player);
  }

  /**
   * Unregister a player
   */
  unregisterPlayer(playerId: string) {
    this.playerMap.delete(playerId);
    this.playerInTrigger.delete(playerId);
  }

  /**
   * Create trigger volumes for all sports fields from config
   */
  setupTriggers() {
    console.log('Setting up field triggers...');

    for (const zone of zonesConfig.zones) {
      if (zone.type === 'hub') continue;

      const fields = (zone as any).sportsFields || [];
      for (const field of fields) {
        this.triggers.push({
          fieldId: field.id,
          sport: field.sport,
          mode: field.mode || 'challenge',
          position: {
            x: field.center.x,
            y: field.center.y,
            z: field.center.z,
          },
          radius: 15, // 15 block radius trigger area
        });
      }
    }

    console.log(`✅ Created ${this.triggers.length} field triggers`);
  }

  /**
   * Update trigger checks (call this each tick)
   */
  update() {
    for (const [playerId, player] of this.playerMap) {
      // Get player entities for this player
      const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
      if (playerEntities.length === 0) continue;

      const playerEntity = playerEntities[0];
      const playerPos = playerEntity.rawRigidBody.translation();

      // Check if player is near any field
      let nearestField: FieldTrigger | null = null;
      let nearestDistance = Infinity;

      for (const trigger of this.triggers) {
        const dx = playerPos.x - trigger.position.x;
        const dz = playerPos.z - trigger.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < trigger.radius && distance < nearestDistance) {
          nearestField = trigger;
          nearestDistance = distance;
        }
      }

      const currentField = this.playerInTrigger.get(playerId);

      if (nearestField && currentField !== nearestField.fieldId) {
        // Player entered a new field
        this.playerInTrigger.set(playerId, nearestField.fieldId);
        player.ui.sendData({
          type: 'enteredSportsFieldTrigger',
          fieldId: nearestField.fieldId,
          sport: nearestField.sport,
          mode: nearestField.mode,
        });
      } else if (!nearestField && currentField) {
        // Player left the field
        this.playerInTrigger.delete(playerId);
        player.ui.sendData({
          type: 'exitedSportsFieldTrigger',
        });
      }
    }
  }

  /**
   * Clean up when player leaves the world
   */
  cleanupPlayer(playerId: string) {
    this.unregisterPlayer(playerId);
  }
}
