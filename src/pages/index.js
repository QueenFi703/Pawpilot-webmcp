import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [petProfile, setPetProfile] = useState(null);
  const [toolCalls, setToolCalls] = useState([]);
  const [userGoal, setUserGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    loadPetProfile();
  }, []);

  const loadPetProfile = async () => {
    try {
      const result = await runTool('get_pet_profile', { petId: 'milo-001' });
      if (result.success) {
        setPetProfile(result.data);
        setPageError('');
      } else {
        setPageError(result.error || 'Unable to load the pet profile.');
      }
    } catch (error) {
      console.error('Error loading pet profile:', error);
      setPageError('Unable to connect to the PawPilot API.');
    }
  };

  const runTool = async (tool, params) => {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, params })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Tool request failed with ${response.status}`);
    }

    return result;
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (!userGoal.trim()) return;

    setLoading(true);
    const newToolCall = {
      id: Date.now(),
      goal: userGoal,
      status: 'processing',
      tools: []
    };
    setToolCalls(prev => [...prev, newToolCall]);

    try {
      // Simulate agent workflow: get profile -> get needs -> find services
      await executeToolSequence(newToolCall.id);
    } finally {
      setLoading(false);
    }
  };

  const executeToolSequence = async (callId) => {
    const tools = [
      { name: 'get_pet_profile', params: { petId: 'milo-001' } },
      { name: 'get_daily_needs', params: { petId: 'milo-001' } },
      { name: 'find_pet_services', params: { serviceType: 'grooming' } }
    ];

    let hasErrors = false;

    for (const tool of tools) {
      try {
        const result = await runTool(tool.name, tool.params);
        hasErrors = hasErrors || !result.success;

        setToolCalls(prev =>
          prev.map(call =>
            call.id === callId
              ? {
                  ...call,
                  tools: [
                    ...call.tools,
                    {
                      name: tool.name,
                      status: result.success ? 'success' : 'error',
                      result
                    }
                  ]
                }
              : call
          )
        );
      } catch (error) {
        console.error(`Error executing tool ${tool.name}:`, error);
        hasErrors = true;
        setToolCalls(prev =>
          prev.map(call =>
            call.id === callId
              ? {
                  ...call,
                  tools: [
                    ...call.tools,
                    {
                      name: tool.name,
                      status: 'error',
                      result: { success: false, error: error.message }
                    }
                  ]
                }
              : call
          )
        );
      }
    }

    setToolCalls(prev =>
      prev.map(call =>
        call.id === callId
          ? { ...call, status: hasErrors ? 'failed' : 'completed' }
          : call
      )
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🐾 PawPilot</h1>
        <p>Agent-ready pet care for Milo</p>
      </header>

      {petProfile && (
        <section className={styles.petProfile}>
          <h2>{petProfile.name}</h2>
          <div className={styles.profileGrid}>
            <div>
              <strong>Breed:</strong> {petProfile.breed}
            </div>
            <div>
              <strong>Age:</strong> {petProfile.age} years
            </div>
            <div>
              <strong>Weight:</strong> {petProfile.weight} lbs
            </div>
            <div>
              <strong>Last Vet Visit:</strong> {petProfile.lastVetVisit}
            </div>
          </div>
          <p className={styles.notes}>{petProfile.notes}</p>
        </section>
      )}

      <section className={styles.goalForm}>
        <h2>What does Milo need today?</h2>
        {pageError && <p className={styles.errorMessage}>{pageError}</p>}
        <form onSubmit={handleGoalSubmit}>
          <input
            type="text"
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            placeholder="Ask the agent to help with Milo's care..."
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Ask Agent'}
          </button>
        </form>
      </section>

      {toolCalls.length > 0 && (
        <section className={styles.toolCalls}>
          <h2>Agent Activity</h2>
          {toolCalls.map(call => (
            <div key={call.id} className={styles.toolCall}>
              <div className={styles.callHeader}>
                <h3>Goal: {call.goal}</h3>
                <span
                  className={`${styles.status} ${styles[call.status]}`}
                >
                  {call.status}
                </span>
              </div>
              <div className={styles.toolList}>
                {call.tools.map((tool, idx) => (
                  <div key={idx} className={styles.tool}>
                    <span className={styles.toolName}>{tool.name}</span>
                    <span
                      className={`${styles.toolStatus} ${styles[
                        tool.status
                      ]}`}
                    >
                      {tool.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
