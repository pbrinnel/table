# table

The rules for this repo, for both of us and for any Claude either of us uses. Claude Code
reads this file on its own; in the Claude app, connect the repo to a Project or paste this
file in.

`table` is a working title. It is served at paulbrinnel.com/table/ by GitHub Pages, from
`main`, so **whatever reaches `main` is live.**

## Who

- Paul (`pbrinnel`) owns the repo and the site it hangs off.
- `dhfm91` is the collaborator.

## Staying hidden

The page is unlisted: found by direct URL only, never in search results. The repo is public,
so this is about the page, and about not labeling things on GitHub.

- `index.html` keeps `<meta name="robots" content="noindex, nofollow">`.
- No `og:`, `twitter:` or `description` tags, no keywords. A pasted link shows a bare URL.
- The `<title>` stays the working title.
- No `robots.txt` entry. It would point straight at the path, and it would stop crawlers
  from ever reading the noindex.
- Leave the repo's description and topics blank. The README stays plain.
- Nothing links to the page from paulbrinnel.com or anywhere else.

## Git

- `main` is the live page. Nobody pushes to it; a ruleset enforces that. Every change goes
  through a pull request, squash-merged.
- One short-lived branch per piece of work, named `person/topic`: `paul/menu`,
  `dhfm91/collisions`. Pull `main` before you branch.
- You merge your own PR. Ask the other person to look first when it touches what they're
  working on; small fixes can go straight in.
- Before merging, press "Update branch" (or merge `main` into your branch), check it still
  works, **then** bump `?v=N`. Doing it last means two PRs never fight over the number.
- Claude commits on branches only, never on `main`. The person pushes and opens the PR.
- Commit only your own changes. Check `git status` and `git diff` before committing; the
  other person, or another Claude session, may have work in the same folder. Claude never
  uses `git stash` or `git add -p`; it stages its own hunks with `git apply --cached`.

## Working with Claude

- The main Claude session works as the project's senior game developer, on the strongest
  model available (Opus 5.5 today). It owns design calls, architecture across files, feel
  and tuning judgment, review, and the final visual and harm checks.
- It delegates well-scoped pieces (one file, one feature, a slider page, a test page) to
  subagents on Sonnet 5.5 wherever Sonnet can do the job: the `builder` agent in
  `.claude/agents/`, or any agent run with `model: sonnet`.
- A delegated brief names the files to touch, what done looks like, and which rules here
  apply. The lead reviews every subagent's diff before committing it; subagents never
  commit, push or bump `?v=N`.
- Claude doesn't invent gameplay. Gameplay comes from Paul or dhfm91; when a brief leaves
  it open, ask.
- `.claude/launch.json` holds the local preview server, for Claude Code's preview pane.
- Claude's memory lives on one person's machine and never reaches the other. A rule that
  should bind every session goes in this file, not in memory.

## Where things are written down

One fact, one place. Link to it; don't copy it, or the copies drift apart.

| What | Where |
|---|---|
| Rules for working on the repo | this file |
| What the game is, and what's still undecided | `_ref/DESIGN.md` |
| How it's built, and the build order | `_ref/BUILD.md` |
| Every file and what it does | `_ref/MAP.md` |
| What's being done now, who has it, where it stands | `_ref/TODO.md` |
| Why the code changed, and old values | commit messages |
| Why the code is the way it is now | comments in the code |

No other notes files, logs or "session summaries". If something needs saying, it belongs
in one of these.

## Every session

Assume you're picking up from someone else, with none of their conversation.

**Starting**
- Read this file, then `_ref/TODO.md`, then whichever of `DESIGN.md`, `BUILD.md` and
  `MAP.md` the work touches.
- `git fetch`, then `git status`. Note any changes that aren't yours and leave them alone.
  If you're on a branch, check what's already on it (`git log main..`).
- Run `_labs/check.sh`. If it fails before you've touched anything, fix that first or say
  so.
- Put your name (or "Claude, for Paul") on the TODO item you're taking.

**Finishing a piece of work**
- Docs: a decision made moves out of **Open** in `DESIGN.md`; an architecture change
  updates `BUILD.md`; a file added, renamed or removed updates `MAP.md`; the TODO item is
  ticked or updated. Same commit as the code.
- Comments: none left describing code that changed.
- Leftovers: no `console.log`, debug flags, commented-out code, unused `const`s or
  test-only shortcuts. A placeholder that's been replaced gets deleted.
