# Sports City – Hytopia Multiplayer Sports World (Challenge-First)

This project is a Hytopia sports world where players explore a city and play **solo shooting/skill challenges** for basketball, football, soccer, baseball, and tennis.

## Features

- **Zone-Based Map Generation**: Automatically generate complete Hytopia maps from zone configurations
- **Server-authoritative** challenge system
- **Config-driven** (zones, challenges, spawns)
- Friendly to **Claude Code / MCP / Cursor** workflows
- **Central Hub Plaza**: 80-block radius circular plaza with spawn platform and decorative trees
- **Basketball District**: Full-size NBA-regulation basketball court (28m x 15m)
- **Progression System**: Rank from Rookie → Amateur → Collegiate → Pro

## Quick Start

```bash
# Install dependencies
npm install

# Generate the map from zones.json
npm run generate-map

# Start the server
npm run dev
```

The server will spawn players at the central hub plaza and you can explore the basketball court district.
