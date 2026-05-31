#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
EDGE_LOG_FILE="/tmp/dreyk-ingest-location-edge.log"
SERVER_PID=""
TEST_EMAIL="phase8-ingest@example.com"
TEST_PASSWORD="Phase8Pass123!"
TEST_USER_ID=""

resolve_supabase_env() {
  eval "$({ supabase status -o env || true; } | python3 -c "import sys
for raw_line in sys.stdin:
    line = raw_line.strip()
    if '=' not in line:
        continue
    name, value = line.split('=', 1)
    if not name.replace('_', '').isalnum():
        continue
    print(f'export {name}={value}')")"
}

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi

  if [[ -n "$TEST_USER_ID" ]]; then
    psql "$DB_URL" <<SQL >/dev/null 2>&1 || true
delete from public.tracking_points where user_id = '$TEST_USER_ID';
delete from public.profiles where id = '$TEST_USER_ID';
delete from auth.users where id = '$TEST_USER_ID';
SQL
  fi
}

trap cleanup EXIT

resolve_supabase_env

cd "$ROOT_DIR"

supabase stop --no-backup >/dev/null 2>&1 || true
supabase start >/dev/null
resolve_supabase_env

if [[ -z "${API_URL:-}" || -z "${ANON_KEY:-}" || -z "${DB_URL:-}" ]]; then
  echo "Unable to resolve local Supabase env vars after startup." >&2
  exit 1
fi

supabase functions serve ingest-location --no-verify-jwt >"$EDGE_LOG_FILE" 2>&1 &
SERVER_PID="$!"

sleep 5

python3 - <<'PY'
import json
import os
import time
import urllib.error
import urllib.request

url = f"{os.environ['API_URL']}/functions/v1/ingest-location"
headers = {
    'Authorization': 'Bearer boot-check',
    'Content-Type': 'application/json',
}
body = json.dumps({'points': [{'capturedAt': '2026-05-31T19:00:00.000Z', 'latitude': 0, 'longitude': 0, 'accuracyMeters': None, 'altitudeMeters': None, 'headingDegrees': None, 'speedMetersPerSecond': None}]}).encode()

for _ in range(80):
    request = urllib.request.Request(url, data=body, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=1):
            break
    except urllib.error.HTTPError as error:
        if error.code in {401, 500}:
            break
    except Exception:
        time.sleep(0.5)
else:
    raise SystemExit('Timed out waiting for ingest-location function to start.')
PY

SIGNUP_RESPONSE="$(curl --silent --show-error "$API_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")"

TEST_USER_ID="$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['user']['id'])" "$SIGNUP_RESPONSE")"
ACCESS_TOKEN="$(python3 -c "import json,sys; data=json.loads(sys.argv[1]); session=data.get('session') or {}; print(session.get('access_token',''))" "$SIGNUP_RESPONSE")"

if [[ -z "$TEST_USER_ID" ]]; then
  echo "Signup did not return a user id: $SIGNUP_RESPONSE" >&2
  exit 1
fi

if [[ -z "$ACCESS_TOKEN" ]]; then
  SIGNIN_RESPONSE="$(curl --silent --show-error "$API_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")"
  ACCESS_TOKEN="$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('access_token',''))" "$SIGNIN_RESPONSE")"
fi

if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "Unable to obtain an auth token for local ingest-location smoke validation." >&2
  exit 1
fi

psql "$DB_URL" <<SQL >/dev/null
insert into public.profiles (id, display_name, role)
values ('$TEST_USER_ID', 'Phase 8 Ingest Smoke', 'user')
on conflict (id) do update
set display_name = excluded.display_name,
    role = 'user',
    is_active = true;
SQL

VALID_STATUS="$(curl --silent --show-error --output /tmp/dreyk-ingest-valid.json --write-out "%{http_code}" "$API_URL/functions/v1/ingest-location" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"points":[{"accuracyMeters":5,"altitudeMeters":20,"capturedAt":"2026-05-31T19:00:00.000Z","headingDegrees":45,"latitude":-34.6037,"longitude":-58.3816,"speedMetersPerSecond":3}]}' )"

if [[ "$VALID_STATUS" != "201" ]]; then
  echo "Expected 201 from valid ingest request, got $VALID_STATUS" >&2
  cat /tmp/dreyk-ingest-valid.json >&2
  exit 1
fi

INSERT_COUNT="$(psql "$DB_URL" -Atc "select count(*) from public.tracking_points where user_id = '$TEST_USER_ID';")"
LOCATION_EVENT_COUNT="$(psql "$DB_URL" -Atc "select count(*) from public.location_events where user_id = '$TEST_USER_ID';")"
CURSOR_COUNT="$(psql "$DB_URL" -Atc "select count(*) from public.tracking_user_cursors where user_id = '$TEST_USER_ID';")"
PRESENCE_COUNT="$(psql "$DB_URL" -Atc "select count(*) from public.user_zone_presence where user_id = '$TEST_USER_ID';")"

if [[ "$INSERT_COUNT" != "1" ]]; then
  echo "Expected 1 tracking row after valid ingest, got $INSERT_COUNT" >&2
  exit 1
fi

if [[ "$LOCATION_EVENT_COUNT" != "0" || "$CURSOR_COUNT" != "0" || "$PRESENCE_COUNT" != "0" ]]; then
  echo "ingest-location must remain raw-only. events=$LOCATION_EVENT_COUNT cursors=$CURSOR_COUNT presence=$PRESENCE_COUNT" >&2
  exit 1
fi

INVALID_STATUS="$(curl --silent --show-error --output /tmp/dreyk-ingest-invalid.json --write-out "%{http_code}" "$API_URL/functions/v1/ingest-location" \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"points":[{"accuracyMeters":5,"altitudeMeters":20,"capturedAt":"2026-05-31T19:05:00.000Z","headingDegrees":45,"latitude":-34.6037,"longitude":-58.3816,"speedMetersPerSecond":3}]}' )"

if [[ "$INVALID_STATUS" != "401" ]]; then
  echo "Expected 401 from invalid auth ingest request, got $INVALID_STATUS" >&2
  cat /tmp/dreyk-ingest-invalid.json >&2
  exit 1
fi

FINAL_COUNT="$(psql "$DB_URL" -Atc "select count(*) from public.tracking_points where user_id = '$TEST_USER_ID';")"
FINAL_EVENT_COUNT="$(psql "$DB_URL" -Atc "select count(*) from public.location_events where user_id = '$TEST_USER_ID';")"
FINAL_CURSOR_COUNT="$(psql "$DB_URL" -Atc "select count(*) from public.tracking_user_cursors where user_id = '$TEST_USER_ID';")"
FINAL_PRESENCE_COUNT="$(psql "$DB_URL" -Atc "select count(*) from public.user_zone_presence where user_id = '$TEST_USER_ID';")"

if [[ "$FINAL_COUNT" != "1" ]]; then
  echo "Invalid auth request should not insert rows. Count is $FINAL_COUNT" >&2
  exit 1
fi

if [[ "$FINAL_EVENT_COUNT" != "0" || "$FINAL_CURSOR_COUNT" != "0" || "$FINAL_PRESENCE_COUNT" != "0" ]]; then
  echo "ingest-location invalid auth path must not touch detection state. events=$FINAL_EVENT_COUNT cursors=$FINAL_CURSOR_COUNT presence=$FINAL_PRESENCE_COUNT" >&2
  exit 1
fi

echo "ingest-location smoke validation passed."
