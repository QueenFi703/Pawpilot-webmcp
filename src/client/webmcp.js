const toToolResult = (data) => ({
  content: [
    {
      type: 'text',
      text: JSON.stringify(data)
    }
  ],
  structuredContent: data
});

const getModelContext = () => {
  if (typeof document === 'undefined') return null;
  return document.modelContext || navigator.modelContext || null;
};

export async function registerPawpilotTools(onActivity) {
  const modelContext = getModelContext();

  if (!modelContext?.registerTool) {
    return { status: 'unavailable', registered: [], cleanup: () => {} };
  }

  const response = await fetch('/api/tools');
  if (!response.ok) throw new Error('Could not load PawPilot tools');

  const { tools } = await response.json();
  const registered = [];

  for (const tool of tools) {
    await modelContext.registerTool({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations,
      execute: async (params) => {
        const callId = `${tool.name}-${Date.now()}`;
        onActivity?.({ callId, name: tool.name, status: 'running', params });

        try {
          const executeResponse = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: tool.name, params })
          });
          const result = await executeResponse.json();

          if (!executeResponse.ok || !result.success) {
            throw new Error(result.error || `Tool ${tool.name} failed`);
          }

          onActivity?.({
            callId,
            name: tool.name,
            status: 'completed',
            result: result.data
          });
          return toToolResult(result.data);
        } catch (error) {
          onActivity?.({ callId, name: tool.name, status: 'failed', error: error.message });
          throw error;
        }
      }
    });
    registered.push(tool.name);
  }

  return {
    status: 'connected',
    registered,
    cleanup: () => {
      if (!modelContext.unregisterTool) return;
      registered.forEach((name) => modelContext.unregisterTool(name));
    }
  };
}
