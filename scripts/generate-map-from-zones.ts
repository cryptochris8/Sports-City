import fs from "node:fs";
import path from "node:path";

type Vec3 = { x: number; y: number; z: number };

type SportsField = {
  id: string;
  sport: string;
  mode: string;
  center: Vec3;
  maxPlayers: number;
};

type ZoneConfig = {
  id: string;
  type: string;
  center: Vec3;
  radius: number;
  spawnPoint?: Vec3;
  sportsFields?: SportsField[];
};

type ZonesFile = {
  version: number;
  zones: ZoneConfig[];
};

type BlockType = {
  id: number;
  name: string;
  textureUri: string;
  isCustom: boolean;
  isMultiTexture: boolean;
  isLiquid?: boolean;
};

type MapData = {
  blockTypes: BlockType[];
  blocks: Record<string, number>;
};

// Define block type IDs
const BLOCK_IDS = {
  GRASS: 1,
  STONE: 2,
  BRICKS: 3,
  SMOOTH_STONE: 4,
  WHITE_CONCRETE: 5,
  ORANGE_CONCRETE: 6,
  LIGHT_GRAY_CONCRETE: 7,
  GRAY_CONCRETE: 8,
  BLACK_CONCRETE: 9,
  OAK_PLANKS: 10,
  SPRUCE_PLANKS: 11,
  GLASS: 12,
  OAK_LEAVES: 13,
  OAK_LOG: 14,
  WATER: 15,
};

function defineBlockTypes(): BlockType[] {
  return [
    {
      id: BLOCK_IDS.GRASS,
      name: "grass-block",
      textureUri: "blocks/grass-block",
      isCustom: false,
      isMultiTexture: true,
    },
    {
      id: BLOCK_IDS.STONE,
      name: "stone",
      textureUri: "blocks/stone.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.BRICKS,
      name: "bricks",
      textureUri: "blocks/bricks.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.SMOOTH_STONE,
      name: "smooth-stone",
      textureUri: "blocks/smooth-stone.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.WHITE_CONCRETE,
      name: "white-concrete",
      textureUri: "blocks/white-concrete.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.ORANGE_CONCRETE,
      name: "orange-concrete",
      textureUri: "blocks/orange-concrete.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.LIGHT_GRAY_CONCRETE,
      name: "light-gray-concrete",
      textureUri: "blocks/light-gray-concrete.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.GRAY_CONCRETE,
      name: "gray-concrete",
      textureUri: "blocks/gray-concrete.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.BLACK_CONCRETE,
      name: "black-concrete",
      textureUri: "blocks/black-concrete.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.OAK_PLANKS,
      name: "oak-planks",
      textureUri: "blocks/oak-planks.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.SPRUCE_PLANKS,
      name: "spruce-planks",
      textureUri: "blocks/spruce-planks.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.GLASS,
      name: "glass",
      textureUri: "blocks/glass.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.OAK_LEAVES,
      name: "oak-leaves",
      textureUri: "blocks/oak-leaves.png",
      isCustom: false,
      isMultiTexture: false,
    },
    {
      id: BLOCK_IDS.OAK_LOG,
      name: "oak-log",
      textureUri: "blocks/oak-log",
      isCustom: false,
      isMultiTexture: true,
    },
    {
      id: BLOCK_IDS.WATER,
      name: "water",
      textureUri: "blocks/water.png",
      isCustom: false,
      isMultiTexture: false,
      isLiquid: true,
    },
  ];
}

function setBlock(blocks: Record<string, number>, x: number, y: number, z: number, blockId: number) {
  blocks[`${x},${y},${z}`] = blockId;
}

function buildCircularArea(
  blocks: Record<string, number>,
  center: Vec3,
  radius: number,
  y: number,
  blockId: number
) {
  const radiusSq = radius * radius;
  for (let x = center.x - radius; x <= center.x + radius; x++) {
    for (let z = center.z - radius; z <= center.z + radius; z++) {
      const dx = x - center.x;
      const dz = z - center.z;
      if (dx * dx + dz * dz <= radiusSq) {
        setBlock(blocks, x, y, z, blockId);
      }
    }
  }
}

function buildRectangle(
  blocks: Record<string, number>,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  y: number,
  blockId: number
) {
  for (let x = x1; x <= x2; x++) {
    for (let z = z1; z <= z2; z++) {
      setBlock(blocks, x, y, z, blockId);
    }
  }
}

