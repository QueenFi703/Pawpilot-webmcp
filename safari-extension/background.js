const state = {
  events: [],
  lastReport: null,
};

const MAX_EVENTS = 200;

function recordEvent(event) {
  state.events.push({ ...event, timestamp: event.timestamp || new Date().toISOString() });
  if (state.events.length > MAX_EVENTS) state.events.shift();
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (!message?.type) return undefined;

  if (message.type === 'BRIDGE_EVENT') {
    recordEvent({
      source: sender.tab ? `tab:${sender.tab.id}` : 'extension',
      ...message.event,
    });
    return Promise.resolve({ ok: true });
  }

  if (message.type === 'GET_EVENTS') {
    return Promise.resolve({ events: state.events.slice(-MAX_EVENTS) });
  }

  if (message.type === 'SAVE_REPORT') {
    state.lastReport = message.report;
    return Promise.resolve({ ok: true });
  }

  return undefined;
});

browser.runtime.onInstalled.addListener(() => {
  recordEvent({ type: 'bridge-installed', source: 'background' });
});
