import React, { useState } from 'react';
import {
  RefreshCw, Plus, Trash2, Edit3, Copy, ToggleLeft, ToggleRight,
  MessageCircle, Phone, Mail, MessageSquare, User, Bot, Send,
  CheckCircle2, Clock, TrendingUp, Zap, ChevronDown, Settings,
  AlertCircle, ArrowRight, Save, X, Target, Activity
} from 'lucide-react';

interface MissedLeadRecoveryViewProps {
  tenantId?: string;
}

interface WorkflowStep {
  id: string;
  delayValue: number;
  delayUnit: 'hours' | 'days';
  channel: 'ai' | 'whatsapp' | 'voice' | 'human' | 'email' | 'sms';
  message: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  triggered: number;
  recovered: number;
  successRate: number;
  steps: WorkflowStep[];
}

interface RecoveredLead {
  id: string;
  contact: string;
  avatar: string;
  lastActivity: string;
  recoveryChannel: string;
  daysInactive: number;
  scoreBefore: number;
  scoreAfter: number;
  dateRecovered: string;
}

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; emoji: string }> = {
  ai: { label: 'AI Message', icon: <Bot size={14} />, color: '#6366f1', emoji: '🤖' },
  whatsapp: { label: 'WhatsApp', icon: <MessageCircle size={14} />, color: '#25d366', emoji: '💬' },
  voice: { label: 'Voice Call', icon: <Phone size={14} />, color: '#f59e0b', emoji: '📞' },
  human: { label: 'Human Task', icon: <User size={14} />, color: '#ec4899', emoji: '👤' },
  email: { label: 'Email', icon: <Mail size={14} />, color: '#3b82f6', emoji: '📧' },
  sms: { label: 'SMS', icon: <MessageSquare size={14} />, color: '#06b6d4', emoji: '📱' },
};

const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: 'w1',
    name: 'Standard Lead Recovery',
    description: 'Re-engage leads who have gone cold after initial contact with a 4-step multi-channel sequence.',
    active: true,
    triggered: 124,
    recovered: 47,
    successRate: 38,
    steps: [
      { id: 's1', delayValue: 24, delayUnit: 'hours', channel: 'ai', message: 'Hi {{name}}, just checking in! I noticed you were interested in our platform. Can I answer any questions for you?' },
      { id: 's2', delayValue: 3, delayUnit: 'days', channel: 'whatsapp', message: 'Hey {{name}}! We have a special offer just for you this week. Would you like to hear about it?' },
      { id: 's3', delayValue: 7, delayUnit: 'days', channel: 'voice', message: 'Schedule a personal call to reconnect and understand their current needs.' },
      { id: 's4', delayValue: 14, delayUnit: 'days', channel: 'human', message: 'Manual outreach: personal email from account executive with a tailored proposal.' },
    ]
  },
  {
    id: 'w2',
    name: 'High-Value Lead Recovery',
    description: 'Accelerated recovery for leads with deal value above ₹50,000 — more aggressive touchpoints.',
    active: true,
    triggered: 38,
    recovered: 19,
    successRate: 50,
    steps: [
      { id: 's1', delayValue: 6, delayUnit: 'hours', channel: 'ai', message: 'Hi {{name}}, our team noticed your interest in our enterprise features. Let me share something exclusive...' },
      { id: 's2', delayValue: 1, delayUnit: 'days', channel: 'voice', message: 'Priority voice call from a senior account manager.' },
      { id: 's3', delayValue: 3, delayUnit: 'days', channel: 'email', message: 'Personalized ROI analysis email with custom pricing for their business size.' },
      { id: 's4', delayValue: 7, delayUnit: 'days', channel: 'human', message: 'C-level introduction call + custom demo scheduled.' },
    ]
  },
  {
    id: 'w3',
    name: 'Cold Lead Reactivation',
    description: 'Long-dormant leads (30+ days inactive) re-engaged with value-focused content campaign.',
    active: false,
    triggered: 89,
    recovered: 12,
    successRate: 13,
    steps: [
      { id: 's1', delayValue: 1, delayUnit: 'days', channel: 'email', message: 'Subject: Still interested in {{company_name}}? We have made some big improvements!' },
      { id: 's2', delayValue: 7, delayUnit: 'days', channel: 'whatsapp', message: 'Sharing a quick case study — how a company like yours grew 3x with our platform.' },
      { id: 's3', delayValue: 14, delayUnit: 'days', channel: 'sms', message: 'Last chance: 20% off if you restart within the next 48 hours.' },
    ]
  },
];

