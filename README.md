# The Branch

A pixel-art office that lives in your browser. Nine coworkers (Mitch, Tim, Dwayne, Pat, Kaylee, Angie, Stan, Phyllida and Kelvin, or whatever you rename them) wander between desks, chat at the water cooler, act out scenes, and dress up for the holidays.

The fun part: each coworker can be one of **your own Grok Bot agents**. Click a coworker, type a message, and your agent answers right there in the office.

It's free, it runs entirely on your own computer, and it never asks for a password.

> **Parody notice.** The Branch is an independent, fan-made parody and homage to workplace comedies. It is **not** affiliated with, endorsed by, or connected to NBC, NBCUniversal, "The Office", its creators or cast, or xAI, Grok, or the makers of the Grok Bot app. All characters are original parody characters. All trademarks belong to their owners.

---

## What you need

- **A Windows 10 or 11 PC.** (The office itself works in any browser, but connecting agents needs Windows.)
- **Node.js (the free "LTS" version)** from [nodejs.org](https://nodejs.org/en/download). Install it with the default options.
- **The Grok Bot desktop app**, already installed and signed in, if you want coworkers to talk to your agents. Without it you can still watch and play with the office.

## Install (about 2 minutes)

1. **Download** this project: click the green **Code** button at the top of this page, then **Download ZIP**. Right-click the ZIP and choose **Extract All**.
   *(Or, if you use git: `git clone` this repository.)*
2. Open the extracted folder and **double-click `Start The Branch`**.
   - The first time, it installs what it needs (about a minute). After that it starts right away.
   - If Windows shows "Windows protected your PC", click **More info → Run anyway**. The launcher is a short, readable text file; right-click it and choose **Edit** to see exactly what it does.
3. Your browser opens **http://127.0.0.1:4173** and the office appears.

Keep the black window open while you use the office. Close it to stop The Branch.

**Prefer the command line?** In the project folder:

```bash
npm install
```

```bash
npm start
```

Then open http://127.0.0.1:4173.

## Name your office and your coworkers

Make it yours. Call the office anything you like, and rename any coworker (naming them after their agents, like "Research Rita", works great). Or keep the defaults.

**With an AI assistant (easiest):** open this folder in Claude Code, Codex, Cursor, or another AI coding assistant and say *"Set up my office."* On first use it asks what to call your office and whether to rename anyone, then makes the changes for you. Its instructions are in `AGENTS.md`.

**By hand:** open `public/office-settings.js` in Notepad, change the names inside the quotes, save, and refresh the office page. Leave the short ids on the left (`mike`, `evan`, …) as they are. The jokes and scenes pick up the new names automatically.

## How to use it

- **Watch the office.** Coworkers take breaks, visit the printer and kitchen, chat with each other, and talk to the camera on their own.
- **Lively** makes everything happen more often. Great for filming.
- **Scenes** are the sticky notes under the map. Click one to play it: All-hands meeting, Fire drill, Birthday party, Stapler in Jell-O, Parkour!, Pretzel day, That's what she said, Talking head. You can also press number keys **1–9**. Turn on **Random scenes** to have one play every couple of minutes.
- **Holiday tabs** on the folder above the map switch between Everyday, Halloween, Thanksgiving and Christmas: decorations, costumes, and holiday-only scenes (on keys 1 and 2).
- **Fullscreen** fills the screen with the office. **Fit**, the zoom buttons, your mouse wheel, or pinch zoom let you get close. Drag to move around.
- **Names** shows who is who. **Pause office** freezes everyone.

### Connecting your agents

1. **Quit the Grok Bot app** if it is open. The office needs to be the one that opens it.
2. Click any coworker, then click **Connect my agents**.
3. The office opens Grok Bot on a hidden, separate Windows desktop, so it won't pop up or steal focus. The first time can take about 30 seconds.
4. Your existing bots are handed out to coworkers automatically. Use **Change** to give a coworker a different agent.
5. Type a message and press **Enter** (Shift + Enter adds a new line). The coworker types at their desk, says "On it!", and the reply pops up over their head.

When you're done, click **Hand back Grok** so you can open Grok Bot normally again (closing The Branch does this too).

Your assignments and the last 40 messages per agent are saved in this browser only. **Clear chat** clears the office's copy, not anything in Grok Bot.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Node.js is not installed yet" | Install the **LTS** version from [nodejs.org](https://nodejs.org/en/download), then double-click `Start The Branch` again. If it still says that, restart your PC once. |
| The browser opened but the page won't load | Wait a few seconds and refresh. Make sure the black window is still open. |
| "Address already in use" | The Branch is already running in another window. Use that one, or close it and start again. |
| Connecting says Grok Bot is already running | Quit Grok Bot completely (check the system tray near the clock), then click **Connect my agents** again. |
| It says Grok Bot needs you to sign in | Open Grok Bot yourself, sign in, quit it, then connect again. The Branch never types passwords. |
| No agents show up | Create at least one bot in the Grok Bot app first. The Branch never creates bots. |
| Things look slow | Click **Pause office** or turn off **Lively**. |

## Safety and privacy

- **Runs only on your computer.** The server listens on `127.0.0.1`, so nothing else on your network or the internet can reach it, and it refuses requests from other websites.
- **No passwords, ever.** The Branch never asks for, stores, or types any username, password, or API key.
- **Stops on sign-in or CAPTCHA.** If Grok Bot shows a sign-in screen, a CAPTCHA, or an automation block, the request stops and the office tells you.
- **Office scenes never message your agents.** Walking, chatting, scenes and holidays are just animation. A message only goes to an agent when you type it and press Enter.
- **No tracking, no accounts, no outside requests.** Fonts and art are included in the download, so the page works offline. Your chats stay in your own browser.

## For tinkerers

| Command | What it does |
| --- | --- |
| `npm test` | Runs the automated checks (no real agents; takes a few minutes). |
| `npm run preview` | Runs the office with three fake test agents at http://127.0.0.1:4174. No Grok Bot needed. |
| `npm run check:grok` | Sends one real test message to your first Grok Bot (set `GROK_BOT_NAME` to choose one). Quit Grok Bot first. |

Add `?debug` to the address to expose `window.branch` in the browser console, for example `branch.director.run('fireDrill'); branch.step(10)`. Add `?nav` to see the walkable floor map.

Where things live: the server is `server.js`; the Grok Bot connection is `src/providers/grok-bot.js` and `scripts/grok-window.ps1`; the office is in `public/` (names in `office-settings.js`, behavior in `office-life.js`, lines and scenes in `office-show.js`, holidays in `office-holiday.js` and `office-themes.js`, floor map in `world-map.js`).

## License

The code is free under the [MIT License](LICENSE). The Archivo and Kalam fonts are included under the SIL Open Font License 1.1 (see `public/assets/fonts`).
