#!/usr/bin/env bash
# Starts the Firebase emulators (auth + database) and the local GitHub-Pages stand-in. Everything binds 127.0.0.1.
set -euo pipefail
cd "$(dirname "$0")/.."
RUN=/tmp/trangrua_lop; mkdir -p "$RUN"
# firebase-tools 15 needs Java 21+; Corretto 21 lives in ~/tools/corretto21 (user space, no sudo).
export JAVA_HOME="${JAVA_HOME_21:-$HOME/tools/corretto21}"; export PATH="$JAVA_HOME/bin:$PATH"
listening() { ss -ltn | awk '{print $4}' | grep -qxE "(127\.0\.0\.1|\[::ffff:127\.0\.0\.1\]):$1"; }
if ! listening 9000; then
  nohup npx firebase emulators:start --only auth,database --project demo-trangrua > "$RUN/emulators.log" 2>&1 &
  echo $! > "$RUN/emulators.pid"
fi
if ! listening 8790; then
  nohup node tool/serve.mjs > "$RUN/serve.log" 2>&1 &
  echo $! > "$RUN/serve.pid"
fi
for _ in $(seq 1 90); do listening 9000 && listening 9099 && listening 8790 && break; sleep 1; done
if ! (listening 9000 && listening 9099 && listening 8790); then echo "Chưa chạy được, xem $RUN/*.log"; exit 1; fi
ss -ltn | awk 'NR>1{print $4}' | grep -E ':(8790|9000|9099|4400|4500)$'
echo "Màn giáo viên: http://localhost:8790/host.html   ·   Màn học sinh: http://localhost:8790/play.html"
