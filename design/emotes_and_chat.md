# Emotes & Quick Chat (Summary)

Emote wheel:
- Key: `G`
- Shows radial menu with simple, non-toxic emotes:
  - Victory dance, clap, wave, flex, etc.
- Client sends:
  - `{ "type": "emoteTrigger", "emoteId": "celebrate_flex" }`
- Server broadcasts `emoteBroadcast` to nearby players.

Quick chat:
- Key: `C`
- Pre-set messages like:
  - "Nice play!"
  - "Good game!"
  - "Let's run it back."
  - "Need one more."
  - "Great shot!"
- Client sends:
  - `{ "type": "quickChat", "messageId": "nice_play" }`
- Server maps `messageId` → safe text and broadcasts `quickChatBroadcast`.
