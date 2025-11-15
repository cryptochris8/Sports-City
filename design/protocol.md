# Network Protocol (Challenge-First)

Messages are plain JSON objects with a `type` field.

## Client → Server

### `uiRequestStartChallenge`

Player wants to start a solo challenge at a field.

```jsonc
{
  "type": "uiRequestStartChallenge",
  "sport": "basketball",
  "challengeId": "basketball_shooting_60s",
  "fieldId": "court_street_full_court_1"
}
```

### `uiCancelChallenge`

```jsonc
{
  "type": "uiCancelChallenge"
}
```

### `basketballShotAttempt`

```jsonc
{
  "type": "basketballShotAttempt",
  "challengeSessionId": "challenge_basketball_player123_1731610000000",
  "shotType": "three",
  "timing": 0.92,
  "aimOffset": 0.15,
  "contested": false
}
```

(Other sports can add similar attempt messages later.)

---

## Server → Client

### `zoneChanged`

```jsonc
{
  "type": "zoneChanged",
  "zoneId": "court_street"
}
```

### `challengeStarted`

```jsonc
{
  "type": "challengeStarted",
  "challengeSessionId": "challenge_basketball_player123_...",
  "challengeId": "basketball_shooting_60s",
  "sport": "basketball",
  "durationSeconds": 60
}
```

### `challengeScoreUpdated`

```jsonc
{
  "type": "challengeScoreUpdated",
  "challengeSessionId": "challenge_basketball_player123_...",
  "sport": "basketball",
  "score": 23,
  "timeRemaining": 37.4
}
```

### `challengeEnded`

```jsonc
{
  "type": "challengeEnded",
  "challengeSessionId": "challenge_basketball_player123_...",
  "sport": "basketball",
  "challengeId": "basketball_shooting_60s",
  "finalScore": 37,
  "xpEarned": 55,
  "coinsEarned": 25
}
```

### `basketballShotResult`

```jsonc
{
  "type": "basketballShotResult",
  "challengeSessionId": "challenge_basketball_player123_...",
  "playerId": "player123",
  "made": true,
  "points": 3,
  "reason": "perfect"
}
```

### `xpUpdated`, `coinsUpdated`, `notification`

Generic updates already used by the HUD.

```jsonc
{
  "type": "xpUpdated",
  "xp": 1375,
  "rank": "collegiate"
}
```

```jsonc
{
  "type": "coinsUpdated",
  "coins": 1025
}
```

```jsonc
{
  "type": "notification",
  "category": "xp",
  "message": "+50 XP – Challenge Complete"
}
```
