import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../styles/Home.module.css';

const PET_ID = 'milo-001';
const WEBMCP_TOOLS = [
  { name: 'get_pet_profile', title: 'Get pet profile', description: 'Retrieve the current pet profile.', inputSchema: { type: 'object', properties: { petId: { type: 'string' } }, required: ['petId'] }, annotations: { readOnlyHint: true } },
  { name: 'get_daily_needs', title: 'Get daily needs', description: "Get today's care checklist.", inputSchema: { type: 'object', properties: { petId: { type: 'string' }, date: { type: 'string' } }, required: ['petId'] }, annotations: { readOnlyHint: true } },
  { name: 'find_pet_services', title: 'Find pet services', description: 'Find veterinary, grooming, training, or boarding services.', inputSchema: { type: 'object', properties: { serviceType: { type: 'string', enum: ['veterinary', 'grooming', 'training', 'boarding'] } }, required: ['serviceType'] }, annotations: { readOnlyHint: true } },
  { name: 'find_pet_products', title: 'Find pet products', description: 'Find food, treats, toys, or bedding.', inputSchema: { type: 'object', properties: { category: { type: 'string', enum: ['food', 'treats', 'toys', 'bedding'] } }, required: ['category'] }, annotations: { readOnlyHint: true } },
  { name: 'save_care_plan', title: 'Save care plan', description: 'Save a care plan only after explicit human confirmation.', inputSchema: { type: 'object', properties: { petId: { type: 'string' }, plan: { type: 'object' }, confirmed: { type: 'boolean' } }, required: ['petId', 'plan', 'confirmed'] }, annotations: { readOnlyHint: false } },
];

