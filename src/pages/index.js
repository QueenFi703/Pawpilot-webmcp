import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../styles/Home.module.css';
import { registerPawpilotTools } from '../client/webmcp';

const PET_ID = 'dojo-001';

const quickPrompts = [
  'What does Dojo need today?',
  "Show me Dojo's profile",
  'Find grooming services',
  'Find food products',
  "Build today's care plan",
];

export default function Home() {
  const [petProfile, setPetProfile] = useState(null);
  const [dailyNeeds, setDailyNeeds] = useState(null);
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', text: "Hi — I'm PawPilot. Ask me anything about Dojo, or use one of the quick actions below." },
  ]);
  const [toolCalls, setToolCalls] = useState([]);
  const [userGoal, setUserGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [webmcpStatus, setWebmcpStatus] = useState('checking');
  const [availableTools, setAvailableTools] = useState([]);
  const [pendingPlan, setPendingPlan] = useState(null);
  const abortRef = useRef(null);
  const petName = petProfile?.name || 'Dojo';
  const toolNames = useMemo(() => availableTools.map((tool) => tool.name), [availableTools]);

  useEffect(() => {
    loadPetProfile();
    let active = true;
    let attempts = 0;
    const connect = async () => {
      try {
        const registration = await registerPawpilotTools((activity) => {
          if (!active) return;
          setToolCalls((prev) => {
            const existing = prev.findIndex((call) => call.id === activity.callId);
            const next = {
              id: activity.callId,
              name: activity.name,
              transport: 'WebMCP',
              status: activity.status === 'completed' ? 'success' : activity.status === 'failed' ? 'error' : 'running',
              result: activity.result,
              error: activity.error,
            };
            if (existing >= 0) return prev.map((call, index) => (index === existing ? next : call));
            return [...prev, next];
          });
        });
        if (!active) return;
        if (registration.status === 'connected') {
          setWebmcpStatus('available');
          setAvailableTools(registration.registered.map((name) => ({ name })));
          return;
        }
        attempts += 1;
        if (attempts < 12) {
          setTimeout(connect, 500);
        } else {
          setWebmcpStatus('unavailable');
        }
      } catch (error) {
        console.warn('WebMCP registration failed:', error);
        attempts += 1;
        if (active && attempts < 12) setTimeout(connect, 500);
        else if (active) setWebmcpStatus('error');
      }
    };
    connect();
    return () => {
      active = false;
      abortRef.current?.abort();
    };
  }, []);

  async function executeNamedTool(toolName, params) {
    if (toolName === 'save_care_plan' && !params?.confirmed) {
      setPendingPlan({ petId: params.petId || PET_ID, plan: params.plan });
      return { success: false, requiresConfirmation: true, error: 'Human confirmation is required before saving.' };
    }
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, params }),
    });
    const result = await response.json();
    recordToolCall(toolName, result, 'PawPilot');
    updateLocalState(toolName, result);
    if (!response.ok) throw new Error(result.error || 'Tool request failed.');
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
      { id: `${Date.now()}-${Math.random()}`, name, transport, status: result?.success === false ? 'error' : 'success', result },
    ].slice(-12));
  }

  async function loadPetProfile() {
    try {
      await executeNamedTool('get_pet_profile', { petId: PET_ID });
    } catch (error) {
      console.error(error);
    }
  }

  async function handleGoalSubmit(event) {
    event.preventDefault();
    const goal = userGoal.trim();
    if (!goal || loading) return;
    const history = messages.filter((message) => message.id !== 'welcome').slice(-10).map(({ role, text }) => ({ role, text }));
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: goal }]);
    setUserGoal('');
    setLoading(true);
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: goal, history }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Agent request failed.');
      (result.toolCalls || []).forEach((call) => {
        recordToolCall(call.name, call.result, 'OpenAI → PawPilot');
        updateLocalState(call.name, call.result);
        if (call.name === 'save_care_plan' && call.result?.requiresConfirmation) {
          setPendingPlan({ petId: call.arguments.petId, plan: call.arguments.plan });
        }
      });
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: result.text || 'The request completed.', model: result.model }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: error.message || 'I could not complete that request.' }]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmSavePlan() {
    if (!pendingPlan) return;
    setLoading(true);
    try {
      const result = await executeNamedTool('save_care_plan', { petId: pendingPlan.petId, plan: pendingPlan.plan, confirmed: true });
      setPendingPlan(null);
      setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', text: result?.success ? 'Saved ✓ Your care plan is now recorded.' : 'I could not save the care plan.' }]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', text: error.message }]);
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = webmcpStatus === 'available' ? 'WebMCP connected' : webmcpStatus === 'checking' ? 'Checking WebMCP…' : 'WebMCP not detected';

  return (
    <main className={styles.container}>
      <div className={styles.backgroundGlow} />
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brandRow}>
            <div className={styles.logoMark}>🐾</div>
            <div><div className={styles.brand}>PawPilot</div><div className={styles.brandSub}>Your pet-care copilot</div></div>
          </div>
          <div className={styles.webmcpBadge} data-status={webmcpStatus}><span className={styles.statusDot} />{statusLabel}</div>
        </header>

        <section className={styles.hero}>
          <div>
            <div className={styles.sectionEyebrow}>SMART PET CARE</div>
            <h1>Everything Dojo needs.<br /><span>Right when you need it.</span></h1>
            <p>Ask naturally. PawPilot coordinates pet data, care tasks, services, and products through OpenAI and browser-native WebMCP.</p>
          </div>
          <div className={styles.heroPaw}>🐕</div>
        </section>

        {petProfile && <section className={styles.petCard}>
          <div className={styles.petAvatar}>🐶</div>
          <div className={styles.petIdentity}><div className={styles.sectionEyebrow}>CURRENT COMPANION</div><h2>{petProfile.name}</h2><p>{petProfile.breed}</p></div>
          <div className={styles.profileStats}>
            <div><strong>{petProfile.age}</strong><span>months</span></div>
            <div><strong>{petProfile.weight}</strong><span>lbs</span></div>
            <div><strong>{petProfile.allergies?.length || 0}</strong><span>allergies</span></div>
          </div>
          <div className={styles.petNote}>{petProfile.notes}</div>
        </section>}

        <section className={styles.agentPanel}>
          <div className={styles.panelHeader}>
            <div><div className={styles.sectionEyebrow}>ASK PAWPILOT</div><h2>What can I help with?</h2></div>
            <span className={styles.toolCount}>{toolNames.length || 6} tools ready</span>
          </div>
          <div className={styles.chatWindow} aria-live="polite">
            {messages.map((message) => <div key={message.id} className={`${styles.message} ${styles[message.role]}`}><span className={styles.messageLabel}>{message.role === 'user' ? 'You' : 'PawPilot'}</span><p>{message.text}</p>{message.model && <small>{message.model}</small>}</div>)}
            {loading && <div className={`${styles.message} ${styles.assistant}`}><span className={styles.messageLabel}>PawPilot</span><p className={styles.thinking}><span /> <span /> <span /> Thinking…</p></div>}
          </div>
          <form className={styles.chatForm} onSubmit={handleGoalSubmit}>
            <input type="text" value={userGoal} onChange={(event) => setUserGoal(event.target.value)} placeholder={`Ask about ${petName}'s care…`} disabled={loading} aria-label="Ask PawPilot" />
            <button type="submit" disabled={loading || !userGoal.trim()}>{loading ? 'Working…' : 'Ask PawPilot →'}</button>
          </form>
          <div className={styles.promptChips}>{quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => setUserGoal(prompt)} disabled={loading}>{prompt}</button>)}</div>
        </section>

        {dailyNeeds && <section className={styles.needsPanel}>
          <div className={styles.panelHeader}><div><div className={styles.sectionEyebrow}>TODAY</div><h2>Dojo's care checklist</h2></div><span className={styles.datePill}>{dailyNeeds.date}</span></div>
          <div className={styles.taskGrid}>{(dailyNeeds.tasks || []).map((task) => <div key={task.id} className={styles.taskCard}><span className={styles.taskDot} /><div><strong>{task.name}</strong><small>{task.time}</small></div></div>)}</div>
        </section>}

        {pendingPlan && <section className={styles.confirmPanel}><div><div className={styles.sectionEyebrow}>ONE LAST STEP</div><h2>Save this care plan?</h2><p>PawPilot will not write anything until you explicitly confirm.</p></div><div className={styles.confirmActions}><button type="button" onClick={() => setPendingPlan(null)} className={styles.secondaryButton}>Not yet</button><button type="button" onClick={confirmSavePlan} disabled={loading} className={styles.confirmButton}>Confirm & Save</button></div></section>}

        {toolCalls.length > 0 && <section className={styles.toolCalls}><div className={styles.panelHeader}><div><div className={styles.sectionEyebrow}>TRANSPARENT ACTIVITY</div><h2>What PawPilot is doing</h2></div></div>{toolCalls.slice().reverse().map((call) => <div key={call.id} className={styles.toolCall}><div className={styles.callIcon}>⚡</div><div className={styles.callBody}><strong>{call.name}</strong><small>{call.transport}</small></div><span className={`${styles.toolStatus} ${styles[call.status]}`}>{call.status}</span></div>)}</section>}

        <footer className={styles.footer}>PawPilot · OpenAI + WebMCP · Human-controlled care planning</footer>
      </div>
    </main>
  );
}