const MOCK_RECOVERED: RecoveredLead[] = [
  { id: 'r1', contact: 'Rahul Mehta', avatar: 'RM', lastActivity: 'Visited pricing page', recoveryChannel: 'WhatsApp', daysInactive: 8, scoreBefore: 22, scoreAfter: 71, dateRecovered: 'Today' },
  { id: 'r2', contact: 'Priya Sharma', avatar: 'PS', lastActivity: 'Downloaded brochure', recoveryChannel: 'AI Message', daysInactive: 5, scoreBefore: 35, scoreAfter: 68, dateRecovered: 'Today' },
  { id: 'r3', contact: 'Arjun Kapoor', avatar: 'AK', lastActivity: 'Viewed demo video', recoveryChannel: 'Voice Call', daysInactive: 14, scoreBefore: 18, scoreAfter: 82, dateRecovered: 'Yesterday' },
  { id: 'r4', contact: 'Sunita Iyer', avatar: 'SI', lastActivity: 'Signed up, no action', recoveryChannel: 'Email', daysInactive: 21, scoreBefore: 10, scoreAfter: 54, dateRecovered: 'Jun 13' },
  { id: 'r5', contact: 'Vikram Joshi', avatar: 'VJ', lastActivity: 'Chat abandoned mid-flow', recoveryChannel: 'AI Message', daysInactive: 3, scoreBefore: 45, scoreAfter: 79, dateRecovered: 'Jun 12' },
  { id: 'r6', contact: 'Meera Nair', avatar: 'MN', lastActivity: 'Opened 3 emails, no reply', recoveryChannel: 'WhatsApp', daysInactive: 11, scoreBefore: 29, scoreAfter: 61, dateRecovered: 'Jun 11' },
];

const DEFAULT_NEW_STEP = (): WorkflowStep => ({
  id: `s${Date.now()}`,
  delayValue: 1,
  delayUnit: 'days',
  channel: 'ai',
  message: '',
});

