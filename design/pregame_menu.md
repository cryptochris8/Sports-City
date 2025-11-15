# Pregame Menu (Challenge-Centric)

Menu entry points:
- Central Hub kiosks.
- Pause menu option.

Flow:
1. Choose sport (Basketball, Soccer, Football, Baseball, Tennis).
2. Choose challenge for that sport (e.g., 60s Shooting, PK Practice).
3. Client sends `uiRequestStartChallenge` with `sport` + `challengeId`.
4. Server:
   - Optionally teleports player near appropriate field.
   - Starts challenge session.
