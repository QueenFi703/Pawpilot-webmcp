import { useEffect, useMemo, useState } from 'react';
import { registerPawpilotTools } from '../client/webmcp.js';
import { DEFAULT_PET_ID, normalizeToolParams } from '../shared/tool-input.js';
import styles from '../styles/Home.module.css';

const PET_ID = DEFAULT_PET_ID;

const Icon = ({ name, size = 20 }) => {
  const paths = {
    home: '<path d="M3 10.8 10 4l7 6.8v6.7a1.5 1.5 0 0 1-1.5 1.5h-3v-5h-5v5h-3A1.5 1.5 0 0 1 3 17.5Z"/>',
    user: '<circle cx="10" cy="6.5" r="3.2"/><path d="M4 19v-2.2a6 6 0 0 1 12 0V19Z"/>',
    bag: '<path d="M5 7h10l1 12H4L5 7Z"/><path d="M7 8V6a3 3 0 0 1 6 0v2"/>',
    services: '<path d="m4 16 5-5m2-2 5-5M6 4l3 3-2 2-3-3Zm8 8 3 3-2 2-3-3Z"/><circle cx="14.5" cy="5.5" r="2.5"/><circle cx="5.5" cy="14.5" r="2.5"/>',
    cart: '<path d="M3 4h2l1.5 9h8.8l1.7-6H6"/><circle cx="8" cy="17" r="1.4"/><circle cx="14.5" cy="17" r="1.4"/>',
    calendar: '<rect x="3" y="5" width="14" height="13" rx="2"/><path d="M6 2v5m8-5v5M3 9h14m-10 3h2m2 0h2m-6 3h2"/>',
    activity: '<rect x="4" y="3" width="12" height="16" rx="2"/><path d="M7 3.5h6V6H7Zm1 7h4m-4 3h4"/>',
    send: '<path d="m3 4 15 6-15 6 3-6-3-6Zm3 6h12"/>',
    pin: '<path d="M10 19s6-5.6 6-11A6 6 0 0 0 4 8c0 5.4 6 11 6 11Z"/><circle cx="10" cy="8" r="2"/>',
    save: '<path d="M4 3h10l2 2v14H4Z"/><path d="M7 3v5h6V3m-6 12h6"/>',
    arrow: '<path d="M3 10h14m-5-5 5 5-5 5"/>',
    check: '<path d="m4 10 4 4 8-9"/>',
    globe: '<circle cx="10" cy="10" r="8"/><path d="M2 10h16M10 2c2 2.2 3 4.8 3 8s-1 5.8-3 8c-2-2.2-3-4.8-3-8s1-5.8 3-8Z"/>',
    shield: '<path d="M10 2 17 5v5c0 4.5-3 7-7 9-4-2-7-4.5-7-9V5Z"/><path d="m7 10 2 2 4-5"/>',
    sparkle: '<path d="M10 2c.5 4.5 3 7 7 8-4 .8-6.5 3.5-7 8-.5-4.5-3-7.2-7-8 4-.8 6.5-3.5 7-8Z"/>',
    chat: '<path d="M3 4h14v10H8l-4 3v-3H3Z"/><path d="M7 9h.1m3-.1h.1m3-.1h.1"/>',
    tools: '<path d="m4 16 8-8m0 0 2-5 3 3-5 2ZM3 17l3-3 3 3-3 3Z"/>',
    heart: '<path d="M10 18S3 14 3 8a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6-7 10-7 10Z"/>',
    run: '<circle cx="12" cy="3.5" r="2"/><path d="m9 7 3 2 3-1m-3 1-2 4-4 1m4-1 3 5m-6-7-3 3"/>',
    bowl: '<path d="M3 9h14c0 5-2 8-7 8s-7-3-7-8Z"/><path d="M6 6c2-2 6-2 8 0"/>',
    drop: '<path d="M10 2s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10Z"/>'
  };
  return <svg className={styles.icon} width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths[name] || paths.sparkle }} />;
};

