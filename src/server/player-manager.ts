// PSEUDOCODE: player teleport + proximity helpers.

type Vec3 = { x: number; y: number; z: number };

type WorldLike = {
  getPlayerEntity(playerId: string): any | null;
  sendEventToPlayer(playerId: string, type: string, payload: any): void;
  getAllPlayerIds(): string[];
};

export class PlayerManager {
  constructor(private world: WorldLike) {}

  teleportPlayer(playerId: string, position: Vec3, rotationY: number) {
    const player = this.world.getPlayerEntity(playerId);
    if (!player) return;
    const transform = player.getComponent("Transform") || player.addComponent("Transform");
    transform.position.x = position.x;
    transform.position.y = position.y;
    transform.position.z = position.z;
    transform.rotation.y = rotationY;

    this.world.sendEventToPlayer(playerId, "teleportToField", {
      position,
      rotation: { y: rotationY }
    });
  }
}
