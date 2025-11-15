# Triggers & Fields (Summary)

Each sports field has:
- A unique `fieldId` shared across:
  - `config/zones.json`
  - `config/field_spawns.json`
  - Trigger entities in the map.

Example `fieldId` values:
- `central_pitch_field_ranked`
- `court_street_full_court_1`
- `diamond_yard_sandlot`

Each field should have at least one `join_zone` trigger volume near it.

Server:
- Detects player entering/leaving trigger.
- Sends to that player:
  - `enteredSportsFieldTrigger` with `{ fieldId, sport, mode/challengeHint }`
  - `exitedSportsFieldTrigger`

Client:
- `InputController` stores `nearbyField` on enter.
- HUD shows `[E] Start Challenge` when `nearbyField` is set.
