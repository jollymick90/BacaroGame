#!/bin/sh
set -eu
mkdir -p /data/export
set -- emulators:start --only auth,firestore --project demo-bacarodex --export-on-exit=/data/export
if [ -f /data/export/firebase-export-metadata.json ]; then
  set -- "$@" --import=/data/export
fi
exec firebase "$@"
