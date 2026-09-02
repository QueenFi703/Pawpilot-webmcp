(() => {
  if (window.__PAWPILOT_WEBMCP_BRIDGE__) return;
  window.__PAWPILOT_WEBMCP_BRIDGE__ = true;

  const state = {
    tools: [],
    events: [],
    runtime: 'Safari WebKit',
    nativeWebMCP: false,
    testingAPI: false,
  };

  const modelContext = () => window.document?.modelContext || window.navigator?.modelContext || null;

  function pushEvent(event) {
    const entry = { ...event, timestamp: new Date().toISOString() };
    state.events.push(entry);
    if (state.events.length > 200) state.events.shift();
    browser.runtime.sendMessage({ type: 'BRIDGE_EVENT', event: entry }).catch(() => {});
    renderEvent(entry);
  }

  function getDiagnostics() {
    const mc = modelContext();
    state.nativeWebMCP = Boolean(mc?.registerTool || mc?.getTools);
    state.testingAPI = Boolean(window.navigator?.modelContextTesting);

    let toolsPermission = null;
    try {
      toolsPermission = document.permissionsPolicy?.allowsFeature?.('tools') ?? null;
    } catch (_) {}

    return {
      url: location.href,
      origin: location.origin,
      title: document.title,
      runtime: state.runtime,
      nativeWebMCP: state.nativeWebMCP,
      bridgeActive: true,
      testingAPI: state.testingAPI,
      crossOriginIsolated: Boolean(window.crossOriginIsolated),
      toolsPermission,
      toolCount: state.tools.length,
      timestamp: new Date().toISOString(),
    };
  }

  async function discoverTools() {
    const mc = modelContext();
    if (!mc?.getTools) {
      state.tools = [];
      pushEvent({ type: 'discovery', status: 'native-webmcp-unavailable', message: 'Native WebMCP was not detected; bridge remains active.' });
      return { tools: [], diagnostics: getDiagnostics() };
    }

    try {
      const tools = await mc.getTools();
      state.tools = Array.isArray(tools) ? tools : [];
      pushEvent({ type: 'discovery', status: 'success', count: state.tools.length });
      return { tools: state.tools, diagnostics: getDiagnostics() };
    } catch (error) {
      pushEvent({ type: 'discovery', status: 'error', message: error.message });
      return { tools: [], diagnostics: getDiagnostics(), error: error.message };
    }
  }

  async function executeTool(name, args, confirmed = false) {
    const tool = state.tools.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`Tool not found: ${name}`);

    const readOnly = Boolean(tool.annotations?.readOnlyHint || tool.annotations?.readOnly);
    if (!readOnly && !confirmed) {
      throw new Error('Write-capable tools require explicit confirmation in the Bridge.');
    }

    const mc = modelContext();
    if (!mc?.executeTool) throw new Error('Native WebMCP executeTool is unavailable in this Safari runtime.');

    const started = performance.now();
    pushEvent({ type: 'tool-start', name, args, readOnly });
    try {
      const result = await mc.executeTool(tool, JSON.stringify(args || {}));
      pushEvent({ type: 'tool-complete', name, durationMs: Math.round(performance.now() - started), result });
      return result;
    } catch (error) {
      pushEvent({ type: 'tool-error', name, durationMs: Math.round(performance.now() - started), message: error.message });
      throw error;
    }
  }

  function report() {
    return {
      schemaVersion: 'pawpilot-webmcp-bridge/1',
      generatedAt: new Date().toISOString(),
      diagnostics: getDiagnostics(),
      tools: state.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
      })),
      events: state.events.slice(-200),
    };
  }

  browser.runtime.onMessage.addListener(async (message) => {
    switch (message?.type) {
      case 'DISCOVER_TOOLS':
        return discoverTools();
      case 'GET_DIAGNOSTICS':
        return { diagnostics: getDiagnostics(), tools: state.tools };
      case 'EXECUTE_TOOL':
        try {
          const result = await executeTool(message.name, message.args, message.confirmed === true);
          return { ok: true, result };
        } catch (error) {
          return { ok: false, error: error.message };
        }
      case 'GET_REPORT':
        return { report: report() };
      case 'TOGGLE_CONSOLE':
        toggleConsole();
        return { ok: true };
      default:
        return undefined;
    }
  });

  function createConsole() {
    const root = document.createElement('aside');
    root.id = 'pawpilot-webmcp-console';
    root.innerHTML = `
      <div class="pw-header"><strong>PawPilot WebMCP Console</strong><button id="pw-close" aria-label="Close">×</button></div>
      <div class="pw-status" id="pw-status">Bridge active · checking WebMCP…</div>
      <div class="pw-actions"><button id="pw-discover">Discover Tools</button><button id="pw-report">Export Report</button></div>
      <section><h3>Discovered Tools <span id="pw-count">0</span></h3><div id="pw-tools" class="pw-list"></div></section>
      <section><h3>Diagnostics & Events</h3><pre id="pw-events" class="pw-events"></pre></section>
    `;
    document.documentElement.appendChild(root);

    root.querySelector('#pw-close').onclick = () => root.remove();
    root.querySelector('#pw-discover').onclick = async () => {
      const result = await discoverTools();
      renderTools(result.tools || []);
      renderStatus(result.diagnostics);
    };
    root.querySelector('#pw-report').onclick = () => exportReport(report());

    renderTools(state.tools);
    renderStatus(getDiagnostics());
    return root;
  }

  function renderStatus(diagnostics) {
    const el = document.querySelector('#pw-status');
    if (!el) return;
    const native = diagnostics.nativeWebMCP ? 'Native WebMCP detected' : 'Native WebMCP unavailable';
    el.textContent = `${native} · Safari Bridge active · ${diagnostics.toolCount} tools`;
  }

  function renderTools(tools) {
    const count = document.querySelector('#pw-count');
    const list = document.querySelector('#pw-tools');
    if (!list) return;
    count.textContent = String(tools.length);
    list.innerHTML = tools.length ? tools.map((tool) => `<div class="pw-tool"><strong>${escapeHtml(tool.name)}</strong><span>${escapeHtml(tool.description || '')}</span></div>`).join('') : '<div class="pw-empty">No native WebMCP tools discovered.</div>';
  }

  function renderEvent(event) {
    const el = document.querySelector('#pw-events');
    if (!el) return;
    el.textContent += `${JSON.stringify(event)}\n`;
    el.scrollTop = el.scrollHeight;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function exportReport(data) {
    const json = JSON.stringify(data, null, 2);
    const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'pawpilot-webmcp-report.json';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    pushEvent({ type: 'report-export', status: 'success', method: 'data-url' });
  }

  function toggleConsole() {
    const existing = document.querySelector('#pawpilot-webmcp-console');
    if (existing) existing.remove();
    else createConsole();
  }

  document.addEventListener('toolchange', () => {
    pushEvent({ type: 'toolchange' });
    discoverTools().then((result) => renderTools(result.tools || []));
  });

  window.PawPilotWebMCPBridge = {
    discoverTools,
    executeTool,
    getDiagnostics,
    getReport: report,
    openConsole: toggleConsole,
  };

  discoverTools().then(() => pushEvent({ type: 'bridge-ready' }));
})();
