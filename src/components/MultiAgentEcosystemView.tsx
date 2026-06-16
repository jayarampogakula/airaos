import React, { useState } from 'react';
import {
  Users, Bot, Activity, Settings, Plus, Play, Trash2, Edit3,
  MessageSquare, Clock, ShieldCheck, ChevronRight, ToggleLeft, ToggleRight,
  TrendingUp, BarChart2, CornerDownRight, ArrowRight, UserCheck
} from 'lucide-react';

interface MultiAgentEcosystemViewProps {
  agents?: Array<{
    id: string;
    name: string;
    department: string;
    status: string;
    agentRole?: string;
    conversationsHandled?: number;
    avgResponseTime?: number;
  }>;
  onAddAgent?: () => void;
  tenantId?: string;
}

interface AgentCardData {
  id: string;
  name: string;
  role: string;
  emoji: string;
  status: 'online' | 'offline';
  department: string;
  keywords: string[];
  convsToday: number;
  avgResponse: string;
  successRate: number;
  active: boolean;
}

interface RoutingRule {
  id: string;
  keywords: string[];
  targetAgent: string;
}

const MOCK_AGENTS: AgentCardData[] = [
  { id: '1', name: 'Sales Agent', role: 'Lead Qualification & Pitching', emoji: '💼', status: 'online', department: 'Sales', keywords: ['pricing', 'demo', 'cost', 'quote'], convsToday: 64, avgResponse: '0.8s', successRate: 94, active: true },
  { id: '2', name: 'Support Agent', role: 'FAQ & Troubleshooting', emoji: '🎧', status: 'online', department: 'Customer Success', keywords: ['issue', 'problem', 'help', 'broken', 'error'], convsToday: 78, avgResponse: '1.2s', successRate: 88, active: true },
  { id: '3', name: 'Appointment Agent', role: 'Calendar Booking Manager', emoji: '📅', status: 'online', department: 'Operations', keywords: ['book', 'schedule', 'appointment', 'slot', 'call'], convsToday: 42, avgResponse: '0.9s', successRate: 96, active: true },
  { id: '4', name: 'Billing Agent', role: 'Invoice & Payment Queries', emoji: '💳', status: 'online', department: 'Finance', keywords: ['invoice', 'payment', 'receipt', 'charge', 'refund'], convsToday: 18, avgResponse: '1.5s', successRate: 91, active: true },
  { id: '5', name: 'Follow-up Agent', role: 'Re-engagement & Nurturing', emoji: '🔁', status: 'offline', department: 'Marketing', keywords: ['reactivate', 'touch base', 'reminder'], convsToday: 0, avgResponse: 'N/A', successRate: 85, active: false },
  { id: '6', name: 'Voice Agent', role: 'Outbound voice calling assistant', emoji: '📞', status: 'online', department: 'Sales & Support', keywords: ['call me', 'phone talk', 'voice message'], convsToday: 12, avgResponse: '1.8s', successRate: 82, active: true },
  { id: '7', name: 'Website Agent', role: 'Landing page interactive chat', emoji: '🌐', status: 'online', department: 'Marketing', keywords: ['hello', 'hi', 'anyone there'], convsToday: 95, avgResponse: '0.5s', successRate: 90, active: true },
  { id: '8', name: 'WhatsApp Agent', role: 'WhatsApp business API handler', emoji: '💬', status: 'online', department: 'Omnichannel', keywords: ['wa', 'whatsapp text', 'mobile query'], convsToday: 55, avgResponse: '0.9s', successRate: 93, active: true }
];

const MOCK_RULES: RoutingRule[] = [
  { id: 'r1', keywords: ['pricing', 'demo'], targetAgent: 'Sales Agent' },
  { id: 'r2', keywords: ['invoice', 'payment'], targetAgent: 'Billing Agent' },
  { id: 'r3', keywords: ['book', 'schedule'], targetAgent: 'Appointment Agent' },
  { id: 'r4', keywords: ['issue', 'problem'], targetAgent: 'Support Agent' }
];

const MOCK_HANDOFFS = [
  { id: 'h1', visitor: 'Rahul Mehta', from: 'Website Agent', to: 'Sales Agent', time: '2 mins ago' },
  { id: 'h2', visitor: 'Priya Sharma', from: 'WhatsApp Agent', to: 'Appointment Agent', time: '5 mins ago' },
  { id: 'h3', visitor: 'Arjun Kumar', from: 'Support Agent', to: 'Human Agent', time: '18 mins ago' },
  { id: 'h4', visitor: 'Amit Singh', from: 'Voice Agent', to: 'Sales Agent', time: '25 mins ago' }
];

