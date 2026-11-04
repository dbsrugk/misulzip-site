#!/bin/bash
# Usage (from the repo root): bash hwasil/tests/run.sh   -- takes about 5 minutes (software rendering is slow)
set -u
export NODE_PATH="$(npm root -g)"
cd "$(dirname "$0")/../.."
rc=0
for t in smoke two; do echo "=== $t ==="; timeout 1500 node hwasil/tests/$t.js || rc=1; done
echo; [ $rc = 0 ] && echo "ALL TESTS PASSED" || echo "SOME TESTS FAILED"; exit $rc
