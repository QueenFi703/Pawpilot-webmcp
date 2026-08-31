import React, { useState, useRef, useEffect } from 'react';
import './App.css';

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: 'pending' | 'success' | 'error';
  timestamp: number;
}

interface CarePlanItem {
  category: string;
  items?: string[];
  services?: Array<{ name: string; rating: number; price?: string }>;
  products?: Array<{ name: string; price: string; rating: number }>;
}

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: number;
}

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

async function callMCPTool(toolName: string, input: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${API_BASE}/mcp/tools/${toolName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return response.json();
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolCall | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [agentState, setAgentState] = useState<'idle' | 'thinking' | 'executing' | 'confirming'>('idle');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const orchestrateAgentWorkflow = async (userGoal: string) => {
    const toolCalls: ToolCall[] = [];

    try {
      setAgentState('thinking');

      // Step 1: Get pet profile
      const toolCall1: ToolCall = {
        id: `tool_${Date.now()}_1`,
        name: 'get_pet_profile',
        input: { pet_id: 'milo' },
        status: 'pending',
        timestamp: Date.now(),
      };
      toolCalls.push(toolCall1);
      setMessages((m) => [...m, { id: `msg_${Date.now()}`, type: 'system' as const, content: '🔍 Discovering pet profile...', timestamp: Date.now() }]);

      const profileResult = await callMCPTool('get_pet_profile', toolCall1.input);
      toolCall1.output = profileResult;
      toolCall1.status = 'success';

      // Step 2: Get daily needs
      setAgentState('executing');
      const toolCall2: ToolCall = {
        id: `tool_${Date.now()}_2`,
        name: 'get_daily_needs',
        input: { pet_id: 'milo' },
        status: 'pending',
        timestamp: Date.now(),
      };
      toolCalls.push(toolCall2);
      setMessages((m) => [...m, { id: `msg_${Date.now()}`, type: 'system' as const, content: '📋 Retrieving daily care needs...', timestamp: Date.now() }]);

      const needsResult = await callMCPTool('get_daily_needs', toolCall2.input);
      toolCall2.output = needsResult;
      toolCall2.status = 'success';

      // Step 3: Find services
      const toolCall3: ToolCall = {
        id: `tool_${Date.now()}_3`,
        name: 'find_pet_services',
        input: { service_type: 'grooming' },
        status: 'pending',
        timestamp: Date.now(),
      };
      toolCalls.push(toolCall3);
      setMessages((m) => [...m, { id: `msg_${Date.now()}`, type: 'system' as const, content: '🏪 Searching pet services...', timestamp: Date.now() }]);

      const servicesResult = await callMCPTool('find_pet_services', toolCall3.input);
      toolCall3.output = servicesResult;
      toolCall3.status = 'success';

      // Step 4: Find products
      const toolCall4: ToolCall = {
        id: `tool_${Date.now()}_4`,
        name: 'find_pet_products',
        input: { product_type: 'food' },
        status: 'pending',
        timestamp: Date.now(),
      };
      toolCalls.push(toolCall4);
      setMessages((m) => [...m, { id: `msg_${Date.now()}`, type: 'system' as const, content: '🛍️ Finding recommended products...', timestamp: Date.now() }]);

      const productsResult = await callMCPTool('find_pet_products', toolCall4.input);
      toolCall4.output = productsResult;
      toolCall4.status = 'success';

      // Step 5: Build and save care plan
      setAgentState('confirming');
      setMessages((m) => [...m, { id: `msg_${Date.now()}`, type: 'system' as const, content: '✨ Generating personalized care plan...', timestamp: Date.now() }]);

      const carePlan: CarePlanItem[] = [
        {
          category: 'Daily Activities',
          items: (needsResult as any)?.needs || [],
        },
        {
          category: 'Recommended Services',
          services: (servicesResult as any)?.services || [],
        },
        {
          category: 'Recommended Products',
          products: (productsResult as any)?.products || [],
        },
      ];

      const planText = JSON.stringify(carePlan, null, 2);
      const toolCall5: ToolCall = {
        id: `tool_${Date.now()}_5`,
        name: 'save_care_plan',
        input: { pet_id: 'milo', plan: planText },
        status: 'pending',
        timestamp: Date.now(),
      };
      toolCalls.push(toolCall5);

      const saveResult = await callMCPTool('save_care_plan', toolCall5.input);
      toolCall5.output = saveResult;
      toolCall5.status = 'success';

      setAgentState('idle');

      setMessages((m) => [
        ...m,
        {
          id: `msg_${Date.now()}`,
          type: 'agent' as const,
          content: `✅ Care plan ready for Milo! I've discovered ${(needsResult as any)?.needs?.length || 0} daily care items, ${(servicesResult as any)?.services?.length || 0} grooming services, and ${(productsResult as any)?.products?.length || 0} recommended products.`,
          toolCalls,
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      setAgentState('idle');
      setMessages((m) => [
        ...m,
        {
          id: `msg_${Date.now()}`,
          type: 'system' as const,
          content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    setMessages((m) => [
      ...m,
      {
        id: `msg_${Date.now()}`,
        type: 'user' as const,
        content: userMessage,
        timestamp: Date.now(),
      },
    ]);

    await orchestrateAgentWorkflow(userMessage);
    setLoading(false);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <span className="logo-emoji">🐾</span>
            <div className="header-text">
              <h1>PawPilot</h1>
              <p>Intelligent Pet Care Orchestration</p>
            </div>
          </div>
          <div className="agent-status">
            <div className={`status-indicator ${agentState}`} />
            <span className="status-text">{agentState === 'idle' ? 'Ready' : agentState.charAt(0).toUpperCase() + agentState.slice(1)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar - Tool Inspector */}
        <aside className="sidebar">
          <div className="sidebar-title">🔧 Tool Activity</div>
          <div className="tool-list">
            {messages
              .filter((m) => m.toolCalls)
              .flatMap((m) => m.toolCalls || [])
              .slice(-10)
              .map((tool) => (
                <button
                  key={tool.id}
                  className={`tool-item ${tool.status}`}
                  onClick={() => setSelectedTool(tool)}
                  title={tool.name}
                >
                  <div className="tool-status-icon">{tool.status === 'success' ? '✅' : tool.status === 'error' ? '❌' : '⏳'}</div>
                  <div className="tool-name">{tool.name.replace(/_/g, ' ')}</div>
                </button>
              ))}
          </div>

          {selectedTool && (
            <div className="tool-details">
              <h4>Tool Details</h4>
              <div className="detail-section">
                <strong>Input:</strong>
                <pre>{JSON.stringify(selectedTool.input, null, 2)}</pre>
              </div>
              <div className="detail-section">
                <strong>Output:</strong>
                <pre>{String(JSON.stringify(selectedTool.output, null, 2))}</pre>
              </div>
            </div>
          )}
        </aside>

        {/* Chat Area */}
        <main className="chat-area">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🐕</div>
                <h2>Welcome to PawPilot!</h2>
                <p>Ask about Milo's care needs and let our agent orchestrate a personalized care plan.</p>
                <div className="example-prompts">
                  <div className="prompt-label">Try:</div>
                  <button className="example-btn" onClick={() => setInput('What does Milo need today?')}>
                    "What does Milo need today?"
                  </button>
                  <button className="example-btn" onClick={() => setInput('Create a comprehensive care plan for Milo')}>
                    "Create a care plan"
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`message message-${msg.type}`}>
                  <div className="message-avatar">
                    {msg.type === 'user' ? '👤' : msg.type === 'agent' ? '🤖' : '⚙️'}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{String(msg.content)}</div>
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="tool-calls-summary">
                        {msg.toolCalls.map((tc) => (
                          <div key={tc.id} className={`tool-badge ${tc.status}`}>
                            {tc.status === 'success' ? '✅' : '⏳'} {tc.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form className="input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Milo's care..."
              disabled={loading}
              className="input-field"
            />
            <button type="submit" disabled={loading || !input.trim()} className="submit-btn">
              {loading ? '⏳ Processing...' : '✈️ Send'}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
