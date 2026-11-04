#!/usr/bin/env bash
# Runs every check against the running stack (`npm start` first): unit + access-rule tests, full game,
# classroom failures, layout on 8 screen sizes, smoothness on a throttled CPU, and the theme slots.
# Usage: bash tool/check_all.sh   (log: /tmp/trangrua_lop/check_all.log, screenshots in /tmp/trangrua_lop/shots*)
set -uo pipefail
cd "$(dirname "$0")/.."
export CHROME="${CHROME:-$(ls ~/.cache/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell 2>/dev/null | tail -1)}"
RUN=/tmp/trangrua_lop; mkdir -p "$RUN"
fail=0
step() { local name="$1"; shift; echo "== $name"; if "$@" > "$RUN/step.log" 2>&1; then tail -n 12 "$RUN/step.log" | grep -E 'OK|pass|fail|✓|bận' ; else echo "!! $name FAILED"; tail -n 25 "$RUN/step.log"; fail=1; fi; }
step "build" bash tool/build.sh
step "unit + rules" npm test
step "e2e" node tool/e2e.mjs
step "robust" node tool/robust.mjs
step "layout" node tool/layout.mjs
step "perf" node tool/perf.mjs
python3 -E tool/make_test_theme.py "$RUN/theme_test" > /dev/null
THEME_DIR="$RUN/theme_test" PORT=8791 node tool/serve.mjs > "$RUN/serve_theme.log" 2>&1 &
tpid=$!
for _ in $(seq 1 20); do ss -ltn | awk '{print $4}' | grep -qx '127.0.0.1:8791' && break; sleep 0.5; done
BASE=http://127.0.0.1:8791 EXPECT_THEME=1 step "e2e with theme" node tool/e2e.mjs "$RUN/shots_theme"
kill -INT "$tpid" 2>/dev/null; wait "$tpid" 2>/dev/null
if [ "$fail" = 0 ]; then echo "ALL CHECKS PASSED"; else echo "SOME CHECKS FAILED"; exit 1; fi