export const MultiAgentEcosystemView: React.FC<MultiAgentEcosystemViewProps> = ({ tenantId, onAddAgent }) => {
  const [agents, setAgents] = useState<AgentCardData[]>(MOCK_AGENTS);
  const [rules, setRules] = useState<RoutingRule[]>(MOCK_RULES);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleKeywords, setNewRuleKeywords] = useState('');
  const [newRuleAgent, setNewRuleAgent] = useState('Sales Agent');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleKeywords.trim()) return;
    const keywordsArray = newRuleKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const newRule: RoutingRule = {
      id: `r-${Date.now()}`,
      keywords: keywordsArray,
      targetAgent: newRuleAgent
    };
    setRules(prev => [...prev, newRule]);
    setShowAddRuleModal(false);
    setNewRuleKeywords('');
  };

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          active: !a.active,
          status: !a.active ? 'online' : 'offline' as 'online' | 'offline'
        };
      }
      return a;
    }));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const totalHandled = agents.reduce((sum, a) => sum + a.convsToday, 0);

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--bg-primary, #0b0f19)', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--primary-color, #6366f1), var(--accent-color, #06b6d4))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            }}>
              <Bot size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #fff 40%, var(--primary-color, #6366f1))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Multi-Agent Ecosystem
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                AI agents collaborate and route conversations automatically
              </p>
            </div>
          </div>
        </div>
        <button onClick={onAddAgent || (() => alert("To add a new agent, write custom prompts and configure personalities in the 'AI Agent Builder' tab!"))} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'linear-gradient(135deg, var(--primary-color, #6366f1), var(--accent-color, #06b6d4))', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>
          <Plus size={14} /> Add New Agent Role
        </button>
      </div>

      {/* ── Top Stat Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Agents', value: agents.length.toString(), icon: Users, color: '#3b82f6', sub: '8 custom personas configured' },
          { label: 'Active Now', value: agents.filter(a => a.active).length.toString(), icon: ShieldCheck, color: '#22c55e', sub: 'Routing active channels' },
          { label: 'Conversations Today', value: totalHandled.toString(), icon: MessageSquare, color: '#a78bfa', sub: '92% handled by AI autonomously' },
          { label: 'Avg Response Time', value: '1.2s', icon: Clock, color: '#06b6d4', sub: 'Instant routing enabled' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--bg-glass, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-glass, rgba(255,255,255,0.08))',
            borderRadius: 16, padding: '20px 22px',
            backdropFilter: 'blur(12px)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={17} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif', lineHeight: 1, marginBottom: 8 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#475569' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        
        {/* LEFT PANEL: Agent Cards & Routing Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Agent Cards Grid */}
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: '"Space Grotesk", sans-serif' }}>Configured AI Agents</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {agents.map(a => (
                <div key={a.id} style={{
                  background: 'var(--bg-glass, rgba(255,255,255,0.03))',
                  border: `1px solid ${a.active ? 'rgba(99,102,241,0.2)' : 'var(--border-glass, rgba(255,255,255,0.08))'}`,
                  borderRadius: 16, padding: 18, position: 'relative',
                  opacity: a.active ? 1 : 0.6,
                  transition: 'opacity 0.2s, border-color 0.2s'
                }}>
                  {/* Top: emoji + Name + Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{a.emoji}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{a.name}</h4>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.status === 'online' ? '#22c55e' : '#64748b' }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 2 }}>{a.department}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onClick={() => onAddAgent ? onAddAgent() : alert("Switch to the 'Agent Builder' tab to edit details!")} 
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          padding: '4px', 
                          color: '#64748b', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          transition: 'color 0.2s'
                        }} 
                        title="Configure Agent"
                      >
                        <Settings size={18} />
                      </button>
                      <button onClick={() => toggleAgent(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: a.active ? 'var(--primary-color, #6366f1)' : '#475569' }}>
                        {a.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{a.role}</p>

                  {/* Keywords tags */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {a.keywords.map(kw => (
                      <span key={kw} style={{ fontSize: 10, color: '#cbd5e1', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>
                        {kw}
                      </span>
                    ))}
                  </div>

                  {/* Stats footer */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '10px 0 0', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 11, color: '#64748b' }}>
                    <div>
                      <div>Convs today</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>{a.convsToday}</div>
                    </div>
                    <div>
                      <div>Avg response</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>{a.avgResponse}</div>
                    </div>
                    <div>
                      <div>Success rate</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', marginTop: 2 }}>{a.successRate}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Routing Rules Editor */}
          <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.03))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif' }}>Routing Rules Editor</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 }}>Define trigger keywords to route conversations to specific agents</p>
              </div>
              <button onClick={() => setShowAddRuleModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#cbd5e1', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={12} /> Add Routing Rule
              </button>
            </div>

            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10, padding: '10px 24px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {['Trigger Condition', 'Route to Agent', 'Actions'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>

            {/* Table Rows */}
            {rules.map(r => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10, padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>If query contains:</span>
                  {r.keywords.map(kw => (
                    <span key={kw} style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-color, #6366f1)', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 4 }}>
                      "{kw}"
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#fff', fontWeight: 600 }}>
                  <CornerDownRight size={12} color="#64748b" /> {r.targetAgent}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Edit3 size={14} /></button>
                  <button onClick={() => deleteRule(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT PANEL: Agent Load & Handoff Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Today's Load Distribution */}
          <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.03))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BarChart2 size={16} color="var(--primary-color, #6366f1)" />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: '"Space Grotesk", sans-serif' }}>Load Distribution</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {agents.filter(a => a.convsToday > 0).map(a => {
                const pct = (a.convsToday / totalHandled) * 100;
                return (
                  <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{a.emoji} {a.name}</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{a.convsToday} <span style={{ color: '#64748b', fontWeight: 400 }}>({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary-color, #6366f1), var(--accent-color, #06b6d4))', borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Handoff Log */}
          <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.03))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Activity size={16} color="var(--accent-color, #06b6d4)" />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: '"Space Grotesk", sans-serif' }}>Agent Handoff Log</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MOCK_HANDOFFS.map(h => (
                <div key={h.id} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{h.visitor}</span>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{h.time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
                    <span>{h.from}</span>
                    <ArrowRight size={10} color="#64748b" />
                    <span style={{ color: 'var(--accent-color, #06b6d4)' }}>{h.to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {showAddRuleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>Create Routing Rule</h3>
              <button onClick={() => setShowAddRuleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trigger Keywords (comma separated)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. quote, price, discount" 
                  value={newRuleKeywords} 
                  onChange={e => setNewRuleKeywords(e.target.value)} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Route to Agent</label>
                <select 
                  className="form-input" 
                  value={newRuleAgent} 
                  onChange={e => setNewRuleAgent(e.target.value)}
                  style={{ background: '#0b0f19', color: '#fff', padding: '8px' }}
                >
                  {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddRuleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
