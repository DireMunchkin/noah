#!/bin/sh
set -eu

install --directory --owner barkd --group barkd --mode 0700 "${BARKD_DATADIR}"
chown barkd:barkd "${BARKD_DATADIR}"
chmod 0700 "${BARKD_DATADIR}"

exec gosu barkd:barkd "$@"
