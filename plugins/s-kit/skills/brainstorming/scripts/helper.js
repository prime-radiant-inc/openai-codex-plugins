(function() {
  const MIN_RECONNECT_MS = 500;
  const MAX_RECONNECT_MS = 30000;
  const TOMBSTONE_AFTER_MS = 15000;

  function nextReconnectDelay(current, max) {
    return Math.min(current * 2, max);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { nextReconnectDelay, MIN_RECONNECT_MS, MAX_RECONNECT_MS, TOMBSTONE_AFTER_MS };
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

    let ws = null;
    let eventQueue = [];
    let reconnectDelay = MIN_RECONNECT_MS;
    let reconnectTimer = null;
    let tombstoneTimer = null;
    let tombstoned = false;

    function sessionKey() {
      try {
        return window.sessionStorage && window.sessionStorage.getItem('brainstorm-session-key');
      } catch (e) {
        return null;
      }
    }

    function websocketUrl() {
      const key = sessionKey();
      const base = 'ws://' + window.location.host;
      return key ? base + '/?key=' + encodeURIComponent(key) : base;
    }

    function setStatus(text, color) {
      const status = document.querySelector('.status');
      if (!status) return;
      status.textContent = text;
      if (status.style && status.style.setProperty) {
        status.style.setProperty('--status-color', color);
      }
    }

    function clearReconnectTimer() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }

    function clearTombstoneTimer() {
      if (tombstoneTimer) {
        clearTimeout(tombstoneTimer);
        tombstoneTimer = null;
      }
    }

    function showTombstone() {
      tombstoneTimer = null;
      tombstoned = true;
      setStatus('Disconnected', '#b00020');

      if (document.getElementById('bs-tombstone')) return;

      const tombstone = document.createElement('div');
      tombstone.id = 'bs-tombstone';
      tombstone.className = 'bs-tombstone';
      tombstone.textContent = 'Companion paused. Reconnecting to the brainstorming companion...';
      const parent = document.body || document.documentElement;
      if (parent && parent.appendChild) {
        parent.appendChild(tombstone);
      }
    }

    function startTombstoneTimer() {
      if (tombstoned || tombstoneTimer) return;
      tombstoneTimer = setTimeout(showTombstone, TOMBSTONE_AFTER_MS);
    }

    function recoverFromTombstone() {
      const key = sessionKey();
      if (key && window.location && window.location.replace) {
        window.location.replace('/?key=' + encodeURIComponent(key));
      } else if (window.location && window.location.reload) {
        window.location.reload();
      }
    }

    function scheduleReconnect() {
      clearReconnectTimer();
      const delay = reconnectDelay;
      reconnectTimer = setTimeout(connect, delay);
      reconnectDelay = nextReconnectDelay(reconnectDelay, MAX_RECONNECT_MS);
    }

    function handleDisconnect(socket) {
      if (socket && ws !== socket) return;
      ws = null;
      setStatus('Reconnecting...', '#c77d00');
      startTombstoneTimer();
      scheduleReconnect();
    }

    function connect() {
      clearReconnectTimer();

      try {
        ws = new WebSocket(websocketUrl());
      } catch (e) {
        handleDisconnect(null);
        return;
      }

      const socket = ws;

      socket.onopen = () => {
        if (ws !== socket) return;
        clearReconnectTimer();
        if (tombstoned) {
          recoverFromTombstone();
          return;
        }
        clearTombstoneTimer();
        reconnectDelay = MIN_RECONNECT_MS;
        setStatus('Connected', '#1b7f3a');
        eventQueue.forEach(e => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(e));
          }
        });
        eventQueue = [];
      };

      socket.onmessage = (msg) => {
        let data = null;
        try {
          data = JSON.parse(msg.data);
        } catch (e) {
          return;
        }
        if (data && data.type === 'reload') {
          window.location.reload();
        }
      };

      socket.onerror = () => {
        handleDisconnect(socket);
      };

      socket.onclose = () => {
        handleDisconnect(socket);
      };
    }

    function sendEvent(event) {
      event.timestamp = Date.now();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      } else {
        eventQueue.push(event);
      }
    }

    // Capture clicks on choice elements
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-choice]');
      if (!target) return;

      sendEvent({
        type: 'click',
        text: target.textContent.trim(),
        choice: target.dataset.choice,
        id: target.id || null
      });

      // Update indicator bar (defer so toggleSelect runs first)
      setTimeout(() => {
        const indicator = document.getElementById('indicator-text');
        if (!indicator) return;
        const container = target.closest('.options') || target.closest('.cards');
        const selected = container ? container.querySelectorAll('.selected') : [];
        if (selected.length === 0) {
          indicator.textContent = 'Click an option above, then return to the terminal';
        } else if (selected.length === 1) {
          const label = selected[0].querySelector('h3, .content h3, .card-body h3')?.textContent?.trim() || selected[0].dataset.choice;
          indicator.innerHTML = '<span class="selected-text">' + label + ' selected</span> — return to terminal to continue';
        } else {
          indicator.innerHTML = '<span class="selected-text">' + selected.length + ' selected</span> — return to terminal to continue';
        }
      }, 0);
    });

    // Frame UI: selection tracking
    window.selectedChoice = null;

    window.toggleSelect = function(el) {
      const container = el.closest('.options') || el.closest('.cards');
      const multi = container && container.dataset.multiselect !== undefined;
      if (container && !multi) {
        container.querySelectorAll('.option, .card').forEach(o => o.classList.remove('selected'));
      }
      if (multi) {
        el.classList.toggle('selected');
      } else {
        el.classList.add('selected');
      }
      window.selectedChoice = el.dataset.choice;
    };

    // Expose API for explicit use
    window.brainstorm = {
      send: sendEvent,
      choice: (value, metadata = {}) => sendEvent({ type: 'choice', value, ...metadata })
    };

    connect();
})();
