#!/usr/bin/env bash
# Checks the things that break quietly: the hidden-page rules, the cache-busters,
# and the code map. Run it at the start and end of every piece of work:
#   bash _labs/check.sh
# It only reads files, and exits non-zero if anything fails.

cd "$(dirname "$0")/.." || exit 1

fails=0
fail() { echo "FAIL  $1"; fails=$((fails + 1)); }
warn() { echo "warn  $1"; }

page=index.html

# Staying hidden (CLAUDE.md)
grep -q '<meta name="robots" content="noindex, nofollow">' "$page" \
    || fail "$page is missing the noindex, nofollow robots tag"
grep -Eiq 'property="og:|name="twitter:|name="description"|name="keywords"' "$page" \
    && fail "$page has a preview or description tag"
grep -q '<title>table</title>' "$page" \
    || fail "$page's title isn't the working title"
[ -e robots.txt ] && fail "robots.txt exists; it would point at the page"
[ -e .nojekyll ] && fail ".nojekyll exists; it would publish _ref/ and _labs/"

# Everything ships with the page: no outside scripts, styles or fonts
grep -Eq '(src|href)="(https?:)?//' "$page" \
    && fail "$page loads something from another site"

# Cache-busters: every local script has one, and they all match
srcs=$(grep -o '<script src="[^"]*"' "$page" | sed 's/<script src="//; s/"$//')
versions=$(echo "$srcs" | grep -o '?v=[0-9]*' | sort -u)
for s in $srcs; do
    case "$s" in *'?v='*) ;; *) fail "$s has no ?v=" ;; esac
    [ -f "${s%%\?*}" ] || fail "$page loads ${s%%\?*}, which doesn't exist"
done
[ "$(echo "$versions" | grep -c .)" -gt 1 ] \
    && fail "the ?v= numbers differ: $(echo $versions)"

# The code map matches the files on disk, both ways
for f in $(find js fonts -type f ! -name '.DS_Store' 2>/dev/null | sort); do
    grep -q "\`$f\`" _ref/MAP.md || fail "$f isn't in _ref/MAP.md"
done
for f in $(grep -o '`\(js\|fonts\)/[^`]*`' _ref/MAP.md | tr -d '`' | sort -u); do
    [ -e "$f" ] || fail "_ref/MAP.md lists $f, which doesn't exist"
done
for s in $srcs; do
    grep -q "\`${s%%\?*}\`" _ref/MAP.md || fail "${s%%\?*} is loaded but not in _ref/MAP.md"
done

# Every font has its license beside it
if ls fonts/*.woff2 >/dev/null 2>&1; then
    ls fonts/ | grep -Eiq 'license|ofl' || fail "fonts/ has no license file"
fi

# Leftovers (vendored code in js/lib is exempt)
grep -rn 'console\.log\|debugger' js --include='*.js' 2>/dev/null | grep -v '^js/lib/' \
    | while read -r line; do warn "leftover: $line"; done

if [ "$fails" -eq 0 ]; then echo "ok"; else echo "$fails failed"; exit 1; fi
