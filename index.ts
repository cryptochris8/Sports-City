/**
 * Pregame City - Hytopia Sports World
 *
 * A multiplayer sports world where players explore a city and play
 * solo shooting/skill challenges for basketball, football, soccer,
 * baseball, and tennis.
 */

import {
  startServer,
  Audio,
  DefaultPlayerEntity,
  PlayerEvent,
  PlayerUIEvent,
  type World,
  type Player,
} from 'hytopia';

import worldMap from './assets/map.json' with { type: "json" };
import zonesConfig from './config/zones.json' with { type: "json" };
import progressionConfig from './config/progression.json' with { type: "json" };

import { ChallengeSystem } from './src/server/systems/challenge-system';
import { BasketballLogic } from './src/server/sports/basketball-logic';
import { UiMessageHandler } from './src/server/ui-message-handler';
import { TriggerSystem } from './src/server/systems/trigger-system';

// Player data tracking
type PlayerData = {
  id: string;
  xp: number;
  coins: number;
  rank: string;
  entity: DefaultPlayerEntity | null;
};

const playerDataMap = new Map<string, PlayerData>();

/**
 * Get player rank based on XP
 */
function getRankForXp(xp: number): string {
  const ranks = progressionConfig.ranks;
  let currentRank = ranks[0].id;

  for (const rank of ranks) {
    if (xp >= rank.minXp) {
      currentRank = rank.id;
    } else {
      break;
    }
  }

  return currentRank;
}

/**
 * Get or create player data
 */
function getPlayerData(playerId: string): PlayerData {
  if (!playerDataMap.has(playerId)) {
    playerDataMap.set(playerId, {
      id: playerId,
      xp: 0,
      coins: 0,
      rank: 'rookie',
      entity: null,
    });
  }
  return playerDataMap.get(playerId)!;
}

/**
 * Send player stats update
 */
function sendPlayerStatsUpdate(world: World, player: Player) {
  const data = getPlayerData(player.id);

  player.ui.sendData({
    type: 'xpUpdated',
    xp: data.xp,
    rank: data.rank,
  });

  player.ui.sendData({
    type: 'coinsUpdated',
    coins: data.coins,
  });
}

/**
 * Award XP and coins to a player
 */
function awardPlayerRewards(world: World, player: Player, xp: number, coins: number) {
  const data = getPlayerData(player.id);
  const oldRank = data.rank;

  data.xp += xp;
  data.coins += coins;
  data.rank = getRankForXp(data.xp);

  // Send updates
  sendPlayerStatsUpdate(world, player);

  // Notify rank up
  if (data.rank !== oldRank) {
    player.ui.sendData({
      type: 'notification',
      category: 'xp',
      message: `Rank Up! You are now ${data.rank.toUpperCase()}!`,
    });
  }
}

/**
 * World wrapper for challenge system
 */
class WorldWrapper {
  private playerMap: Map<string, Player> = new Map();

  constructor(private world: World) {}

  registerPlayer(player: Player) {
    this.playerMap.set(player.id, player);
  }

  unregisterPlayer(playerId: string) {
    this.playerMap.delete(playerId);
  }

  sendEventToPlayer(playerId: string, type: string, payload: any) {
    const player = this.playerMap.get(playerId);
    if (!player) return;

    player.ui.sendData({ type, ...payload });

    // Handle XP/coin rewards
    if (type === 'challengeEnded' && payload.xpEarned > 0) {
      awardPlayerRewards(this.world, player, payload.xpEarned, payload.coinsEarned);
    }
  }
}

startServer(world => {
  console.log('🏀 Pregame City server starting...');

  // Load map
  world.loadMap(worldMap);

  // Initialize systems
  const worldWrapper = new WorldWrapper(world);
  const challengeSystem = new ChallengeSystem(worldWrapper as any);
  const triggerSystem = new TriggerSystem(world);

  // Set up field triggers
  triggerSystem.setupTriggers();

  const getPlayerStats = (playerId: string) => ({
    accuracy: 1.0,
    stamina: 1.0,
    power: 1.0,
    speed: 1.0,
  });

  const basketballLogic = new BasketballLogic(getPlayerStats);
  const uiMessageHandler = new UiMessageHandler(challengeSystem, basketballLogic);

  // Set up world tick for challenge system and trigger updates
  let lastTime = Date.now();
  world.on('tick', () => {
    const now = Date.now();
    const dt = (now - lastTime) / 1000; // Convert to seconds
    lastTime = now;

    challengeSystem.update(dt);
    triggerSystem.update();
  });

  console.log('✅ Challenge system initialized');

  // Handle player joining
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    console.log(`Player ${player.id} joined`);

    // Register player with world wrapper and trigger system
    worldWrapper.registerPlayer(player);
    triggerSystem.registerPlayer(player);

    const playerData = getPlayerData(player.id);

    // Create player entity and spawn at central hub
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });

    // Spawn at central hub (from zones.json)
    const centralHub = zonesConfig.zones.find(z => z.id === 'central_hub_plaza');
    const spawnPoint = centralHub?.spawnPoint || { x: 0, y: 0, z: 0 };
    playerEntity.spawn(world, { x: spawnPoint.x, y: spawnPoint.y + 10, z: spawnPoint.z });

    playerData.entity = playerEntity;

    // Load UI
    player.ui.load('ui/index.html');

    // Listen for UI messages from this player
    player.ui.on(PlayerUIEvent.DATA, ({ data }) => {
      // Ensure data has a type field
      if (data && typeof data === 'object' && 'type' in data) {
        uiMessageHandler.handle(
          {
            id: player.id,
            send: (msgData: any) => player.ui.sendData(msgData),
          },
          data as any
        );
      }
    });

    // Send initial stats
    sendPlayerStatsUpdate(world, player);

    // Welcome messages
    world.chatManager.sendPlayerMessage(player, 'Welcome to Pregame City!', '00FF00');
    world.chatManager.sendPlayerMessage(player, 'Explore the city and find sports fields to start challenges!');
    world.chatManager.sendPlayerMessage(player, 'Walk up to a field and press E to start.');
  });

  // Handle player leaving
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    console.log(`Player ${player.id} left`);

    // Unregister from world wrapper
    worldWrapper.unregisterPlayer(player.id);

    // Clean up entities
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());

    // Clean up trigger system
    triggerSystem.cleanupPlayer(player.id);

    // Note: We keep player data in memory for now (in production, save to database)
    const playerData = playerDataMap.get(player.id);
    if (playerData) {
      playerData.entity = null;
    }
  });

  // Fun commands
  world.chatManager.registerCommand('/rocket', player => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => {
      entity.applyImpulse({ x: 0, y: 20, z: 0 });
    });
  });

  world.chatManager.registerCommand('/stats', player => {
    const data = getPlayerData(player.id);
    world.chatManager.sendPlayerMessage(player, `XP: ${data.xp} | Coins: ${data.coins} | Rank: ${data.rank.toUpperCase()}`, 'FFFF00');
  });

  // Ambient music
  new Audio({
    uri: 'audio/music/hytopia-main.mp3',
    loop: true,
    volume: 0.1,
  }).play(world);

  console.log('🎮 Pregame City server ready!');
});