function buildHubZone(blocks: Record<string, number>, zone: ZoneConfig) {
  const center = zone.center;
  const radius = zone.radius;

  // Base layer - smooth stone foundation
  buildCircularArea(blocks, center, radius, center.y - 1, BLOCK_IDS.SMOOTH_STONE);

  // Ground level - white concrete plaza
  buildCircularArea(blocks, center, radius, center.y, BLOCK_IDS.WHITE_CONCRETE);

  // Central spawn platform (smaller circle)
  const spawnRadius = 15;
  buildCircularArea(blocks, center, spawnRadius, center.y, BLOCK_IDS.ORANGE_CONCRETE);

  // Add decorative border
  const borderRadius = radius - 2;
  for (let angle = 0; angle < 360; angle += 10) {
    const rad = (angle * Math.PI) / 180;
    const x = Math.round(center.x + borderRadius * Math.cos(rad));
    const z = Math.round(center.z + borderRadius * Math.sin(rad));
    setBlock(blocks, x, center.y, z, BLOCK_IDS.GRAY_CONCRETE);
  }

  // Add trees around the plaza
  const treePositions = [
    { x: center.x + 40, z: center.z + 40 },
    { x: center.x - 40, z: center.z + 40 },
    { x: center.x + 40, z: center.z - 40 },
    { x: center.x - 40, z: center.z - 40 },
  ];

  for (const pos of treePositions) {
    // Tree trunk (5 blocks tall)
    for (let h = 0; h < 5; h++) {
      setBlock(blocks, pos.x, center.y + 1 + h, pos.z, BLOCK_IDS.OAK_LOG);
    }
    // Tree leaves (simple 3x3x3 cube)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = 4; dy <= 6; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          setBlock(blocks, pos.x + dx, center.y + 1 + dy, pos.z + dz, BLOCK_IDS.OAK_LEAVES);
        }
      }
    }
  }
}

function buildBasketballCourt(blocks: Record<string, number>, center: Vec3) {
  // NBA court dimensions: 94 ft x 50 ft (roughly 28m x 15m in blocks)
  const courtLength = 28;
  const courtWidth = 15;

  const x1 = center.x - Math.floor(courtLength / 2);
  const x2 = center.x + Math.floor(courtLength / 2);
  const z1 = center.z - Math.floor(courtWidth / 2);
  const z2 = center.z + Math.floor(courtWidth / 2);

  // Foundation
  buildRectangle(blocks, x1 - 2, z1 - 2, x2 + 2, z2 + 2, center.y - 1, BLOCK_IDS.STONE);

  // Court floor - light gray for main court
  buildRectangle(blocks, x1, z1, x2, z2, center.y, BLOCK_IDS.LIGHT_GRAY_CONCRETE);

  // Court lines - white concrete
  // Sidelines
  for (let x = x1; x <= x2; x++) {
    setBlock(blocks, x, center.y, z1, BLOCK_IDS.WHITE_CONCRETE);
    setBlock(blocks, x, center.y, z2, BLOCK_IDS.WHITE_CONCRETE);
  }
  // Baselines
  for (let z = z1; z <= z2; z++) {
    setBlock(blocks, x1, center.y, z, BLOCK_IDS.WHITE_CONCRETE);
    setBlock(blocks, x2, center.y, z, BLOCK_IDS.WHITE_CONCRETE);
  }

  // Half-court line
  const midX = center.x;
  for (let z = z1; z <= z2; z++) {
    setBlock(blocks, midX, center.y, z, BLOCK_IDS.WHITE_CONCRETE);
  }

  // Center circle
  const centerCircleRadius = 3;
  for (let angle = 0; angle < 360; angle += 10) {
    const rad = (angle * Math.PI) / 180;
    const x = Math.round(center.x + centerCircleRadius * Math.cos(rad));
    const z = Math.round(center.z + centerCircleRadius * Math.sin(rad));
    setBlock(blocks, x, center.y, z, BLOCK_IDS.ORANGE_CONCRETE);
  }

  // 3-point lines (simplified arcs)
  const threePointRadius = 7;

  // Left hoop area
  const leftHoopX = x1 + 5;
  for (let angle = -90; angle <= 90; angle += 10) {
    const rad = (angle * Math.PI) / 180;
    const x = Math.round(leftHoopX + threePointRadius * Math.cos(rad));
    const z = Math.round(center.z + threePointRadius * Math.sin(rad));
    if (x >= x1 && x <= x2 && z >= z1 && z <= z2) {
      setBlock(blocks, x, center.y, z, BLOCK_IDS.ORANGE_CONCRETE);
    }
  }

  // Right hoop area
  const rightHoopX = x2 - 5;
  for (let angle = 90; angle <= 270; angle += 10) {
    const rad = (angle * Math.PI) / 180;
    const x = Math.round(rightHoopX + threePointRadius * Math.cos(rad));
    const z = Math.round(center.z + threePointRadius * Math.sin(rad));
    if (x >= x1 && x <= x2 && z >= z1 && z <= z2) {
      setBlock(blocks, x, center.y, z, BLOCK_IDS.ORANGE_CONCRETE);
    }
  }

  // Basketball hoops (simplified)
  // Left hoop
  for (let h = 1; h <= 4; h++) {
    setBlock(blocks, x1, center.y + h, center.z, BLOCK_IDS.BLACK_CONCRETE);
  }
  setBlock(blocks, x1 + 1, center.y + 4, center.z, BLOCK_IDS.ORANGE_CONCRETE); // backboard
  setBlock(blocks, x1 + 1, center.y + 3, center.z, BLOCK_IDS.ORANGE_CONCRETE);

  // Right hoop
  for (let h = 1; h <= 4; h++) {
    setBlock(blocks, x2, center.y + h, center.z, BLOCK_IDS.BLACK_CONCRETE);
  }
  setBlock(blocks, x2 - 1, center.y + 4, center.z, BLOCK_IDS.ORANGE_CONCRETE); // backboard
  setBlock(blocks, x2 - 1, center.y + 3, center.z, BLOCK_IDS.ORANGE_CONCRETE);

  // Seating area around the court
  const seatOffset = 3;
  for (let side = 0; side < 2; side++) {
    const seatZ = side === 0 ? z1 - seatOffset : z2 + seatOffset;
    for (let x = x1; x <= x2; x += 3) {
      setBlock(blocks, x, center.y + 1, seatZ, BLOCK_IDS.OAK_PLANKS);
      setBlock(blocks, x, center.y + 2, seatZ, BLOCK_IDS.OAK_PLANKS);
    }
  }
}

