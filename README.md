# Sonic browser adventure

A fan-made, static browser recreation with nineteen Sonic 1-style stages, six rotating special stages, two endings, a separate two-act Emerald Hill bonus, playable Sonic/Tails/Knuckles and Sonic & Tails AI partner mode. Uses React, TypeScript and Vite, with locally bundled artwork and audio. This is not a ROM emulator or an exact original-executable port.

## Open the project on a computer

1. Extract the downloaded ZIP and open its `sonic-project` folder.
2. Install a recent Node.js version (22.12+ or 24+) and pnpm.
3. Run `pnpm install --frozen-lockfile` to install dependencies. This step needs internet access.
4. Run `pnpm dev` and open the local address shown in your terminal.

Do not double-click `index.html`: TypeScript and browser assets need the development server or a built web deployment.

## Create a static web build

Run `pnpm build`. This refreshes the downloadable project ZIP and generates the browser app in `dist`. Run `pnpm preview` to review that build. Deploy the contents of `dist` to a static web host at the origin root. No app-owned backend is required. Audio starts after user interaction.

The Maypop SDK dependency is preserved for compatibility with the original Studio app. No Maypop credentials or original app-connection metadata are included. A downloaded copy is not connected to the original app, does not transfer publishing rights, and does not contain the original Studio history or private attachments.

## Download contents

The in-game **Download project** link saves `sonic-project.zip`. The archive includes `src`, local `public/art` and `public/audio` assets, configuration, lockfile, this guide and `scripts/export-project.mjs`. Each `pnpm build` regenerates the archive from an explicit safe allowlist. To refresh only the ZIP, run `pnpm export:project`.

It excludes dependencies (`node_modules`), built output (`dist`), Git/Studio history, hidden private files, environment secrets, the original Maypop app connection and the ZIP itself. It is an editable source project, not a standalone installer, ROM, saved game or export of current rings, lives, emeralds or session-only unlocks.

## Controls

- Arrows / A / D: move. Space / W / Z: jump. P / Escape: pause. R: restart act.
- Spin dash: hold Down and tap Jump, then release Down.
- Sonic Peel Out: hold Up + Jump, then release Up after half a second.
- Sonic Drop Dash: jump, release, then press and hold Jump again through landing.
- Super Sonic: after earning all six emeralds or the session unlock, gather 50 rings, jump, press X.
- Tails: jump, release, tap Jump again to fly/swim; tap again or hold Up to rise. Flight lasts eight seconds before landing restores stamina.
- Knuckles: jump, release, then hold Jump again to glide. Glide into a terrain wall to grab, use Up/Down to climb, Jump to kick away.
- Sonic & Tails: you control Sonic; AI Tails follows and assists. He returns if left behind without costing player rings/lives. The original player-only special-stage and ending sequences remain.

Touch controls and character selection are available in the app. Selecting a different character/team during play restarts the current act.

## Secrets

On the title screen: Up, Down, Left, Right, then hold A and press Start / Enter to open the secret practice menu. Both numbered Sound Tests accept these sequences by pressing Play for **each** number (including repetitions):

- Super eligibility: 04, 01, 02, 06. Still requires 50 rings and a jump; does not award emeralds.
- Emerald Hill bonus: 01, 09, 09, 02, 01, 01, 02, 04. Its score, rings, lives and checkpoints are separate from Sonic 1.

## Ownership and attribution

Sonic, Tails, Knuckles, original character/level artwork, music and sound recordings belong to **SEGA** and their respective rights holders. This fan project does not grant ownership of or a redistribution/commercial license to those assets. Keep all notices and respect applicable rights. See `public/art/README.md` and adjacent `*.sources.json` manifests for extraction provenance, pinned sources/hashes, adaptation limits and detailed credits. No ROM image is included.