export default function Home() {
  const [petProfile, setPetProfile] = useState(null);
  const [dailyNeeds, setDailyNeeds] = useState(null);
  const [messages, setMessages] = useState([{ id: 'welcome', role: 'assistant', text: 'I’m PawPilot. Ask me naturally about your pet. I’ll use OpenAI to understand your request and PawPilot tools to get the answer.' }]);
  const [toolCalls, setToolCalls] = useState([]);
  const [userGoal, setUserGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [webmcpStatus, setWebmcpStatus] = useState('checking');
  const [availableTools, setAvailableTools] = useState([]);
  const [pendingPlan, setPendingPlan] = useState(null);
  const abortRef = useRef(null);
  const petName = petProfile?.name || 'your pet';
  const toolNames = useMemo(() => availableTools.map((tool) => tool.name), [availableTools]);

  useEffect(() => { loadPetProfile(); registerWebMCPTools(); return () => abortRef.current?.abort(); }, []);

  async function registerWebMCPTools() {
    if (!document.modelContext?.registerTool) { setWebmcpStatus('unavailable'); return; }
    const controller = new AbortController(); abortRef.current = controller;
    try {
      await Promise.all(WEBMCP_TOOLS.map((tool) => document.modelContext.registerTool({ ...tool, execute: (input) => executeToolFromWebMCP(tool.name, input) }, { signal: controller.signal })));
      const tools = await document.modelContext.getTools();
      setAvailableTools(tools.filter((tool) => WEBMCP_TOOLS.some((item) => item.name === tool.name)));
      setWebmcpStatus('available');
    } catch (error) { console.warn('WebMCP registration failed:', error); setWebmcpStatus('error'); }
  }

  async function executeToolFromWebMCP(toolName, params) {
    if (toolName === 'save_care_plan' && !params?.confirmed) {
      setPendingPlan({ petId: params.petId, plan: params.plan });
      return { success: false, requiresConfirmation: true, error: 'Human confirmation is required before saving.' };
    }
    const response = await fetch('/api/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool: toolName, params }) });
    const result = await response.json(); recordToolCall(toolName, result, 'WebMCP'); updateLocalState(toolName, result); return result;
  }

  async function executeNamedTool(toolName, params) {
    const webTool = availableTools.find((tool) => tool.name === toolName);
    if (webTool && document.modelContext?.executeTool) {
      try {
        const result = await document.modelContext.executeTool(webTool, JSON.stringify(params || {})); recordToolCall(toolName, result, 'WebMCP'); updateLocalState(toolName, result); return result;
      } catch (error) { console.warn('WebMCP execution failed; using HTTP fallback.', error); }
    }
    const response = await fetch('/api/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool: toolName, params }) });
    const result = await response.json(); recordToolCall(toolName, result, 'HTTP fallback'); updateLocalState(toolName, result); return result;
  }

  function updateLocalState(toolName, result) { if (!result?.success) return; if (toolName === 'get_pet_profile') setPetProfile(result.data); if (toolName === 'get_daily_needs') setDailyNeeds(result.data); }
  function recordToolCall(name, result, transport) { setToolCalls((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, name, transport, status: result?.success === false ? 'error' : 'success', result }]); }
  async function loadPetProfile() { try { await executeNamedTool('get_pet_profile', { petId: PET_ID }); } catch (error) { console.error(error); } }

  async function handleGoalSubmit(event) {
    event.preventDefault(); const goal = userGoal.trim(); if (!goal || loading) return;
    const history = messages.filter((message) => message.id !== 'welcome').slice(-10).map(({ role, text }) => ({ role, text }));
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: goal }]); setUserGoal(''); setLoading(true);
    try {
      const response = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: goal, history }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Agent request failed.');
      (result.toolCalls || []).forEach((call) => { recordToolCall(call.name, call.result, 'OpenAI → PawPilot'); updateLocalState(call.name, call.result); if (call.name === 'save_care_plan' && call.result?.requiresConfirmation) setPendingPlan({ petId: call.arguments.petId, plan: call.arguments.plan }); });
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: result.text || 'The request completed.', model: result.model }]);
    } catch (error) { console.error(error); setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: error.message || 'I could not complete that request.' }]); }
    finally { setLoading(false); }
  }

  async function confirmSavePlan() {
    if (!pendingPlan) return; setLoading(true);
    try { const result = await executeNamedTool('save_care_plan', { petId: pendingPlan.petId, plan: pendingPlan.plan, confirmed: true }); setPendingPlan(null); setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', text: result?.success ? 'Saved ✓ Your care plan is now recorded.' : 'I could not save the care plan.' }]); }
    finally { setLoading(false); }
  }

  return <div className={styles.container}>
    <header className={styles.header}><h1>🐾 PawPilot</h1><p>Natural-language pet care with OpenAI + browser-native WebMCP</p><div className={styles.webmcpBadge} data-status={webmcpStatus}><span className={styles.statusDot} />WebMCP: {webmcpStatus === 'available' ? 'connected' : webmcpStatus}</div></header>
    {petProfile && <section className={styles.petProfile}><div className={styles.sectionEyebrow}>CURRENT COMPANION</div><h2>{petProfile.name}</h2><div className={styles.profileGrid}><div><strong>Breed</strong>{petProfile.breed}</div><div><strong>Age</strong>{petProfile.age} years</div><div><strong>Weight</strong>{petProfile.weight} lbs</div><div><strong>Last Vet Visit</strong>{petProfile.lastVetVisit}</div></div><p className={styles.notes}>{petProfile.notes}</p></section>}
    <section className={styles.agentPanel}><div className={styles.panelHeader}><div><div className={styles.sectionEyebrow}>ASK PAWPILOT</div><h2>Talk naturally about your pet</h2></div><span className={styles.toolCount}>{toolNames.length} callable tools</span></div>
      <div className={styles.chatWindow} aria-live="polite">{messages.map((message) => <div key={message.id} className={`${styles.message} ${styles[message.role]}`}><span className={styles.messageLabel}>{message.role === 'user' ? 'You' : 'PawPilot'}</span><p>{message.text}</p>{message.model && <small>Model: {message.model}</small>}</div>)}{loading && <div className={`${styles.message} ${styles.assistant}`}><span className={styles.messageLabel}>PawPilot</span><p>Thinking and using the available tools…</p></div>}</div>
      <form className={styles.chatForm} onSubmit={handleGoalSubmit}><input type="text" value={userGoal} onChange={(event) => setUserGoal(event.target.value)} placeholder={`Ask about ${petName}'s needs, profile, grooming, food…`} disabled={loading} aria-label="Ask PawPilot" /><button type="submit" disabled={loading || !userGoal.trim()}>{loading ? 'Working…' : 'Ask'}</button></form>
      <div className={styles.promptChips}>{[`What does ${petName} need today?`, `Show me ${petName}'s profile`, 'Find grooming services', 'Find food products', 'Save today’s care plan'].map((prompt) => <button key={prompt} type="button" onClick={() => setUserGoal(prompt)} disabled={loading}>{prompt}</button>)}</div>
    </section>
    {pendingPlan && <section className={styles.confirmPanel}><div><div className={styles.sectionEyebrow}>HUMAN CONFIRMATION</div><h2>Save this care plan?</h2><p>PawPilot will not write the plan until you explicitly confirm.</p></div><div className={styles.confirmActions}><button type="button" onClick={() => setPendingPlan(null)} className={styles.secondaryButton}>Cancel</button><button type="button" onClick={confirmSavePlan} disabled={loading} className={styles.confirmButton}>Confirm & Save</button></div></section>}
    {dailyNeeds && <section className={styles.needsPanel}><div className={styles.sectionEyebrow}>TODAY</div><h2>Daily care</h2><pre>{JSON.stringify(dailyNeeds, null, 2)}</pre></section>}
    {toolCalls.length > 0 && <section className={styles.toolCalls}><div className={styles.panelHeader}><div><div className={styles.sectionEyebrow}>TRANSPARENT ACTIVITY</div><h2>Tool activity</h2></div></div>{toolCalls.slice().reverse().map((call) => <div key={call.id} className={styles.toolCall}><div className={styles.callHeader}><span className={styles.toolName}>{call.name}</span><span className={`${styles.toolStatus} ${styles[call.status]}`}>{call.status}</span></div><small>{call.transport}</small></div>)}</section>}
  </div>;
}
