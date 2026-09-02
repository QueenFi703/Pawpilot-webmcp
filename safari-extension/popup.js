let activeTabId = null;
let currentReport = null;

async function getActiveTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderDiagnostics(diagnostics) {
  setText('runtime', diagnostics.runtime || 'Safari WebKit');
  setText('native', diagnostics.nativeWebMCP ? 'Available' : 'Unavailable');
  setText('tool-count', String(diagnostics.toolCount || 0));
  setText('diagnostic', diagnostics.bridgeActive ? 'Bridge active' : 'Check');
  setText('page-title', diagnostics.title || diagnostics.url || 'Active page');
  document.getElementById('bridge-status').textContent = diagnostics.bridgeActive ? 'ACTIVE' : 'CHECK';
}

function renderTools(tools) {
  const root = document.getElementById('tools');
  setText('tool-label', `${tools.length} discovered`);
  root.innerHTML = '';

  if (!tools.length) {
    root.innerHTML = '<div class="empty">No native WebMCP tools discovered. The Safari Bridge is still active.</div>';
    return;
  }

  for (const tool of tools) {
    const item = document.createElement('article');
    item.className = 'tool';

    const title = document.createElement('div');
    title.className = 'tool-head';
    title.innerHTML = `<strong>${escapeHtml(tool.name)}</strong><span>${tool.annotations?.readOnlyHint ? 'READ' : 'WRITE'}</span>`;

    const description = document.createElement('p');
    description.textContent = tool.description || 'No description provided.';

    const execute = document.createElement('button');
    execute.className = 'tool-execute';
    execute.textContent = 'Inspect / Execute';
    execute.addEventListener('click', () => executeTool(tool));

    item.append(title, description, execute);
    root.appendChild(item);
  }
}

async function discover() {
  const result = await browser.tabs.sendMessage(activeTabId, { type: 'DISCOVER_TOOLS' });
  currentReport = null;
  renderDiagnostics(result.diagnostics);
  renderTools(result.tools || []);
}

async function executeTool(tool) {
  const raw = prompt(`Arguments for ${tool.name} (JSON):`, '{}');
  if (raw === null) return;

  let args;
  try {
    args = JSON.parse(raw || '{}');
  } catch (_) {
    alert('Arguments must be valid JSON.');
    return;
  }

  const readOnly = Boolean(tool.annotations?.readOnlyHint || tool.annotations?.readOnly);
  const confirmed = readOnly || confirm(`Execute ${tool.name}?\n\nWrite-capable tools require explicit confirmation.`);
  if (!confirmed) return;

  const result = await browser.tabs.sendMessage(activeTabId, {
    type: 'EXECUTE_TOOL',
    name: tool.name,
    args,
    confirmed,
  });

  if (!result.ok) alert(result.error || 'Tool execution failed.');
  else alert(JSON.stringify(result.result, null, 2));
}

async function openConsole() {
  await browser.tabs.sendMessage(activeTabId, { type: 'TOGGLE_CONSOLE' });
  window.close();
}

async function exportReport() {
  const response = await browser.tabs.sendMessage(activeTabId, { type: 'GET_REPORT' });
  currentReport = response.report;

  // Safari-safe export: deliberately avoid Blob URLs and URL.createObjectURL().
  const json = JSON.stringify(currentReport, null, 2);
  const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = 'pawpilot-webmcp-report.json';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

(async function init() {
  try {
    const tab = await getActiveTab();
    activeTabId = tab?.id;
    if (!activeTabId) throw new Error('No active tab.');

    const response = await browser.tabs.sendMessage(activeTabId, { type: 'GET_DIAGNOSTICS' });
    renderDiagnostics(response.diagnostics);
    renderTools(response.tools || []);
  } catch (error) {
    setText('page-title', error.message || 'Open a supported PawPilot page and try again.');
    setText('bridge-status', 'NO ACCESS');
  }
})();

document.getElementById('discover').addEventListener('click', () => discover().catch((error) => alert(error.message)));
document.getElementById('console').addEventListener('click', () => openConsole().catch((error) => alert(error.message)));
document.getElementById('export').addEventListener('click', () => exportReport().catch((error) => alert(error.message)));