- Run `_labs/check.sh`; it must pass.
- Check it at desktop and phone sizes (see **Testing**), and run the **Checks** below if
  anything visible changed.
- Commit, then tell the person the branch is ready to push.

**Stopping halfway**
- Commit what's there on the branch, with a message starting `WIP:`.
- Under its TODO item, write where it stands and the next step, so the next session can
  start without asking. Delete that note when the work is done.

**Cleaning up**
- Scratch files, screenshots, browser profiles and one-off scripts go in a temp folder,
  never the repo. Anything worth keeping becomes a tracked page or script in `_labs/`.
- Stop any server you started.
- After a PR merges: delete its branch, local and remote, and pull `main`.
- A lab page that no longer matches the code gets fixed or deleted, not left to rot.

## Checks

Before showing anyone visual work:
- Look for the tells of machine-made design: uneven stroke widths, decoration nobody asked
  for, shadows, gradients, rounded app styling, objects drawn at different levels of detail.
- Count flashes per second, for photosensitive players. The design has none; keep it so.
- Never dim a person's photo toward black.

Before writing up a bug or edge case, ask whether a real player could actually hit it. If
not, leave it out.

There are no art rules beyond `DESIGN.md`. Rules from Paul's other games (such as
"everything from two photos") don't apply here unless he says so.

## Publishing

- Pages builds with Jekyll. Folders starting with `_` and dotfiles are not published.
  Everything else is, Markdown included. Don't add `.nojekyll`: Jekyll is what keeps the
  folders below off the site.
- `_ref/` holds docs: the code map (`_ref/MAP.md`), the to-do list (`_ref/TODO.md`), the
  game design (`_ref/DESIGN.md`) and how it's built (`_ref/BUILD.md`). Read the design and
  build docs before working on the game.
- `_labs/` holds dev tools: slider pages, test pages, build scripts. Tracked, so we both
  have them; never published.
- Nothing either of us might need gets git-ignored. `.gitignore` is for OS and tool junk.

## How the code is built

The same design as Paul's earlier games (`fourkeys`):

- **Plain scripts sharing one scope**, listed in `index.html`. Load order is the design:
  what a file declares at its top level, the files after it can see. `start.js` is last.
- Nothing may READ another file's top-level `const` while loading — inside a function is
  fine, since by then everything has loaded.
- **One frame for every screen:** everything draws in `LW` x `LH` units (`js/frame.js`)
  and the canvas scales to fit, desktop and phone alike.
- Every `<script src>` carries `?v=N`. Pages are cached for ten minutes, so **bump all of
  them together on every deploy**, or someone gets one new file and one old one.
- **Every font ships with the game**, as woff2 in `fonts/`, with its license, declared by
  `@font-face`. Never a system font or a font service: text must look the same everywhere.
- Saves live in the browser (`localStorage`). Wrap every read and write in `try`: a private
  window can refuse them.
- Feel numbers (speeds, angles, timings) stay flat, named `const`s at the top of their file,
  so they can be tuned from a slider page in `_labs/` rather than guessed.
- Keep `_ref/MAP.md` true when you add, rename or remove a file.

## Comments

- A comment says why the code is the way it is now.
- What the code used to do, and old tuning values, go in the commit message.
- When you change code, fix or delete the comments that describe it in the same edit.
- Name a constant rather than repeating its value in prose, so retuning can't make the
  comment wrong.
- American spelling in text and comments.

## Testing

- Serve the folder locally rather than opening the file:
  `npx --yes http-server . -p 8913 -c-1`, then open http://localhost:8913/.
- Check it on a phone-sized window as well as a desktop one, both orientations.
- Claude uses headless browsers only, for screenshots and test runs. No visible browser
  windows unless asked.
- Headless Chrome won't make a window narrower than about 500px, so a 390px screenshot is
  really a cropped 500px page. For phone widths, load the page in an `<iframe>` of the
  phone's size and screenshot that.
- `_labs/check.sh` checks the things that are easy to break without noticing: the hidden-page
  tags, matching `?v=N`s, and `MAP.md` against the real files.

## Later

Online features (a leaderboard) and analytics are planned but not built. When they come:
the server is a Cloudflare Worker on Paul's account with a name that doesn't give the
project away, tests stub `window.fetch` so they never post real rows, and the analytics tag
loads only on paulbrinnel.com with a neutral page title.