const Paw = ({ compact = false }) => (
  <span className={`${styles.pawMark} ${compact ? styles.pawMarkCompact : ''}`} aria-hidden="true">
    <svg viewBox="0 0 64 64"><path d="M22 28c6-7 14-7 20 0 4 5 9 9 8 16-1 8-9 11-18 8-9 3-17 0-18-8-1-7 4-11 8-16Z"/><circle cx="15" cy="25" r="7"/><circle cx="27" cy="15" r="7"/><circle cx="41" cy="15" r="7"/><circle cx="52" cy="25" r="7"/></svg>
  </span>
);

async function callTool(tool, params) {
  const normalizedParams = normalizeToolParams(tool, params);
  const response = await fetch('/api/execute', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, params: normalizedParams })
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || `${tool} failed`);
  return result.data;
}

export default function Home() {
  const [petProfile, setPetProfile] = useState(null);
  const [dailyNeeds, setDailyNeeds] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [tools, setTools] = useState([]);
  const [activity, setActivity] = useState([]);
  const [webMcp, setWebMcp] = useState({ status: 'checking', registered: [] });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [lastQuestion, setLastQuestion] = useState('What does Milo need today?');

  const addActivity = (name, status = 'completed') => {
    const callId = `${name}-${Date.now()}`;
    setActivity((current) => [{ callId, name, status, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }, ...current].slice(0, 7));
  };

  useEffect(() => {
    let active = true;
    let cleanup = () => {};
    const recordActivity = (event) => {
      if (!active) return;
      setActivity((current) => {
        const existing = current.findIndex((item) => item.callId === event.callId);
        const next = { ...event, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };
        if (existing === -1) return [next, ...current].slice(0, 7);
        return current.map((item, index) => (index === existing ? { ...item, ...next } : item));
      });
    };

    Promise.all([
      fetch('/api/tools').then((response) => response.json()),
      callTool('get_pet_profile', { petId: PET_ID }),
      callTool('get_daily_needs', { petId: PET_ID })
    ]).then(([catalog, profile, needs]) => {
      if (!active) return;
      setTools(catalog.tools || []);
      setPetProfile(profile);
      setDailyNeeds(needs);
      const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      setActivity([
        { callId: 'needs-initial', name: 'get_daily_needs', status: 'completed', time: now },
        { callId: 'profile-initial', name: 'get_pet_profile', status: 'completed', time: now }
      ]);
    }).catch((loadError) => active && setError(loadError.message));

    registerPawpilotTools(recordActivity).then((registration) => {
      if (!active) return registration.cleanup();
      cleanup = registration.cleanup;
      setWebMcp({ status: registration.status, registered: registration.registered });
    }).catch(() => active && setWebMcp({ status: 'error', registered: [] }));

    return () => { active = false; cleanup(); };
  }, []);

  const statusCopy = useMemo(() => {
    if (webMcp.status === 'connected') return `${webMcp.registered.length} tools discovered`;
    if (webMcp.status === 'unavailable') return `${tools.length} HTTP tools available`;
    if (webMcp.status === 'error') return 'Tool registration needs attention';
    return 'Discovering browser tools';
  }, [webMcp, tools]);

  const runAction = async (name, action) => {
    setBusy(name); setError('');
    try { await action(); } catch (actionError) { setError(actionError.message); addActivity(name, 'failed'); }
    finally { setBusy(''); }
  };

  const loadToday = () => runAction('get_daily_needs', async () => {
    const needs = await callTool('get_daily_needs', { petId: PET_ID });
    setDailyNeeds(needs); addActivity('get_daily_needs');
  });

  const loadPlans = () => runAction('list_care_plans', async () => {
    const plans = await callTool('list_care_plans', { petId: PET_ID });
    setSavedPlans(plans); addActivity('list_care_plans');
  });

  const saveToday = () => runAction('save_care_plan', async () => {
    const needs = dailyNeeds || (await callTool('get_daily_needs', { petId: PET_ID }));
    const saved = await callTool('save_care_plan', {
      petId: PET_ID,
      plan: { title: `${petProfile?.name || 'Milo'}'s care plan for ${needs.date}`, tasks: needs.tasks, services: [], products: [] }
    });
    setDailyNeeds(needs);
    setSavedPlans((current) => [saved, ...current.filter((plan) => plan.id !== saved.id)]);
    addActivity('save_care_plan');
  });

  const askPawPilot = (event) => {
    event.preventDefault();
    const question = prompt.trim();
    if (!question) return;
    setLastQuestion(question); setPrompt(''); loadToday();
  };

  const petName = petProfile?.name || 'Milo';
  const topTasks = dailyNeeds?.tasks?.slice(0, 4) || [];
  const navItems = [['home', 'Home'], ['user', 'Profile'], ['bag', 'Daily Needs'], ['services', 'Services'], ['cart', 'Products'], ['calendar', 'Care Plans'], ['activity', 'Activity']];
  const needs = [
    ['bowl', 'Nutrition', '2 ½ cups', 'High-quality dog food', styles.green],
    ['drop', 'Hydration', 'Fresh water', 'Always available', styles.blue],
    ['run', 'Exercise', '60+ min', 'Activity & playtime', styles.orange],
    ['heart', 'Wellness', 'Good', 'Up to date on care', styles.purple]
  ];

  return (
    <main className={styles.page}>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <section className={styles.showcase}>
        <div className={styles.storyPanel}>
          <div className={styles.wordmark}><Paw /><div><h1>PawPilot</h1><p>A browser-native pet care workspace</p></div></div>
          <div className={styles.storyCopy}>
            <h2>Ask naturally.<br />Get real answers.</h2>
            <p>AI agents discover and call PawPilot tools through WebMCP to get things done.</p>
            <div className={styles.featureList}>
              <div><span className={styles.featureIcon}><Icon name="chat" /></span><p><strong>Natural Language</strong><small>Talk to PawPilot like a human. Ask anything about your pet.</small></p></div>
              <div><span className={`${styles.featureIcon} ${styles.violet}`}><Icon name="tools" /></span><p><strong>WebMCP Powered</strong><small>Browser-native tools that AI agents can discover and call.</small></p></div>
              <div><span className={`${styles.featureIcon} ${styles.sage}`}><Icon name="shield" /></span><p><strong>Human in Control</strong><small>Important actions need your confirmation.</small></p></div>
              <div><span className={`${styles.featureIcon} ${styles.sky}`}><Paw compact /></span><p><strong>One Pet. One Place.</strong><small>Profile, daily needs, services, products, and care plans—connected.</small></p></div>
            </div>
          </div>
          <div className={styles.dogWrap}><img src="/assets/pawpilot-dog.jpg" alt="A happy gray and white dog" /></div>
          <blockquote>Better care starts with understanding.<br />PawPilot helps you be your pet&apos;s best advocate.</blockquote>
        </div>

        <div className={styles.appShell}>
          <aside className={styles.sidebar}>
            <div className={styles.miniBrand}><Paw compact /><span>PawPilot</span></div>
            <nav>{navItems.map(([icon, label], index) => <button className={index === 0 ? styles.activeNav : ''} key={label}><Icon name={icon} />{label}</button>)}</nav>
            <div className={styles.statusBox}><p><span className={`${styles.statusDot} ${styles[webMcp.status]}`} />WebMCP status</p><strong>{webMcp.status === 'connected' ? 'Connected' : webMcp.status}</strong><small>{statusCopy}</small></div>
          </aside>

          <div className={styles.workspace}>
            <header className={styles.workspaceHeader}>
              <div><h2>Welcome back, Sophia</h2><p>Here&apos;s what {petName} needs today.</p></div>
              <div className={styles.headerControls}>
                <div className={`${styles.webMcpBadge} ${styles[webMcp.status]}`}>
                  <span className={styles.statusDot} />
                  <span><small>WebMCP</small><strong>{webMcp.status === 'connected' ? 'Connected' : webMcp.status}</strong></span>
                </div>
                <div className={styles.petSwitcher}><img src="/assets/pawpilot-avatar.jpg" alt="Milo" /><span><strong>{petName}</strong><small>{petProfile ? `${petProfile.age} years old · ${petProfile.weight} lbs` : 'Loading profile'}</small></span><span>⌄</span></div>
              </div>
            </header>

            <div className={styles.needGrid}>{needs.map(([icon, label, value, note, tone]) => <article className={`${styles.needCard} ${tone}`} key={label}><span><Icon name={icon} size={28} /></span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>)}</div>

            <div className={styles.careGrid}>
              <section className={styles.askCard}>
                <div className={styles.askHeader}><Icon name="sparkle" size={28} /><span><strong>Ask PawPilot</strong><small>Talk naturally about {petName}. Get answers. Take action.</small></span></div>
                <div className={styles.messages}>
                  <div className={styles.userMessage}><Icon name="user" /><p><small>You</small>{lastQuestion}</p></div>
                  <div className={styles.agentMessage}><Paw compact /><div><small>PawPilot</small><p>Here&apos;s {petName}&apos;s personalized plan for today:</p><ul>{topTasks.map((task) => <li key={task.id}><Icon name="check" size={15} />{task.name}</li>)}</ul></div><img src="/assets/pawpilot-avatar.jpg" alt="Milo enjoying the day" /></div>
                </div>
                <div className={styles.planActions}><button onClick={saveToday} disabled={Boolean(busy)}><Icon name="save" />{busy === 'save_care_plan' ? 'Saving…' : 'Save Care Plan'}</button><button className={styles.outlineButton} onClick={loadPlans} disabled={Boolean(busy)}><Icon name="pin" />{busy === 'list_care_plans' ? 'Loading…' : 'View Saved Plans'}</button></div>
                {savedPlans.length > 0 && <p className={styles.savedNote}>{savedPlans.length} saved plan{savedPlans.length === 1 ? '' : 's'} · newest: {savedPlans[0].title}</p>}
                <form className={styles.askForm} onSubmit={askPawPilot}><input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={`Ask anything about ${petName}...`} aria-label={`Ask anything about ${petName}`} /><button aria-label="Send question"><Icon name="send" /></button></form>
              </section>

              <aside className={styles.activityRail}>
                <div className={styles.railHeading}><strong>Tool Activity</strong><span>{activity.length}</span></div>
                <div className={styles.activityList}>{activity.length ? activity.slice(0, 5).map((call, index) => <div className={styles.activityItem} key={call.callId}><span className={`${styles.toolBadge} ${index === 4 ? styles.pendingBadge : ''}`}><Icon name={index % 2 ? 'sparkle' : 'activity'} /></span><p><strong>{call.name}</strong><small>WebMCP</small><em className={styles[call.status]}>{call.status === 'completed' ? 'Success' : call.status}</em></p><time>{call.time}</time></div>) : <p className={styles.empty}>Agent calls appear here.</p>}</div>
                <button className={styles.viewAll} onClick={loadToday}>View all activity <Icon name="arrow" size={15} /></button>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.bottomStory}>
        <div className={styles.trustStrip}><div><Icon name="globe" size={31} /><strong>WebMCP</strong><small>Browser-Native Tools</small></div><div><Icon name="sparkle" size={31} /><strong>AI Agents</strong><small>Discover & Act</small></div><div><Icon name="globe" size={31} /><strong>Privacy First</strong><small>You Stay in Control</small></div><div><Icon name="tools" size={31} /><strong>Built for the Web</strong><small>Agentic Internet</small></div></div>
        <div className={styles.processStrip}>{[['chat','You Ask','Natural Language'],['sparkle','AI Agent','Understands Intent'],['globe','WebMCP','Discovers & Calls Tools'],['tools','PawPilot Tools','Gets Things Done'],['shield','You Approve','Human in Control'],['heart','Better Care','Happier Pets Every Day']].map(([icon,title,copy], index) => <div className={styles.processStep} key={title}><Icon name={icon} size={31} /><strong>{title}</strong><small>{copy}</small>{index < 5 && <span className={styles.processArrow}>→</span>}</div>)}</div>
      </section>
    </main>
  );
}
