# Dev Checklist (Short)

- [ ] Wire Hytopia server + client bootstraps.
- [ ] Hook `ChallengeSystem` into server update loop.
- [ ] Implement basic player spawn in Central Hub.
- [ ] Generate map chunks from `config/zones.json`.
- [ ] Add trigger volumes per `fieldId`.
- [ ] Send `enteredSportsFieldTrigger` / `exitedSportsFieldTrigger`.
- [ ] On `E`, send `uiRequestStartChallenge`.
- [ ] Wire `ChallengeSystem` + `BasketballLogic`.
- [ ] Send `challengeStarted`, `challengeScoreUpdated`, `challengeEnded`.
- [ ] HUD reacts to challenge events.
- [ ] Verify one full loop:
  - Walk to court
  - Start challenge
  - Shoot
  - Score increments
  - Timer ends
  - XP/coins rewarded.
