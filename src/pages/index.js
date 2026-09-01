import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../styles/Home.module.css';

const PET_ID = 'milo-001';

const WEBMCP_TOOLS = [
  {
    name: 'get_pet_profile',
    title: 'Get pet profile',
    description: 'Retrieve the current pet profile with basic info, medical history, and preferences.',
    inputSchema: {
      type: 'object',
      properties: { petId: { type: 'string', description: 'The pet ID to retrieve.' } },
      required: ['petId']
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'get_daily_needs',
    title: 'Get daily needs',
    description: "Get today's care checklist derived from the pet's profile.",
    inputSchema: {
      type: 'object',
      properties: {
        petId: { type: 'string', description: 'The pet ID.' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format. Defaults to today.' }
      },
      required: ['petId']
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'find_pet_services',
    title: 'Find pet services',
    description: 'Find available veterinary, grooming, training, or boarding services.',
    inputSchema: {
      type: 'object',
      properties: {
        serviceType: { type: 'string', enum: ['veterinary', 'grooming', 'training', 'boarding'] }
      },
      required: ['serviceType']
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'find_pet_products',
    title: 'Find pet products',
    description: 'Find pet products by category: food, treats, toys, or bedding.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['food', 'treats', 'toys', 'bedding'] }
      },
      required: ['category']
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'save_care_plan',
    title: 'Save care plan',
    description: 'Save a generated care plan only after the human explicitly confirms the proposed plan.',
    inputSchema: {
      type: 'object',
      properties: {
        petId: { type: 'string' },
        plan: { type: 'object' },
        confirmed: { type: 'boolean', description: 'Must be true only after explicit human confirmation.' }
      },
      required: ['petId', 'plan', 'confirmed']
    },
    annotations: { readOnlyHint: false },
  },
];

const SERVICE_TYPES = ['veterinary', 'grooming', 'training', 'boarding'];
const PRODUCT_CATEGORIES = ['food', 'treats', 'toys', 'bedding'];

function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

function chooseIntent(message) {
  const text = normalizeText(message);

  if (/\b(save|store|keep)\b.*\b(plan|care)\b|\b(save|store)\b.*\bthis\b/.test(text)) {
    return { type: 'save_care_plan' };
  }

  const serviceType = SERVICE_TYPES.find((type) => text.includes(type));
  if (serviceType && /\b(find|book|need|where|show|service|services)\b/.test(text)) {
    return { type: 'find_pet_services', params: { serviceType } };
  }

  const category = PRODUCT_CATEGORIES.find((item) => text.includes(item));
  if (category && /\b(find|need|recommend|show|buy|product|products)\b/.test(text)) {
    return { type: 'find_pet_products', params: { category } };
  }

  if (/\b(profile|breed|weight|age|allerg|medical|history|about)\b/.test(text)) {
    return { type: 'get_pet_profile', params: { petId: PET_ID } };
  }

  return { type: 'get_daily_needs', params: { petId: PET_ID } };
}

function formatResult(toolName, result, petName) {
  if (!result) return 'The tool completed without returning data.';
  if (typeof result === 'string') return result;
  if (result.success === false) return result.error || 'The tool could not complete the request.';

  const data = result.data ?? result;

  if (toolName === 'get_daily_needs') {
    if (Array.isArray(data)) {
      return `${petName} has ${data.length} care item${data.length === 1 ? '' : 's'} for today.`;
    }
    return `I retrieved ${petName}'s daily care checklist.`;
  }

  if (toolName === 'get_pet_profile') {
    return `${data.name || petName} is a ${data.age || '—'}-year-old ${data.breed || 'pet'} weighing ${data.weight || '—'} lbs.`;
  }

  if (toolName === 'find_pet_services' || toolName === 'find_pet_products') {
    const count = Array.isArray(data) ? data.length : 0;
    return `I found ${count} matching ${toolName === 'find_pet_services' ? 'service' : 'product'}${count === 1 ? '' : 's'}.`;
  }

  return 'The request completed successfully.';
}

export default function Home() {
  const [petProfile, setPetProfile] = useState(null);
  const [dailyNeeds, setDailyNeeds] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'I’m PawPilot. Ask me about your pet’s profile, today’s needs, services, or products. I’ll use WebMCP when this browser supports it.'
    }
  ]);
  const [toolCalls, setToolCalls] = useState([]);
  const [userGoal, setUserGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [webmcpStatus, setWebmcpStatus] = useState('checking');
  const [availableTools, setAvailableTools] = useState([]);
  const [pendingPlan, setPendingPlan] = useState(null);
  const abortRef = useRef(null);

  const petName = petProfile?.name || 'your pet';

  const toolNames = useMemo(() => availableTools.map((tool) => tool.name), [availableTools]);

  useEffect(() => {
    loadPetProfile();
    registerWebMCPTools();

    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function registerWebMCPTools() {
    if (!document.modelContext?.registerTool) {
      setWebmcpStatus('unavailable');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await Promise.all(
        WEBMCP_TOOLS.map((tool) =>
          document.modelContext.registerTool(
            {
              ...tool,
              execute: async (input) => executeToolFromWebMCP(tool.name, input),
            },
            { signal: controller.signal }
          )
        )
      );
      const tools = await document.modelContext.getTools();
      setAvailableTools(tools.filter((tool) => WEBMCP_TOOLS.some((item) => item.name === tool.name)));
      setWebmcpStatus('available');
    } catch (error) {
      console.warn('WebMCP registration failed:', error);
      setWebmcpStatus('error');
    }
  }

  async function executeToolFromWebMCP(toolName, params) {
    if (toolName === 'save_care_plan' && !params?.confirmed) {
      setPendingPlan({ petId: params.petId, plan: params.plan });
      return 'Human confirmation is required before this care plan can be saved.';
    }

    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, params })
    });
    const result = await response.json();
    recordToolCall(toolName, result, 'WebMCP');
    updateLocalState(toolName, result);
    return result;
  }

  async function executeNamedTool(toolName, params) {
    const webTool = availableTools.find((tool) => tool.name === toolName);

    if (webTool && document.modelContext?.executeTool) {
      try {
        const result = await document.modelContext.executeTool(webTool, JSON.stringify(params || {}));
        recordToolCall(toolName, result, 'WebMCP');
        updateLocalState(toolName, result);
        return result;
      } catch (error) {
        console.warn(`WebMCP execution failed for ${toolName}; using HTTP fallback.`, error);
      }
    }

    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, params })
    });
    const result = await response.json();
    recordToolCall(toolName, result, 'HTTP fallback');
    updateLocalState(toolName, result);
    return result;
  }

  function updateLocalState(toolName, result) {
    if (!result?.success) return;
    if (toolName === 'get_pet_profile') setPetProfile(result.data);
    if (toolName === 'get_daily_needs') setDailyNeeds(result.data);
  }

  function recordToolCall(name, result, transport) {
    setToolCalls((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        name,
        transport,
        status: result?.success === false ? 'error' : 'success',
        result,
      },
    ]);
  }

  async function loadPetProfile() {
    try {
      await executeNamedTool('get_pet_profile', { petId: PET_ID });
    } catch (error) {
      console.error('Error loading pet profile:', error);
    }
  }

  async function handleGoalSubmit(event) {
    event.preventDefault();
    const goal = userGoal.trim();
    if (!goal || loading) return;

    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: goal }]);
    setUserGoal('');
    setLoading(true);

    try {
      const intent = chooseIntent(goal);

      if (intent.type === 'save_care_plan') {
        if (!dailyNeeds) {
          await executeNamedTool('get_daily_needs', { petId: PET_ID });
        }
        const plan = {
          title: `${petName} daily care plan`,
          tasks: dailyNeeds || [],
          services: [],
          products: []
        };
        setPendingPlan({ petId: PET_ID, plan });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'assistant',
            text: 'I prepared the care plan. Review it below, then confirm if you want PawPilot to save it.'
          }
        ]);
        return;
      }

      const result = await executeNamedTool(intent.type, intent.params);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: formatResult(intent.type, result, petName),
          tool: intent.type,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', text: 'I could not complete that request. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmSavePlan() {
    if (!pendingPlan) return;
    setLoading(true);
    try {
      const result = await executeNamedTool('save_care_plan', {
        petId: pendingPlan.petId,
        plan: pendingPlan.plan,
        confirmed: true,
      });
      setPendingPlan(null);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          text: result?.success ? 'Saved ✓ Your care plan is now recorded.' : 'I could not save the care plan.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🐾 PawPilot</h1>
        <p>Natural-language pet care with browser-native WebMCP tools</p>
        <div className={styles.webmcpBadge} data-status={webmcpStatus}>
          <span className={styles.statusDot} />
          WebMCP: {webmcpStatus === 'available' ? 'connected' : webmcpStatus}
        </div>
      </header>

      {petProfile && (
        <section className={styles.petProfile}>
          <div className={styles.sectionEyebrow}>CURRENT COMPANION</div>
          <h2>{petProfile.name}</h2>
          <div className={styles.profileGrid}>
            <div><strong>Breed</strong>{petProfile.breed}</div>
            <div><strong>Age</strong>{petProfile.age} years</div>
            <div><strong>Weight</strong>{petProfile.weight} lbs</div>
            <div><strong>Last Vet Visit</strong>{petProfile.lastVetVisit}</div>
          </div>
          <p className={styles.notes}>{petProfile.notes}</p>
        </section>
      )}

      <section className={styles.agentPanel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.sectionEyebrow}>ASK PAWPILOT</div>
            <h2>Talk naturally about your pet</h2>
          </div>
          <span className={styles.toolCount}>{toolNames.length} callable tools</span>
        </div>

        <div className={styles.chatWindow} aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className={`${styles.message} ${styles[message.role]}`}>
              <span className={styles.messageLabel}>{message.role === 'user' ? 'You' : 'PawPilot'}</span>
              <p>{message.text}</p>
              {message.tool && <small>Tool: {message.tool}</small>}
            </div>
          ))}
          {loading && <div className={`${styles.message} ${styles.assistant}`}><span className={styles.messageLabel}>PawPilot</span><p>Working with the available tools…</p></div>}
        </div>

        <form className={styles.chatForm} onSubmit={handleGoalSubmit}>
          <input
            type="text"
            value={userGoal}
            onChange={(event) => setUserGoal(event.target.value)}
            placeholder={`Ask about ${petName}'s needs, profile, grooming, food…`}
            disabled={loading}
            aria-label="Ask PawPilot"
          />
          <button type="submit" disabled={loading || !userGoal.trim()}>{loading ? 'Working…' : 'Ask'}</button>
        </form>

        <div className={styles.promptChips}>
          {[
            `What does ${petName} need today?`,
            `Show me ${petName}'s profile`,
            'Find grooming services',
            'Find food products',
            'Save today’s care plan'
          ].map((prompt) => (
            <button key={prompt} type="button" onClick={() => setUserGoal(prompt)} disabled={loading}>{prompt}</button>
          ))}
        </div>
      </section>

      {pendingPlan && (
        <section className={styles.confirmPanel}>
          <div>
            <div className={styles.sectionEyebrow}>HUMAN CONFIRMATION</div>
            <h2>Save this care plan?</h2>
            <p>PawPilot will not write the plan until you explicitly confirm.</p>
          </div>
          <div className={styles.confirmActions}>
            <button type="button" onClick={() => setPendingPlan(null)} className={styles.secondaryButton}>Cancel</button>
            <button type="button" onClick={confirmSavePlan} disabled={loading} className={styles.confirmButton}>Confirm & Save</button>
          </div>
        </section>
      )}

      {dailyNeeds && (
        <section className={styles.needsPanel}>
          <div className={styles.sectionEyebrow}>TODAY</div>
          <h2>Daily care</h2>
          <pre>{JSON.stringify(dailyNeeds, null, 2)}</pre>
        </section>
      )}

      {toolCalls.length > 0 && (
        <section className={styles.toolCalls}>
          <div className={styles.panelHeader}>
            <div><div className={styles.sectionEyebrow}>TRANSPARENT ACTIVITY</div><h2>Tool activity</h2></div>
          </div>
          {toolCalls.slice().reverse().map((call) => (
            <div key={call.id} className={styles.toolCall}>
              <div className={styles.callHeader}>
                <span className={styles.toolName}>{call.name}</span>
                <span className={`${styles.toolStatus} ${styles[call.status]}`}>{call.status}</span>
              </div>
              <small>{call.transport}</small>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