export const MissedLeadRecoveryView: React.FC<MissedLeadRecoveryViewProps> = ({ tenantId }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>(MOCK_WORKFLOWS);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('w1');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [excludeActive, setExcludeActive] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(4);

  // Builder state (local copy of selected)
  const [builderName, setBuilderName] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderSteps, setBuilderSteps] = useState<WorkflowStep[]>([]);

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);

  const openWorkflow = (wf: Workflow) => {
    setSelectedWorkflowId(wf.id);
    setIsCreatingNew(false);
    setBuilderName(wf.name);
    setBuilderDesc(wf.description);
    setBuilderSteps(wf.steps.map(s => ({ ...s })));
  };

  const openNew = () => {
    setIsCreatingNew(true);
    setSelectedWorkflowId('');
    setBuilderName('');
    setBuilderDesc('');
    setBuilderSteps([DEFAULT_NEW_STEP()]);
  };

  const toggleWorkflow = (id: string) => {
    setWorkflows(ws => ws.map(w => w.id === id ? { ...w, active: !w.active } : w));
  };

  const addStep = () => setBuilderSteps(s => [...s, DEFAULT_NEW_STEP()]);

  const removeStep = (id: string) => setBuilderSteps(s => s.filter(st => st.id !== id));

  const updateStep = (id: string, field: keyof WorkflowStep, value: any) => {
    setBuilderSteps(s => s.map(st => st.id === id ? { ...st, [field]: value } : st));
  };

  const saveWorkflow = () => {
    if (isCreatingNew) {
      const newWf: Workflow = {
        id: `w${Date.now()}`,
        name: builderName || 'New Workflow',
        description: builderDesc,
        active: false,
        triggered: 0, recovered: 0, successRate: 0,
        steps: builderSteps
      };
      setWorkflows(ws => [...ws, newWf]);
      setSelectedWorkflowId(newWf.id);
      setIsCreatingNew(false);
    } else {
      setWorkflows(ws => ws.map(w => w.id === selectedWorkflowId ? { ...w, name: builderName, description: builderDesc, steps: builderSteps } : w));
    }
  };

  const summaryStats = [
    { label: 'Leads Recovered', value: '47', icon: <CheckCircle2 size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Active Workflows', value: '3', icon: <Activity size={18} />, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Recovery Rate', value: '38%', icon: <TrendingUp size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Avg Recovery Time', value: '2.4 days', icon: <Clock size={18} />, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  ];

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={18} color="#fff" />
            </div>
            Missed Lead Recovery
          </h1>
          <p className="view-subtitle" style={{ marginLeft: 48 }}>Automatically re-engage cold and inactive leads across all channels</p>
        </div>
        <button onClick={openNew} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Plus size={14} /> New Workflow
        </button>
      </div>

      {/* Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {summaryStats.map(stat => (
          <div key={stat.label} className="glass-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1.1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 20, flex: 1 }}>

        {/* LEFT: Workflows + Recovered Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Recovery Workflows */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Recovery Workflows</h3>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{workflows.filter(w => w.active).length} active of {workflows.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {workflows.map(wf => (
                <WorkflowCard
                  key={wf.id}
                  workflow={wf}
                  isSelected={wf.id === selectedWorkflowId && !isCreatingNew}
                  onSelect={() => openWorkflow(wf)}
                  onToggle={() => toggleWorkflow(wf.id)}
                  onDuplicate={() => {
                    const dup: Workflow = { ...wf, id: `w${Date.now()}`, name: `${wf.name} (Copy)`, active: false };
                    setWorkflows(ws => [...ws, dup]);
                  }}
                  onEdit={() => openWorkflow(wf)}
                />
              ))}

              {/* Create New Card */}
              <div
                onClick={openNew}
                className="glass-card"
                style={{ padding: '18px', cursor: 'pointer', border: '2px dashed rgba(99,102,241,0.35)', background: isCreatingNew ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} color="#818cf8" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#818cf8' }}>Create New Workflow</span>
              </div>
            </div>
          </div>

          {/* Recently Recovered Leads Table */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <CheckCircle2 size={15} color="#10b981" /> Recently Recovered Leads
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    {['Contact', 'Last Activity', 'Recovery Channel', 'Days Inactive', 'Score Change', 'Recovered'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_RECOVERED.map((lead, i) => {
                    const ch = Object.entries(CHANNEL_CONFIG).find(([, v]) => v.label === lead.recoveryChannel);
                    const chConfig = ch ? ch[1] : CHANNEL_CONFIG.ai;
                    return (
                      <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '10px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                              {lead.avatar}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{lead.contact}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{lead.lastActivity}</span>
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: chConfig.color, background: `${chConfig.color}18`, padding: '2px 8px', borderRadius: 10 }}>
                            {chConfig.icon} {lead.recoveryChannel}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: lead.daysInactive > 10 ? '#ef4444' : lead.daysInactive > 5 ? '#f59e0b' : '#10b981' }}>
                            {lead.daysInactive}d
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>{lead.scoreBefore}</span>
                            <ArrowRight size={11} color="#10b981" />
                            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>{lead.scoreAfter}</span>
                            <span style={{ fontSize: 10, color: '#10b981' }}>(+{lead.scoreAfter - lead.scoreBefore})</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{lead.dateRecovered}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Workflow Builder */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Settings size={14} color="#818cf8" />
              {isCreatingNew ? 'New Workflow' : 'Workflow Builder'}
            </h3>
            {(selectedWorkflowId || isCreatingNew) && (
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: isCreatingNew ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.15)', color: isCreatingNew ? '#818cf8' : '#10b981', fontWeight: 700 }}>
                {isCreatingNew ? 'NEW' : 'EDITING'}
              </span>
            )}
          </div>

          {(selectedWorkflowId || isCreatingNew) ? (
            <>
              {/* Name + Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Workflow Name</label>
                  <input
                    className="form-input"
                    value={builderName}
                    onChange={e => setBuilderName(e.target.value)}
                    placeholder="e.g. Standard Lead Recovery"
                    style={{ width: '100%', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Description</label>
                  <textarea
                    className="form-input"
                    value={builderDesc}
                    onChange={e => setBuilderDesc(e.target.value)}
                    placeholder="Describe what this workflow does..."
                    rows={2}
                    style={{ width: '100%', fontSize: 12, resize: 'none' }}
                  />
                </div>
              </div>

              {/* Steps Builder */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 10 }}>
                  Sequence Steps ({builderSteps.length})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {builderSteps.map((step, i) => {
                    const chCfg = CHANNEL_CONFIG[step.channel];
                    return (
                      <div key={step.id} style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.15)', padding: '2px 7px', borderRadius: 4 }}>STEP {i + 1}</span>
                          <button onClick={() => removeStep(step.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                            <X size={13} />
                          </button>
                        </div>

                        {/* Delay */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Delay</label>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <input
                                type="number"
                                className="form-input"
                                value={step.delayValue}
                                min={1}
                                onChange={e => updateStep(step.id, 'delayValue', parseInt(e.target.value) || 1)}
                                style={{ width: 60, fontSize: 12, padding: '5px 8px' }}
                              />
                              <select
                                className="form-input"
                                value={step.delayUnit}
                                onChange={e => updateStep(step.id, 'delayUnit', e.target.value)}
                                style={{ flex: 1, fontSize: 12, padding: '5px 8px' }}
                              >
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Channel Selector */}
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Channel</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => (
                              <button
                                key={key}
                                onClick={() => updateStep(step.id, 'channel', key)}
                                style={{
                                  padding: '4px 10px', borderRadius: 8, border: `1px solid ${step.channel === key ? cfg.color : 'rgba(255,255,255,0.08)'}`,
                                  background: step.channel === key ? `${cfg.color}22` : 'rgba(255,255,255,0.03)',
                                  color: step.channel === key ? cfg.color : 'var(--text-secondary)',
                                  fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                  transition: 'all 0.2s'
                                }}
                              >
                                {cfg.emoji} {cfg.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Message */}
                        <div>
                          <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Message Template</label>
                          <textarea
                            className="form-input"
                            value={step.message}
                            onChange={e => updateStep(step.id, 'message', e.target.value)}
                            placeholder={step.channel === 'human' ? 'Task instructions for the agent...' : 'Enter message template... Use {{name}}, {{company}}'}
                            rows={2}
                            style={{ width: '100%', fontSize: 11, resize: 'none' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={addStep}
                  style={{ width: '100%', marginTop: 10, padding: '9px', borderRadius: 8, border: '1px dashed rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.06)', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Plus size={13} /> Add Step
                </button>
              </div>

              {/* Global Settings */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 12 }}>
                  Global Settings
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Exclude leads with active conversations</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Skip leads currently in open chats</div>
                    </div>
                    <button
                      onClick={() => setExcludeActive(v => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: excludeActive ? '#10b981' : 'var(--text-secondary)' }}
                    >
                      {excludeActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Max recovery attempts</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Stop after N total sequences</div>
                    </div>
                    <input
                      type="number"
                      className="form-input"
                      value={maxAttempts}
                      min={1}
                      max={10}
                      onChange={e => setMaxAttempts(parseInt(e.target.value) || 1)}
                      style={{ width: 70, fontSize: 13, textAlign: 'center' }}
                    />
                  </div>
                </div>
              </div>

              {/* Save */}
              <button onClick={saveWorkflow} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13, padding: '11px' }}>
                <Save size={14} /> Save Workflow
              </button>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={24} color="#6366f1" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>No Workflow Selected</div>
                <div style={{ fontSize: 12 }}>Click a workflow to edit it, or create a new one.</div>
              </div>
              <button onClick={openNew} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <Plus size={13} /> Create Workflow
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── WorkflowCard Sub-component ── */
interface WorkflowCardProps {
  workflow: Workflow;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, isSelected, onSelect, onToggle, onDuplicate, onEdit }) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '18px', cursor: 'pointer',
        border: isSelected ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border-glass)',
        background: isSelected ? 'rgba(99,102,241,0.07)' : undefined,
        transition: 'all 0.2s'
      }}
      onClick={onSelect}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{workflow.name}</span>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700,
              background: workflow.active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)',
              color: workflow.active ? '#10b981' : 'var(--text-secondary)'
            }}>
              {workflow.active ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{workflow.description}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggle(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: workflow.active ? '#10b981' : 'var(--text-secondary)', flexShrink: 0, marginLeft: 10 }}
        >
          {workflow.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#6366f1' }}>{workflow.triggered}</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Triggered</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>{workflow.recovered}</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Recovered</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>{workflow.successRate}%</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Success Rate</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${workflow.successRate}%`, background: `linear-gradient(90deg, #6366f1, #10b981)`, borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* Horizontal Step Timeline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {workflow.steps.map((step, i) => {
          const chCfg = CHANNEL_CONFIG[step.channel];
          return (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, minWidth: 30 }}>
                  <div style={{ flex: 1, height: 1, borderTop: '2px dashed rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', whiteSpace: 'nowrap', padding: '0 4px' }}>
                    {step.delayValue}{step.delayUnit === 'hours' ? 'h' : 'd'}
                  </span>
                  <div style={{ flex: 1, height: 1, borderTop: '2px dashed rgba(255,255,255,0.1)' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `${chCfg.color}22`,
                  border: `2px solid ${chCfg.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 10px ${chCfg.color}22`
                }}>
                  <span style={{ fontSize: 15 }}>{chCfg.emoji}</span>
                </div>
                <span style={{ fontSize: 9, color: chCfg.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{chCfg.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
        <button onClick={onEdit} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '6px 12px' }}>
          <Edit3 size={11} /> Edit
        </button>
        <button onClick={onDuplicate} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '6px 12px' }}>
          <Copy size={11} /> Duplicate
        </button>
      </div>
    </div>
  );
};
