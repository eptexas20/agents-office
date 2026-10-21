# Instructions for AI assistants

These notes are for any AI coding assistant opened in this folder (Claude Code, Codex, Cursor, Copilot, Gemini, and others). The person you are helping may not be technical. Use plain language, keep steps short, and explain what you change.

## First run: name the office and the coworkers

Before anything else in your first conversation here, open `public/office-settings.js` and check `setupDone`.

If `setupDone` is `false`:

1. Welcome them in one or two sentences: this is a pixel-art parody office where their AI agents work as coworkers, and they can name the office and the crew before they start.
2. Ask what to call the office. Default: **The Branch**.
3. Show the crew and ask whether they want to rename anyone. They can rename some, all, or none, and may change job titles too.

   | Id | Default name | Job title | Who they are |
   | --- | --- | --- | --- |
   | `mike` | Mitch | Branch manager (world's best, allegedly) | The boss; suit and tie, corner office |
   | `evan` | Tim | Sales, professional prankster | Easygoing salesman, loves a prank |
   | `graham` | Dwayne | Sales, assistant to the manager | Intense, by-the-book salesman |
   | `june` | Pat | Reception, secret artist | Receptionist at the front desk |
   | `priya` | Kaylee | Customer service, gossip desk | Knows all the office gossip |
   | `ellie` | Angie | Accounting, party committee chair | Strict accountant, runs the parties |
   | `harris` | Stan | Sales, counting down to five | Grumpy veteran salesman |
   | `nora` | Phyllida | Sales, knitting enthusiast | Kind saleswoman who knits |
   | `kelvin` | Kelvin | Accounting, snack strategist | Big, gentle accountant; loves the vending machine |

   Tip to share: naming coworkers after their agents (for example "Research Rita") makes it easy to remember who does what.
4. Make the changes **only in `public/office-settings.js`**:
   - Change only the text inside the quotes for `name`, `role` and the office `name` / `tagline`.
   - Never change the ids (`mike`, `evan`, …). Saved agent assignments and the artwork depend on them.
   - Keep names short so they fit the name tags: about 12 characters for a coworker, about 22 for the office.
   - If a name contains an apostrophe, write it as a curly apostrophe (’) or escape it (`\'`) so the file stays valid.
   - If the office is renamed and the boss's title still says "Branch manager", offer to update it.
5. Set `setupDone: true`, even if they kept every default or asked to skip, so they are not asked again.
6. Tell them what changed and how to see it: double-click **Start The Branch** (or run `npm start`), then open http://127.0.0.1:4173. If it is already open, refresh the page.

You do not need to edit any other file. The jokes and scenes use placeholders (`{mike}`, `{office}`, …) in `public/office-show.js`, so new names show up everywhere automatically. If you add new lines there, use the same placeholders instead of names.

If `setupDone` is `true`, skip this and help with whatever they ask. They can rename things again at any time the same way.

## Helping them run it

- Requirements: Windows 10 or 11, Node.js LTS, and the Grok Bot desktop app signed in (only needed to connect agents).
- Easiest start: double-click `Start The Branch.bat`. It checks for Node.js, installs on first run, starts the server and opens the browser.
- Command line: `npm install`, then `npm start`, then open http://127.0.0.1:4173.
- Try it without Grok Bot: `npm run preview` opens a version with fake test agents at http://127.0.0.1:4174.
- `npm test` runs the automated checks. It takes a few minutes; `tests/office-life.test.js` is slow, not stuck.

## Safety rules

- Never ask for, store, or type passwords, API keys or other credentials. If Grok Bot needs a sign-in, the person does it themselves in the Grok Bot app.
- Do not run `npm run check:grok` without asking first. It sends a real message to one of their Grok bots.
- Keep the server bound to `127.0.0.1` and keep the cross-site request check in `server.js`.
- Office scenes and ambient life must never send messages to agents. Only a message the person types should reach an agent.
- Make artwork with code (canvas or CSS), not paid image-generation services, unless the person asks otherwise.
