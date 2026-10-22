# table

The rules for this repo, for both of us and for any Claude either of us uses. Claude Code
reads this file on its own; in the Claude app, connect the repo to a Project or paste this
file in.

`table` is a working title. It is served at paulbrinnel.com/table/ by GitHub Pages, from
`main`, so **whatever reaches `main` is live.**

## Who

- Paul (`pbrinnel`) owns the repo and the site it hangs off.
- `dhfm91` is the co-developer, with the same say over the game as Paul: either of them can
  change gameplay, feel or look, settle anything under **Open** in `_ref/DESIGN.md`, or
  undo an earlier call, including one marked as the other's. When one of them changes
  something the other decided, say so in the commit and the PR, so it isn't a surprise.
  In `_ref/DESIGN.md`, the original call stays as written and the change goes right under
  it, marked **Update (name):**, so both can see what it was and what it is now.

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

This section is the whole routine for both of us. Neither of us should need to message the
other about how to branch, merge or deploy; if something here is unclear, fix it here.

**Branches**
- `main` is the live page. Nobody pushes to it; a ruleset enforces that. Every change
  reaches it through a pull request, merged with a merge commit. The ruleset allows no
  other kind, because squashing rewrites a branch's commits and the next PR from that
  branch then conflicts with its own earlier work.
- Each person has one long-lived branch: `paul-dev` and `dhfm91-dev`. All your work goes
  there, piece after piece. There are no per-topic branches, and the branch is kept after
  every merge.
- A branch that's missing from GitHub (deleted by accident, say) comes back on the next
  push from the local copy. Nothing is lost while the local copy exists.
- Never force-push, rebase or reset a branch that's been pushed. Fix forward with a new
  commit or a merge instead.

**Who does what**
- The person pushes, opens the PR and merges it, with **Merge pull request**, so nothing
  goes out that they haven't seen. Claude doesn't push, even where it could.
- Claude does everything else, without being asked: keeping the branch up to date with
  `main`, resolving conflicts, bumping `?v=N`, and checking that the result works. Claude
  commits only on the person's own branch, never on `main`.
- You merge your own PR; no approval is needed. Say in the PR what it changes, especially
  anything the other person built or decided.

**Claude's routine at the start of every session** (also under **Every session**)
1. `git fetch`. Switch to the person's branch, and if `main` has moved on, merge
   `origin/main` into it. Resolve any conflicts, run `_labs/check.sh`, and commit the merge.

**Claude's routine when a piece of work is ready to go live**
1. `git fetch` and merge `origin/main` into the branch again, in case the other person
   merged while you worked. Resolve conflicts; test.
2. Bump every `?v=N` in `index.html` to one more than `main`'s, all together, as the last
   commit. Doing it last, and from `main`'s number, means two PRs never fight over it. Skip
   it when nothing the page loads has changed (only docs or `_labs/`).
3. Run `_labs/check.sh`, then tell the person: push, open a PR to `main`, and merge it.
4. If `main` moved again before they merged (GitHub shows "This branch is out-of-date" or
   a conflict), redo steps 1 to 3. The usual conflict is the `?v=N` line: take one more than
   `main`'s.

**Shared folders**
- Commit only your own changes. Check `git status` and `git diff` before committing; the
  other person, or another Claude session, may have work in the same folder. Claude never
  uses `git stash` or `git add -p`; it stages its own hunks with `git apply --cached`.
- A branch Claude creates must push to its own name on GitHub, never `main`: a branch made
  from `origin/main` tracks `main` by default, so set
  `git config branch.<name>.merge refs/heads/<name>` right after creating it.

## Working together

How Paul and dhfm91 stay out of each other's way:

- **Claim before you start.** Put your name on the `_ref/TODO.md` item before writing any
  code, and commit that with your first piece of work. If something you need is claimed by
  the other person, leave it and pick something else.
- **Name the files.** Under your TODO item, list the files you expect to change. Two people
  editing the same file at the same time is the main source of conflicts, so if the files
  overlap with the other person's item, agree first or wait.
- **Go live often, in small pieces.** A PR every session or two keeps both branches close to
  `main`, and small merges conflict less and are easier to untangle.
- **Take `main` in often.** Merge it into your branch at the start of every session, not
  only before a PR.
- **Shared files change in small edits.** `index.html`'s script list, `_ref/MAP.md`,
  `_ref/TODO.md` and `_labs/tune.html` are touched by almost every piece of work. Change
  only your own lines, and don't reorder or reformat the rest.
- **Write decisions down, not in chat.** A game decision goes in `_ref/DESIGN.md`, a rule in
  this file. The other person's Claude reads those, and never your messages.
- **One folder per person.** Each of you works in your own clone on your own machine.

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
- Work on the person's own branch: `paul-dev` or `dhfm91-dev`. The first time, create it
  from the latest `main` (`git checkout -b dhfm91-dev origin/main`) and point it at its own
  name (see **Shared folders** under **Git**).
- Bring it up to date with `main`, as **Git** describes.
- Run `_labs/check.sh`. If it fails before you've touched anything, fix that first or say
  so.
- Put your name (or "Claude, for Paul" / "Claude, for dhfm91") on the TODO item you're
  taking.

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
- Commit. When the work should go live, follow **Claude's routine when a piece of work is
  ready to go live** under **Git**; otherwise tell the person the branch is ready to push.

**Stopping halfway**
- Commit what's there on the branch, with a message starting `WIP:`.
- Under its TODO item, write where it stands and the next step, so the next session can
  start without asking. Delete that note when the work is done.

**Cleaning up**
- Scratch files, screenshots, browser profiles and one-off scripts go in a temp folder,
  never the repo. Anything worth keeping becomes a tracked page or script in `_labs/`.
- Stop any server you started.
- After a PR merges: pull `main`. Keep your branch; it carries on as before.
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

- Serve the folder locally rather than opening the file. Double-click `_play-mac.command`
  or `_play-windows.bat`, or run `npx --yes http-server . -p 8913 -c-1` and open
  http://localhost:8913/. Each needs Node.js. For the labs, double-click
  `_labs-mac.command` or `_labs-windows.bat`: labs opened straight from the disk can't
  load the game's files.
- Check it on a phone-sized window as well as a desktop one, both orientations.
- Claude uses headless browsers only, for screenshots and test runs. No visible browser
  windows unless asked.
- Those headless runs use `chrome-headless-shell`, never the person's own Chrome. A
  headless copy of Google Chrome, even with its own profile, counts to the computer as
  Chrome running: while it's up, clicking the Dock icon or a link goes to it, and the
  person's Chrome opens no windows. Install it once, outside the repo (it's a download,
  so ask first), with
  `npx --yes @puppeteer/browsers install chrome-headless-shell@stable --path ~/.cache/chrome-headless-shell`.
  That prints the binary's path; it takes the usual `--remote-debugging-port` and
  `--user-data-dir` flags and is always headless. Give subagents the path in their brief.
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
