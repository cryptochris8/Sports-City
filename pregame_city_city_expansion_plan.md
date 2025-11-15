# Pregame City – City Expansion Plan (Option D: Full Multi-Sport Districts)

This file is designed to be **dropped into your existing project** and read by Claude Code
(or any other assistant) to **update your configs and map** WITHOUT overwriting your current work.

Place this file somewhere like:

- `design/city_expansion_plan.md`  
- or the project root

Then ask Claude something like:

> "Read `city_expansion_plan.md` and:
>  1. Merge the new zones into `config/zones.json`.
>  2. Merge the new field spawns into `config/field_spawns.json`.
>  3. Merge the new challenges into `config/sports_minigames.json`.
>  4. Regenerate \`scripts/out/map_build_instructions.json\` using \`scripts/generate-map-from-zones.ts\`."


---

## 1. Overview of New Districts

You already have:

- `central_hub_plaza` – spawn area  
- `court_street` – basketball district (with `court_street_full_court_1`)

This plan **adds** four more core sports districts (one per sport) in a grid-style layout:

1. **central_pitch_arena** – Soccer  
2. **gridiron_park** – Football  
3. **diamond_yard** – Baseball  
4. **rally_courts** – Tennis  

Coordinates are spaced so they won’t overlap your existing hub + basketball area.

- Hub stays at/near `(0, 0, 0)`
- Court Street is at/near `(200, 0, 0)`
- New zones are placed at roughly 200 units away on other axes

All of this is **config-only**: your map builder will turn these into actual Hytopia blocks/chunks.

---

## 2. Zones – JSON Additions for `config/zones.json`

### ✅ Instructions for Claude / your AI:

1. Open your current `config/zones.json`.
2. Inside the top-level `zones` array, **append** the following objects.
3. Do **not** remove or modify existing zones (like `central_hub_plaza` or `court_street`).

### 🔧 JSON to append to `zones` array

```jsonc
{
  "id": "central_pitch_arena",
  "type": "district_sport_soccer",
  "center": { "x": -200, "y": 0, "z": 0 },
  "radius": 80,
  "sportsFields": [
    {
      "id": "central_pitch_field_main",
      "sport": "soccer",
      "mode": "challenge",
      "center": { "x": -200, "y": 0, "z": 20 },
      "maxPlayers": 16
    }
  ]
},
{
  "id": "gridiron_park",
  "type": "district_sport_football",
  "center": { "x": 0, "y": 0, "z": 200 },
  "radius": 80,
  "sportsFields": [
    {
      "id": "gridiron_park_field_1",
      "sport": "football",
      "mode": "challenge",
      "center": { "x": 0, "y": 0, "z": 220 },
      "maxPlayers": 16
    }
  ]
},
{
  "id": "diamond_yard",
  "type": "district_sport_baseball",
  "center": { "x": 0, "y": 0, "z": -200 },
  "radius": 80,
  "sportsFields": [
    {
      "id": "diamond_yard_cage_1",
      "sport": "baseball",
      "mode": "challenge",
      "center": { "x": 0, "y": 0, "z": -220 },
      "maxPlayers": 12
    }
  ]
},
{
  "id": "rally_courts",
  "type": "district_sport_tennis",
  "center": { "x": 200, "y": 0, "z": 200 },
  "radius": 80,
  "sportsFields": [
    {
      "id": "rally_courts_main_1",
      "sport": "tennis",
      "mode": "challenge",
      "center": { "x": 220, "y": 0, "z": 220 },
      "maxPlayers": 8
    }
  ]
}
```

💡 Note: commas between objects will depend on how your existing `zones` array is formatted.  
Claude can handle inserting them cleanly.

---

## 3. Field Spawns – JSON Additions for `config/field_spawns.json`

Each new field needs a **spawn transform** for teleporting players near that field
(e.g., when a player uses a Pregame menu to jump into a challenge).

### ✅ Instructions for Claude / your AI:

1. Open your current `config/field_spawns.json`.
2. Inside `fieldSpawns` object, **add** the following keys.
3. Keep any existing entries (like `court_street_full_court_1`) unchanged.

### 🔧 JSON to merge into `fieldSpawns` object

```jsonc
"central_pitch_field_main": {
  "position": { "x": -200, "y": 0, "z": 10 },
  "rotationY": 0
},
"gridiron_park_field_1": {
  "position": { "x": 0, "y": 0, "z": 210 },
  "rotationY": 180
},
"diamond_yard_cage_1": {
  "position": { "x": 0, "y": 0, "z": -210 },
  "rotationY": 0
},
"rally_courts_main_1": {
  "position": { "x": 210, "y": 0, "z": 210 },
  "rotationY": -90
}
```

---

## 4. Challenge Definitions – Additions for `config/sports_minigames.json`

Right now your `sports_minigames.json` only has **basketball** challenges like:

```jsonc
"basketball": {
  "challenges": [
    {
      "id": "basketball_shooting_60s",
      "displayName": "60s Spot Shooting",
      ...
    }
  ]
}
```

We will **keep that exactly as-is** and **add new sports** alongside it:

- `football`
- `soccer`
- `baseball`
- `tennis`

These challenges are all **solo shooting/skill drills**, compatible with your existing
`ChallengeSystem` (they use `xpPerHit`, `coinsPerHit`, `bonusXpOnFinish`).

### ✅ Instructions for Claude / your AI:

1. Open `config/sports_minigames.json`.
2. In the top-level `sports` object:
   - Keep `"basketball"` as it is.
   - Add the following new top-level keys: `"football"`, `"soccer"`, `"baseball"`, `"tennis"`.

### 🔧 JSON to merge into `sports` object

```jsonc
"football": {
  "challenges": [
    {
      "id": "football_qb_targets_60s",
      "displayName": "QB Target Drill",
      "description": "Throw as many accurate passes as possible at targets in 60 seconds.",
      "durationSeconds": 60,
      "xpPerHit": 3,
      "coinsPerHit": 1,
      "bonusXpOnFinish": 15
    }
  ]
},
"soccer": {
  "challenges": [
    {
      "id": "soccer_pk_10shots",
      "displayName": "Penalty Kick Practice",
      "description": "You get a limited window to score as many penalty kicks as possible.",
      "durationSeconds": 45,
      "xpPerHit": 4,
      "coinsPerHit": 2,
      "bonusXpOnFinish": 15
    }
  ]
},
"baseball": {
  "challenges": [
    {
      "id": "baseball_batting_cage_20pitches",
      "displayName": "Batting Cage – 20 Pitches",
      "description": "Try to make clean contact with as many pitches as you can.",
      "durationSeconds": 60,
      "xpPerHit": 3,
      "coinsPerHit": 1,
      "bonusXpOnFinish": 10
    }
  ]
},
"tennis": {
  "challenges": [
    {
      "id": "tennis_serve_targets_40s",
      "displayName": "Serve Target Drill",
      "description": "Serve into highlighted target zones as many times as possible.",
      "durationSeconds": 40,
      "xpPerHit": 3,
      "coinsPerHit": 1,
      "bonusXpOnFinish": 10
    }
  ]
}
```

These work with your current `ChallengeSystem` because it only cares about:

- `durationSeconds`
- `xpPerHit`
- `coinsPerHit`
- `bonusXpOnFinish`

Your per-sport server logic (football, soccer, etc.) will later call:

```ts
challengeSystem.registerHit(playerId, points);
```

whenever the player successfully hits a target / scores.

---

## 5. Map Builder – How to Use These New Zones

Once Claude has merged the config changes:

1. Run your existing map instruction generator, for example:

   ```bash
   node scripts/generate-map-from-zones.js
   ```
   or
   ```bash
   ts-node scripts/generate-map-from-zones.ts
   ```

2. This will regenerate something like:

   ```text
   scripts/out/map_build_instructions.json
   ```

3. Your **Claude Code map builder** should then:
   - Read the updated `map_build_instructions.json`.
   - For each new zone:
     - Create terrain/streets around `center` with radius `radius`.
     - Place field geometry at each `sportsFields[].center`.
     - Create trigger volumes around each field and set their metadata:
       - `fieldId`
       - `sport`
       - `triggerType: "join_zone"` / `"challenge_zone"`.

Example (conceptual) for `central_pitch_arena`:

- A main soccer pitch centered at `(-200, 0, 20)`
- Bleachers on the sides
- Small plaza or entry walkway
- A trigger volume at the edge of the pitch that fires `enteredSportsFieldTrigger` for:
  - `fieldId: "central_pitch_field_main"`
  - `sport: "soccer"`

---

## 6. Input + HUD – Minimal Changes Needed

Because your HUD + InputController are already **challenge-first**, you do **not** need to
change a lot to support the new districts.

Once server + triggers are wired:

- Walking into `central_pitch_field_main` trigger → HUD will show `[E] Start Challenge`.
- Pressing `E` → your `InputController` will send `uiRequestStartChallenge` with:
  - `sport: "soccer"`
  - `fieldId: "central_pitch_field_main"`
  - You may update `getDefaultChallengeId` to handle more sports, e.g.:

```ts
private getDefaultChallengeId(sport: string): string {
  switch (sport) {
    case "basketball":
      return "basketball_shooting_60s";
    case "football":
      return "football_qb_targets_60s";
    case "soccer":
      return "soccer_pk_10shots";
    case "baseball":
      return "baseball_batting_cage_20pitches";
    case "tennis":
      return "tennis_serve_targets_40s";
    default:
      return "basketball_shooting_60s";
  }
}
```

- ChallengeSystem treats all of them the same at the core level (timer + per-hit rewards).
- Per-sport logic just decides when a “hit” happens and calls `registerHit`.

---

## 7. Quick Summary for Claude

You can paste this to Claude directly once the file is in your repo:

> **Task:** Read `city_expansion_plan.md`, then:
>  1. Merge the new zone objects into `config/zones.json` → `zones` array.
>  2. Merge the new field spawn entries into `config/field_spawns.json` → `fieldSpawns` object.
>  3. Merge the new sport entries into `config/sports_minigames.json` → `sports` object.
>  4. Update `src/client/controllers/input-controller.ts` → `getDefaultChallengeId` to support all five sports.
>  5. Regenerate `scripts/out/map_build_instructions.json` using the map generator script.
>  6. Do **not** remove or overwrite any existing zones, spawns, or basketball config.
