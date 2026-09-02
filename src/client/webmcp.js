import { normalizeToolParams } from '../shared/tool-input.js';

const toToolResult = (data) => ({
  content: [{ type: 'text', text: JSON.stringify(data) }],
  structuredContent: data,
});

function getModelContext() {
  if (typeof window === 'undefined') return null;
  return window.document?.modelContext || window.navigator?.modelContext || null;
}

export async function registerPawpilotTools(onActivity) {
  const modelContext = getModelContext();
  if (!modelContext?.registerTool) return { status: 'unavailable', registered: [], cleanup: async () => {} };

  const response = await fetch('/api/tools');
  if (!response.ok) throw new Error('Could not load PawPilot tools');
  const payload = await response.json();
  const toolCatalog = Array.isArray(payload?.tools) ? payload.tools : [];
  const registered = [];
  const registrationControllers = new Map();

  const unregister = async (name) => {
    const controller = registrationControllers.get(name);
    if (controller) {
      controller.abort();
      registrationControllers.delete(name);
    }

    // Older browser implementations may expose unregisterTool instead of
    // honoring the registration AbortSignal.
    if (modelContext.unregisterTool) {
      try { await modelContext.unregisterTool(name); } catch { /* best-effort cleanup */ }
    }
  };

  try {
    for (const tool of toolCatalog) {
      const controller = new AbortController();
      registrationControllers.set(tool.name, controller);

      await modelContext.registerTool({
        name: tool.name,
        title: tool.title || tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
        execute: async (rawParams, executionOptions = {}) => {
          const params = normalizeToolParams(tool.name, rawParams);
          const callId = `${tool.name}-${crypto.randomUUID()}`;
          const signal = executionOptions.signal;
          onActivity?.({ callId, name: tool.name, status: 'running', params });

          try {
            if (tool.name === 'save_care_plan' && params?.confirmed !== true) {
              const result = {
                success: false,
                requiresConfirmation: true,
                error: 'Human confirmation is required before saving a care plan.',
              };
              onActivity?.({ callId, name: tool.name, status: 'failed', error: result.error });
              return toToolResult(result);
            }

            const executeResponse = await fetch('/api/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tool: tool.name, params }),
              signal,
            });
            const result = await executeResponse.json();
            if (!executeResponse.ok || !result.success) throw new Error(result.error || `Tool ${tool.name} failed`);

            onActivity?.({ callId, name: tool.name, status: 'completed', result: result.data });
            return toToolResult(result);
          } catch (error) {
            const message = error?.name === 'AbortError' ? 'Tool execution was cancelled.' : error.message;
            onActivity?.({ callId, name: tool.name, status: 'failed', error: message });
            throw error;
          }
        },
      }, { signal: controller.signal });
      registered.push(tool.name);
    }
  } catch (error) {
    for (const name of registered.reverse()) {
      await unregister(name);
    }
    throw error;
  }

  return {
    status: registered.length ? 'connected' : 'unavailable',
    registered,
    cleanup: async () => {
      for (const name of registered) {
        await unregister(name);
      }
    },
  };
}
