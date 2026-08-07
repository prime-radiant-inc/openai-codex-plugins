#!/usr/bin/env bash
# Start the brainstorm server and output connection info
# Usage: start-server.sh [--project-dir <path>] [--host <bind-host>] [--url-host <display-host>] [--idle-timeout-minutes <minutes>] [--open] [--foreground] [--background]
#
# Starts server on a random high port, outputs JSON with URL.
# Each session gets its own directory to avoid conflicts.
#
# Options:
#   --project-dir <path>  Store session files under <path>/.s-kit/brainstorm/
#                         instead of /tmp. Files persist after server stops.
#   --host <bind-host>    Host/interface to bind (default: 127.0.0.1).
#                         Use 0.0.0.0 in remote/containerized environments.
#   --url-host <host>     Hostname shown in returned URL JSON.
#   --idle-timeout-minutes <minutes>
#                         Stop the server after this many idle minutes.
#   --open                Open the browser when the first screen is available.
#   --foreground          Run server in the current terminal (no backgrounding).
#   --background          Force background mode (overrides Codex auto-foreground).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
umask 077

json_error() {
  local message="$1"
  echo "{\"error\": \"$message\"}"
}

is_windows_like() {
  case "${OSTYPE:-}" in
    msys*|cygwin*|mingw*) return 0 ;;
  esac
  if [[ -n "${MSYSTEM:-}" ]]; then
    return 0
  fi
  local uname_s
  uname_s="$(uname -s 2>/dev/null || true)"
  case "$uname_s" in
    MINGW*_NT-*|MSYS*_NT-*|CYGWIN*_NT-*) return 0 ;;
  esac
  return 1
}

generate_server_id() {
  local id=""
  if [[ -r /dev/urandom ]]; then
    id="$(LC_ALL=C tr -dc 'A-Za-z0-9_-' < /dev/urandom | head -c 48)"
  fi
  if [[ -z "$id" ]] && command -v openssl >/dev/null 2>&1; then
    id="$(openssl rand -base64 48 2>/dev/null | tr -dc 'A-Za-z0-9_-' | head -c 48)"
  fi
  if [[ -z "$id" ]] && command -v uuidgen >/dev/null 2>&1; then
    id="$(printf '%s%s%s%s' "$(uuidgen)" "$(uuidgen)" "$(uuidgen)" "$(uuidgen)" | tr -dc 'A-Za-z0-9_-' | head -c 48)"
  fi
  if [[ -z "$id" ]]; then
    id="$(printf '%s-%s-%s-%s' "$$" "$(date +%s%N 2>/dev/null || date +%s)" "$RANDOM" "$RANDOM" | tr -dc 'A-Za-z0-9_-' | head -c 48)"
  fi
  while [[ ${#id} -lt 32 ]]; do
    id="${id}${RANDOM}"
  done
  printf '%s\n' "${id:0:64}"
}

# Parse arguments
PROJECT_DIR=""
FOREGROUND="false"
FORCE_BACKGROUND="false"
BIND_HOST="127.0.0.1"
URL_HOST=""
IDLE_TIMEOUT_MINUTES=""
IDLE_TIMEOUT_MS=""
OPEN_BROWSER="false"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir)
      if [[ -z "${2:-}" ]]; then
        json_error "Missing value for --project-dir"
        exit 1
      fi
      PROJECT_DIR="$2"
      shift 2
      ;;
    --host)
      if [[ -z "${2:-}" ]]; then
        json_error "Missing value for --host"
        exit 1
      fi
      BIND_HOST="$2"
      shift 2
      ;;
    --url-host)
      if [[ -z "${2:-}" ]]; then
        json_error "Missing value for --url-host"
        exit 1
      fi
      URL_HOST="$2"
      shift 2
      ;;
    --idle-timeout-minutes)
      if [[ -z "${2:-}" ]]; then
        json_error "Missing value for --idle-timeout-minutes"
        exit 1
      fi
      IDLE_TIMEOUT_MINUTES="$2"
      IDLE_TIMEOUT_MS="$(awk -v minutes="$IDLE_TIMEOUT_MINUTES" 'BEGIN {
        if (minutes !~ /^[0-9]+([.][0-9]+)?$/ || minutes <= 0) exit 1;
        printf "%.0f", minutes * 60000;
      }')" || {
        json_error "Invalid --idle-timeout-minutes: $IDLE_TIMEOUT_MINUTES"
        exit 1
      }
      shift 2
      ;;
    --open)
      OPEN_BROWSER="true"
      shift
      ;;
    --foreground|--no-daemon)
      FOREGROUND="true"
      shift
      ;;
    --background|--daemon)
      FORCE_BACKGROUND="true"
      shift
      ;;
    *)
      json_error "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$URL_HOST" ]]; then
  if [[ "$BIND_HOST" == "127.0.0.1" || "$BIND_HOST" == "localhost" ]]; then
    URL_HOST="localhost"
  else
    URL_HOST="$BIND_HOST"
  fi
fi

# Some environments reap detached/background processes. Auto-foreground when detected.
if [[ -n "${CODEX_CI:-}" && "$FOREGROUND" != "true" && "$FORCE_BACKGROUND" != "true" ]]; then
  FOREGROUND="true"
