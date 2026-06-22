#!/usr/bin/env bash
# Stop the brainstorm server and clean up
# Usage: stop-server.sh <session_dir>
#
# Kills the server process. Only deletes session directory if it's
# under /tmp (ephemeral). Persistent directories (.s-kit/) are
# kept so mockups can be reviewed later.

SESSION_DIR="$1"
umask 077

if [[ -z "$SESSION_DIR" ]]; then
  echo '{"error": "Usage: stop-server.sh <session_dir>"}'
  exit 1
fi

STATE_DIR="${SESSION_DIR}/state"
PID_FILE="${STATE_DIR}/server.pid"
LOG_FILE="${STATE_DIR}/server.log"
INFO_FILE="${STATE_DIR}/server-info"
STOPPED_FILE="${STATE_DIR}/server-stopped"
SERVER_ID_FILE="${STATE_DIR}/server-instance-id"

write_stopped() {
  local reason="$1"
  mkdir -p "$STATE_DIR"
  printf '{"reason":"%s","timestamp":"%s"}\n' "$reason" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" > "$STOPPED_FILE"
}

cleanup_alive_metadata() {
  rm -f "$PID_FILE" "$INFO_FILE" "$SERVER_ID_FILE"
}

stale_pid() {
  cleanup_alive_metadata
  write_stopped "stale_pid"
  echo '{"status": "stale_pid"}'
}

is_valid_server_id() {
  local server_id="$1"
  [[ ${#server_id} -ge 32 && ${#server_id} -le 64 ]] || return 1
  case "$server_id" in
    *[!A-Za-z0-9_-]*|"") return 1 ;;
  esac
  return 0
}

pid_command_line() {
  local pid="$1"
  local cmdline
  cmdline="$(ps -p "$pid" -o args= 2>/dev/null || true)"
  if [[ -z "$cmdline" ]]; then
    cmdline="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  fi
  if [[ -z "$cmdline" ]]; then
    cmdline="$(ps -p "$pid" -f 2>/dev/null | tail -n +2 || true)"
  fi
  printf '%s\n' "$cmdline"
}

owns_pid() {
  local pid="$1"
  local server_id="$2"
  local cmdline
  cmdline="$(pid_command_line "$pid" | tr -d '\r')"
  [[ "$cmdline" == *"server.cjs"* && "$cmdline" == *"--brainstorm-server-id=$server_id"* ]]
}

if [[ -f "$PID_FILE" ]]; then
  pid="$(cat "$PID_FILE" 2>/dev/null | tr -d '[:space:]')"
  server_id="$(cat "$SERVER_ID_FILE" 2>/dev/null | tr -d '[:space:]' || true)"

  if [[ ! "$pid" =~ ^[0-9]+$ ]] || ! is_valid_server_id "$server_id" || ! kill -0 "$pid" 2>/dev/null || ! owns_pid "$pid" "$server_id"; then
    stale_pid
    exit 0
  fi

  # Try to stop gracefully, fallback to force if still alive
  kill "$pid" 2>/dev/null || true

  # Wait for graceful shutdown (up to ~2s)
  for i in {1..20}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 0.1
  done

  # If still running, escalate to SIGKILL
  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true

    # Give SIGKILL a moment to take effect
    sleep 0.1
  fi

  if kill -0 "$pid" 2>/dev/null; then
    echo '{"status": "failed", "error": "process still running"}'
    exit 1
  fi

  rm -f "$PID_FILE" "$LOG_FILE" "$INFO_FILE" "$SERVER_ID_FILE"
  write_stopped "stop-server.sh"

  # Only delete script-created ephemeral sessions, not project .s-kit sessions.
  session_parent="$(cd "$(dirname "$SESSION_DIR")" 2>/dev/null && pwd || true)"
  session_name="$(basename "$SESSION_DIR")"
  if [[ "$session_parent" == "/tmp" && "$session_name" == brainstorm-* ]]; then
    rm -rf "$SESSION_DIR"
  fi

  echo '{"status": "stopped"}'
else
  echo '{"status": "not_running"}'
fi
