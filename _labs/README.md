# Labs

Dev tools that never reach the site: slider pages for tuning, test pages, build scripts.

- `check.sh`: run `bash _labs/check.sh` at the start and end of every piece of work. It
  checks the hidden-page tags, that every `?v=N` matches, and that `_ref/MAP.md` lists the
  real files.

A lab that loads the game's files should reach them with `../js/...` and must never post to
a live server: stub `window.fetch` once there is one.