function buildSportsDistrict(blocks: Record<string, number>, zone: ZoneConfig) {
  const center = zone.center;
  const radius = zone.radius;

  // Base platform
  buildCircularArea(blocks, center, radius, center.y - 1, BLOCK_IDS.STONE);
  buildCircularArea(blocks, center, radius, center.y, BLOCK_IDS.GRAY_CONCRETE);

  // Build each sports field
  if (zone.sportsFields) {
    for (const field of zone.sportsFields) {
      if (field.sport === "basketball") {
        buildBasketballCourt(blocks, field.center);
      }
      // Add more sports here later (football, soccer, baseball, tennis)
    }
  }

  // Add walkways connecting to hub
  // Simple path toward center (0,0,0)
  const pathWidth = 5;
  for (let x = Math.min(0, center.x); x <= Math.max(0, center.x); x++) {
    for (let z = -pathWidth; z <= pathWidth; z++) {
      setBlock(blocks, x, center.y, center.z + z, BLOCK_IDS.BRICKS);
    }
  }
}

function generateMap(zonesConfig: ZonesFile): MapData {
  const blocks: Record<string, number> = {};

  for (const zone of zonesConfig.zones) {
    if (zone.type === "hub") {
      buildHubZone(blocks, zone);
    } else if (zone.type.startsWith("district_sport_")) {
      buildSportsDistrict(blocks, zone);
    }
  }

  return {
    blockTypes: defineBlockTypes(),
    blocks,
  };
}

function main() {
  const zonesPath = path.join(__dirname, "..", "config", "zones.json");
  const outPath = path.join(__dirname, "..", "assets", "map.json");

  console.log("🏗️  Sports City Map Generator");
  console.log("📍 Reading zones from:", zonesPath);

  const raw = fs.readFileSync(zonesPath, "utf-8");
  const zonesConfig = JSON.parse(raw) as ZonesFile;

  console.log(`✅ Loaded ${zonesConfig.zones.length} zones`);

  const mapData = generateMap(zonesConfig);

  fs.writeFileSync(outPath, JSON.stringify(mapData, null, 2));

  console.log(`🎮 Map generated with ${Object.keys(mapData.blocks).length} blocks`);
  console.log("💾 Saved to:", outPath);
  console.log("\n🚀 Ready to play! Run your server to test the map.");
}

main();