fi

# Windows/Git Bash reaps nohup background processes. Auto-foreground when detected.
WINDOWS_LIKE="false"
if is_windows_like; then
  WINDOWS_LIKE="true"
fi

if [[ "$WINDOWS_LIKE" == "true" && "$FOREGROUND" != "true" && "$FORCE_BACKGROUND" != "true" ]]; then
  FOREGROUND="true"
fi

# Generate unique session directory
SESSION_ID="$$-$(date +%s)"

if [[ -n "$PROJECT_DIR" ]]; then
  SESSION_DIR="${PROJECT_DIR}/.s-kit/brainstorm/${SESSION_ID}"
else
  SESSION_DIR="/tmp/brainstorm-${SESSION_ID}"
fi

STATE_DIR="${SESSION_DIR}/state"
PID_FILE="${STATE_DIR}/server.pid"
LOG_FILE="${STATE_DIR}/server.log"
PORT_FILE="${STATE_DIR}/.last-port"
TOKEN_FILE="${STATE_DIR}/.last-token"
SERVER_ID_FILE="${STATE_DIR}/server-instance-id"

# Create fresh session directory with content and state peers
mkdir -p "${SESSION_DIR}/content" "$STATE_DIR"
SERVER_ID="$(generate_server_id)"
echo "$SERVER_ID" > "$SERVER_ID_FILE"

# Kill any existing server
if [[ -f "$PID_FILE" ]]; then
  old_pid=$(cat "$PID_FILE")
  kill "$old_pid" 2>/dev/null
  rm -f "$PID_FILE"
fi

cd "$SCRIPT_DIR"

# Resolve the harness PID (grandparent of this script).
# $PPID is the ephemeral shell the harness spawned to run us — it dies
# when this script exits. The harness itself is $PPID's parent.
OWNER_PID="$(ps -o ppid= -p "$PPID" 2>/dev/null | tr -d ' ')"
if [[ -z "$OWNER_PID" || "$OWNER_PID" == "1" ]]; then
  OWNER_PID="$PPID"
fi
if [[ "$WINDOWS_LIKE" == "true" ]]; then
  OWNER_PID=""
fi

ENV_ARGS=(
  "BRAINSTORM_DIR=$SESSION_DIR"
  "BRAINSTORM_HOST=$BIND_HOST"
  "BRAINSTORM_URL_HOST=$URL_HOST"
  "BRAINSTORM_OWNER_PID=$OWNER_PID"
  "BRAINSTORM_PORT_FILE=$PORT_FILE"
  "BRAINSTORM_TOKEN_FILE=$TOKEN_FILE"
)
if [[ -n "$IDLE_TIMEOUT_MS" ]]; then
  ENV_ARGS+=("BRAINSTORM_IDLE_TIMEOUT_MS=$IDLE_TIMEOUT_MS")
fi
if [[ "$OPEN_BROWSER" == "true" ]]; then
  ENV_ARGS+=("BRAINSTORM_OPEN=1")
fi

retry_args=()
if [[ -n "$PROJECT_DIR" ]]; then
  retry_args+=(--project-dir "$PROJECT_DIR")
fi
retry_args+=(--host "$BIND_HOST" --url-host "$URL_HOST")
if [[ -n "$IDLE_TIMEOUT_MINUTES" ]]; then
  retry_args+=(--idle-timeout-minutes "$IDLE_TIMEOUT_MINUTES")
fi
if [[ "$OPEN_BROWSER" == "true" ]]; then
  retry_args+=(--open)
fi
retry_args+=(--foreground)

# Foreground mode for environments that reap detached/background processes.
if [[ "$FOREGROUND" == "true" ]]; then
  echo "$$" > "$PID_FILE"
  exec env "${ENV_ARGS[@]}" node server.cjs "--brainstorm-server-id=$SERVER_ID"
fi

# Start server, capturing output to log file
# Use nohup to survive shell exit; disown to remove from job table
nohup env "${ENV_ARGS[@]}" node server.cjs "--brainstorm-server-id=$SERVER_ID" > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
disown "$SERVER_PID" 2>/dev/null
echo "$SERVER_PID" > "$PID_FILE"

# Wait for server-started message (check log file)
for i in {1..50}; do
  if grep -q "server-started" "$LOG_FILE" 2>/dev/null; then
    # Verify server is still alive after a short window (catches process reapers)
    alive="true"
    for _ in {1..20}; do
      if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        alive="false"
        break
      fi
      sleep 0.1
    done
    if [[ "$alive" != "true" ]]; then
      printf '{"error": "Server started but was killed. Retry in a persistent terminal with: %s/start-server.sh' "$SCRIPT_DIR"
      for arg in "${retry_args[@]}"; do
        printf ' %q' "$arg"
      done
      printf '"}\n'
      exit 1
    fi
    grep "server-started" "$LOG_FILE" | head -1
    exit 0
  fi
  sleep 0.1
done

# Timeout - server didn't start
echo '{"error": "Server failed to start within 5 seconds"}'
exit 1
