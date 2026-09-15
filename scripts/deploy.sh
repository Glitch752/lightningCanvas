#!/bin/sh
set -eu

# deoloy to a remote Alpine server.
# i'll be so real, this is vibe slop. i hate deploying and it works

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
CONFIG_FILE=${DEPLOY_CONFIG:-"$ROOT_DIR/.env.deploy"}

if [ -f "$CONFIG_FILE" ]; then
    . "$CONFIG_FILE"
fi

SSH=${DEPLOY_SSH:-/bin/ssh}
SCP=${DEPLOY_SCP:-/bin/scp}
TARGET="$DEPLOY_USER@$DEPLOY_HOST"
STAGING_DIR=$(mktemp -d)
ARCHIVE="$STAGING_DIR/lightningcanvas.tgz"
cleanup() {
    rm -rf "$STAGING_DIR"
}
trap cleanup EXIT INT TERM

if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "Missing $ROOT_DIR/.env (application runtime configuration)." >&2
    exit 1
fi

echo "Checking SSH access to $TARGET..."
"$SSH" -p "$DEPLOY_PORT" -o BatchMode=yes "$TARGET" true

echo "Checking and installing required Alpine packages..."
"$SSH" -p "$DEPLOY_PORT" "$TARGET" \
    'apk add --no-cache nodejs npm ca-certificates tzdata >/dev/null'

echo "Running checks and building production output..."
cd "$ROOT_DIR"
pnpm run check
pnpm run build

echo "Packaging build, environment, and data..."
mkdir -p "$STAGING_DIR"
cp -a "$ROOT_DIR/build" "$ROOT_DIR/package.json" "$ROOT_DIR/pnpm-lock.yaml" \
    "$ROOT_DIR/.env" "$ROOT_DIR/data" "$STAGING_DIR/"
tar -C "$STAGING_DIR" -czf "$ARCHIVE" build package.json pnpm-lock.yaml .env data

echo "Uploading application..."
"$SSH" -p "$DEPLOY_PORT" "$TARGET" "mkdir -p '$DEPLOY_PATH'"
"$SCP" -P "$DEPLOY_PORT" "$ARCHIVE" "$TARGET:/tmp/lightningcanvas.tgz"

echo "Installing application and configuring service..."
"$SSH" -p "$DEPLOY_PORT" "$TARGET" \
    "DEPLOY_PATH='$DEPLOY_PATH' sh -s" <<'REMOTE'
set -eu

rm -rf "$DEPLOY_PATH"/*
tar -C "$DEPLOY_PATH" -xzf /tmp/lightningcanvas.tgz
rm -f /tmp/lightningcanvas.tgz
cd "$DEPLOY_PATH"
npm install --omit=dev --ignore-scripts >/dev/null

cat >"$DEPLOY_PATH/start.sh" <<START
#!/bin/sh
set -a
. "$DEPLOY_PATH/.env"
set +a
exec /usr/bin/node "$DEPLOY_PATH/build/index.js"
START
chmod 700 "$DEPLOY_PATH/start.sh"

cat >/etc/init.d/lightningcanvas <<SERVICE
#!/sbin/openrc-run
name="lightningcanvas"
description="LightningCanvas SvelteKit server"
directory="$DEPLOY_PATH"
command="$DEPLOY_PATH/start.sh"
command_args=""
command_user="root"
pidfile="/run/lightningcanvas.pid"
outfile="/var/log/lightningcanvas.log"
errfile="/var/log/lightningcanvas.log"
command_background="yes"
export NODE_ENV="production"
export HOST="0.0.0.0"
export PORT="3000"
SERVICE
cat >>/etc/init.d/lightningcanvas <<'SERVICE'

depend() {
    need net
}
SERVICE
chmod +x /etc/init.d/lightningcanvas
rc-update add lightningcanvas default >/dev/null
rc-service lightningcanvas stop >/dev/null 2>&1 || true
for pid in $(ps -o pid=,args= | awk '$2 == "/usr/bin/node" && $3 == "/opt/lightningcanvas/build/index.js" {print $1}'); do
    kill "$pid" >/dev/null 2>&1 || true
done
rc-service lightningcanvas zap >/dev/null 2>&1 || true
rm -f /run/lightningcanvas.pid
rc-service lightningcanvas start
REMOTE

echo "Verifying deployment..."
"$SSH" -p "$DEPLOY_PORT" "$TARGET" 'sh -s' <<'VERIFY'
set -eu

attempt=0
while ! wget -q -O /dev/null http://127.0.0.1:3000/login; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 10 ]; then
        echo "LightningCanvas did not become ready." >&2
        rc-service lightningcanvas status || true
        tail -50 /var/log/lightningcanvas.log 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

rc-service lightningcanvas status
echo "HTTP health check passed."
VERIFY
echo "Deployment complete."
