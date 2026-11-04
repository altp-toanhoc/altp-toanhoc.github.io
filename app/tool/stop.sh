#!/usr/bin/env bash
# Stops what tool/start.sh started.
RUN=/tmp/trangrua_lop
for n in serve emulators; do
  if [ -f "$RUN/$n.pid" ]; then kill -INT "$(cat "$RUN/$n.pid")" 2>/dev/null || true; rm -f "$RUN/$n.pid"; fi
done
pkill -INT -f 'firebase emulators:start --only auth,database --project demo-trangrua' 2>/dev/null || true
echo "đã dừng"
