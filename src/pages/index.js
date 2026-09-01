import { useEffect, useMemo, useState } from 'react';
import { registerPawpilotTools } from '../client/webmcp.js';
import styles from '../styles/Home.module.css';

const PET_ID = 'milo-001';

async function callTool(tool, params) {
  const response = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, params })
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

  useEffect(() => {
    let active = true;
    let cleanup = () => {};

    const recordActivity = (event) => {
      if (!active) return;
      setActivity((current) => {
        const existing = current.findIndex((item) => item.callId === event.callId);
        if (existing === -1) return [event, ...current].slice(0, 8);
        return current.map((item, index) => (index === existing ? { ...item, ...event } : item));
      });
    };

    Promise.all([
      fetch('/api/tools').then((response) => response.json()),
      callTool('get_pet_profile', { petId: PET_ID })
    ])
      .then(([catalog, profile]) => {
        if (!active) return;
        setTools(catalog.tools || []);
        setPetProfile(profile);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.message);
      });

    registerPawpilotTools(recordActivity)
      .then((registration) => {
        if (!active) {
          registration.cleanup();
          return;
        }
        cleanup = registration.cleanup;
        setWebMcp({ status: registration.status, registered: registration.registered });
      })
      .catch(() => {
        if (active) setWebMcp({ status: 'error', registered: [] });
      });

    return () => {
      active = false;
      cleanup();
    };
  }, []);

  const statusCopy = useMemo(() => {
    if (webMcp.status === 'connected') return `${webMcp.registered.length} tools registered in this page`;
    if (webMcp.status === 'unavailable') return 'Browser WebMCP is not available; HTTP tools remain usable';
    if (webMcp.status === 'error') return 'Tool registration could not finish';
    return 'Checking this browser for WebMCP support';
  }, [webMcp]);

  const runAction = async (name, action) => {
    setBusy(name);
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  };

  const loadToday = () =>
    runAction('needs', async () => {
      const needs = await callTool('get_daily_needs', { petId: PET_ID });
      setDailyNeeds(needs);
    });

  const loadPlans = () =>
    runAction('plans', async () => {
      const plans = await callTool('list_care_plans', { petId: PET_ID });
      setSavedPlans(plans);
    });

  const saveToday = () =>
    runAction('save', async () => {
      const needs = dailyNeeds || (await callTool('get_daily_needs', { petId: PET_ID }));
      const saved = await callTool('save_care_plan', {
        petId: PET_ID,
        plan: {
          title: `${petProfile?.name || 'Milo'}'s care plan for ${needs.date}`,
          tasks: needs.tasks,
          services: [],
          products: []
        }
      });
      setDailyNeeds(needs);
      setSavedPlans((current) => [saved, ...current.filter((plan) => plan.id !== saved.id)]);
    });

  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <div className={styles.brandMark} aria-hidden="true">
          <svg viewBox="0 0 64 64" role="img">
            <path d="M22 28c6-7 14-7 20 0 4 5 9 9 8 16-1 8-9 11-18 8-9 3-17 0-18-8-1-7 4-11 8-16Z" />
            <circle cx="15" cy="25" r="7" />
            <circle cx="27" cy="15" r="7" />
            <circle cx="41" cy="15" r="7" />
            <circle cx="52" cy="25" r="7" />
          </svg>
        </div>
        <div>
          <p className={styles.eyebrow}>A browser-native pet care workspace</p>
          <h1>PawPilot</h1>
          <p className={styles.intro}>
            Real tools for agents, a calm dashboard for people, and one shared source of truth.
          </p>
        </div>
        <div className={`${styles.connection} ${styles[webMcp.status]}`}>
          <span className={styles.statusDot} />
          <div>
            <strong>{webMcp.status === 'connected' ? 'Agent callable' : 'WebMCP status'}</strong>
            <small>{statusCopy}</small>
          </div>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <section className={styles.dashboard}>
        <article className={styles.profileCard}>
          <p className={styles.cardLabel}>Current companion</p>
          {petProfile ? (
            <>
              <div className={styles.profileHeading}>
                <div className={styles.avatar}>{petProfile.name.slice(0, 1)}</div>
                <div>
                  <h2>{petProfile.name}</h2>
                  <p>{petProfile.breed}</p>
                </div>
              </div>
              <dl className={styles.profileFacts}>
                <div><dt>Age</dt><dd>{petProfile.age} years</dd></div>
                <div><dt>Weight</dt><dd>{petProfile.weight} lb</dd></div>
                <div><dt>Allergies</dt><dd>{petProfile.allergies.join(', ') || 'None'}</dd></div>
                <div><dt>Last checkup</dt><dd>{petProfile.lastVetVisit}</dd></div>
              </dl>
              <p className={styles.profileNote}>{petProfile.notes}</p>
            </>
          ) : (
            <div className={styles.skeleton}>Loading Milo’s profile…</div>
          )}
        </article>

        <article className={styles.actionCard}>
          <p className={styles.cardLabel}>Human controls</p>
          <h2>Review before an agent writes</h2>
          <p>
            Read tools are available immediately. Saving a plan stays an explicit action, whether
            requested here or through an agent.
          </p>
          <div className={styles.actions}>
            <button onClick={loadToday} disabled={Boolean(busy)}>
              {busy === 'needs' ? 'Loading…' : 'Load today’s needs'}
            </button>
            <button className={styles.secondaryButton} onClick={loadPlans} disabled={Boolean(busy)}>
              {busy === 'plans' ? 'Loading…' : 'View saved plans'}
            </button>
            <button
              className={styles.saveButton}
              onClick={saveToday}
              disabled={Boolean(busy) || !petProfile}
            >
              {busy === 'save' ? 'Saving…' : 'Approve & save today’s plan'}
            </button>
          </div>
        </article>

        <article className={styles.toolsCard}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.cardLabel}>Live tool catalog</p>
              <h2>{tools.length || '—'} callable tools</h2>
            </div>
            <code>document.modelContext</code>
          </div>
          <div className={styles.toolGrid}>
            {tools.map((tool) => (
              <div className={styles.tool} key={tool.name}>
                <div>
                  <code>{tool.name}</code>
                  <p>{tool.description}</p>
                </div>
                <span>{tool.annotations?.readOnlyHint ? 'read' : 'write'}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.needsCard}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.cardLabel}>Care snapshot</p>
              <h2>{dailyNeeds ? dailyNeeds.date : 'Not loaded'}</h2>
            </div>
          </div>
          {dailyNeeds ? (
            <ol className={styles.taskList}>
              {dailyNeeds.tasks.map((task) => (
                <li key={task.id}><time>{task.time}</time><span>{task.name}</span></li>
              ))}
            </ol>
          ) : (
            <p className={styles.emptyState}>Load today’s needs or ask a connected agent to call <code>get_daily_needs</code>.</p>
          )}
        </article>

        <article className={styles.activityCard}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.cardLabel}>Incoming agent calls</p>
              <h2>WebMCP activity</h2>
            </div>
            <span className={styles.activityCount}>{activity.length}</span>
          </div>
          {activity.length ? (
            <ul className={styles.activityList}>
              {activity.map((call) => (
                <li key={call.callId}>
                  <span className={`${styles.callState} ${styles[call.status]}`} />
                  <code>{call.name}</code>
                  <small>{call.status}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>Calls made by a WebMCP-capable agent appear here as they happen.</p>
          )}
          {savedPlans.length > 0 && (
            <div className={styles.savedSummary}>
              <strong>{savedPlans.length} saved plan{savedPlans.length === 1 ? '' : 's'}</strong>
              <span>Newest: {savedPlans[0].title}</span>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
