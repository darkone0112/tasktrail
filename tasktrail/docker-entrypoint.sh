#!/bin/sh
set -eu

if [ "${TASKTRAIL_DB_SETUP:-true}" = "true" ]; then
	echo "Applying the TaskTrail database schema..."
	npx prisma db push --skip-generate

	echo "Seeding required lookup data..."
	npx prisma db seed
fi

exec "$@"
