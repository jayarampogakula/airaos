import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Phone, Search, Filter, ChevronLeft, ChevronRight,
  Brain, BookOpen, Bot, Zap, Calendar, Flag, Download, CheckCircle2,
  AlertTriangle, XCircle, Clock, User, ArrowRight, Play, Pause,
  MessageCircle, Mic, Globe, Info, Star, BarChart2
} from 'lucide-react';

interface ConversationReplayViewProps {
  conversations?: Array<{
    id: string;
    contactId: string;
    channel: string;
    messages: any[];
    status: string;
  }>;
  tenantId?: string;
}

type StepType = 'customer' | 'ai_reasoning' | 'knowledge' | 'ai_response' | 'action';

interface ReplayStep {
  id: number;
  type: StepType;
  timestamp: string;
  title: string;
  content: string;
  meta?: Record<string, string | number>;
}

interface ConversationEntry {
  id: string;
  contactName: string;
  channel: 'chat' | 'whatsapp' | 'voice' | 'email' | 'sms';
  duration: string;
  outcome: 'resolved' | 'escalated' | 'abandoned';
  date: string;
  avatar: string;
  steps: ReplayStep[];
  score: { autonomous: number; total: number; actions: number; avgConfidence: number };
}

const MOCK_CONVERSATIONS: ConversationEntry[] = [
  {
    id: 'c1',
    contactName: 'Rahul Mehta',
    channel: 'chat',
    duration: '4m 12s',
    outcome: 'resolved',
    date: 'Today 2:34 PM',
    avatar: 'RM',
    score: { autonomous: 7, total: 8, actions: 1, avgConfidence: 92 },
    steps: [
      {
        id: 1, type: 'customer', timestamp: '2:34:01 PM',
        title: 'Customer Message',
        content: 'Hi, I need info about your premium plan',
      },
      {
        id: 2, type: 'ai_reasoning', timestamp: '2:34:03 PM',
        title: 'AI Reasoning',
        content: 'Customer is asking about pricing. Intent: HIGH. Checking knowledge base...',
        meta: { intent: 'PRICING_INQUIRY', confidence: '97%', signal: 'HIGH' }
      },
      {
        id: 3, type: 'knowledge', timestamp: '2:34:04 PM',
        title: 'Knowledge Lookup',
        content: "Premium plan is \u20b97,999/mo with unlimited contacts, 5 AI agents, voice + WhatsApp channels, and priority support.",
        meta: { source: 'Pricing Guide.pdf', confidence: '94%', chunks: '3' }
      },
      {
        id: 4, type: 'ai_response', timestamp: '2:34:05 PM',
        title: 'AI Response',
        content: 'Our Premium/Scale plan is \u20b97,999/mo and includes unlimited contacts, 5 AI employees, voice + WhatsApp channels, CRM pipeline, and priority 24/7 support. Would you like a detailed comparison?',
      },
      {
        id: 5, type: 'action', timestamp: '2:34:06 PM',
        title: 'Action Triggered \u2014 Create CRM Lead',
        content: 'Contact Rahul Mehta added to CRM pipeline with HIGH intent tag.',
        meta: { contact: 'Rahul Mehta', score: '+15 points', pipeline: 'Hot Leads' }
      },
      {
        id: 6, type: 'customer', timestamp: '2:37:00 PM',
        title: 'Customer Message',
        content: 'Can I get a demo?',
      },
      {
        id: 7, type: 'ai_reasoning', timestamp: '2:37:02 PM',
        title: 'AI Reasoning',
        content: 'Demo request detected. High intent signal. Routing to booking flow for calendar appointment scheduling.',
        meta: { intent: 'DEMO_REQUEST', confidence: '99%', signal: 'VERY HIGH' }
      },
      {
        id: 8, type: 'action', timestamp: '2:37:04 PM',
        title: 'Action Triggered \u2014 Book Appointment',
        content: 'Demo session scheduled via calendar booking flow.',
        meta: { slot: 'Tomorrow 3:00 PM', agent: 'Sarah K.', duration: '30 min' }
      },
    ]
  },
  {
    id: 'c2',
    contactName: 'Priya Sharma',
    channel: 'whatsapp',
    duration: '8m 45s',
    outcome: 'resolved',
    date: 'Today 11:20 AM',
    avatar: 'PS',
    score: { autonomous: 6, total: 7, actions: 2, avgConfidence: 89 },
    steps: [
      { id: 1, type: 'customer', timestamp: '11:20:01 AM', title: 'Customer Message', content: 'Hello, I want to upgrade my plan from Basic to Pro.' },
      { id: 2, type: 'ai_reasoning', timestamp: '11:20:03 AM', title: 'AI Reasoning', content: 'Plan upgrade request identified. Fetching current subscription details and upgrade options.', meta: { intent: 'UPGRADE_REQUEST', confidence: '96%' } },
      { id: 3, type: 'knowledge', timestamp: '11:20:05 AM', title: 'Knowledge Lookup', content: 'Pro plan at \u20b93,999/mo includes 2 AI agents, 1,000 monthly chats, WhatsApp integration, and CRM access.', meta: { source: 'Plans Overview.pdf', confidence: '91%', chunks: '2' } },
      { id: 4, type: 'ai_response', timestamp: '11:20:06 AM', title: 'AI Response', content: 'Great choice! The Pro plan at \u20b93,999/mo gives you 2 AI employees, 1,000 monthly conversations, WhatsApp, and full CRM. Shall I process the upgrade now?' },
      { id: 5, type: 'customer', timestamp: '11:24:00 AM', title: 'Customer Message', content: 'Yes please go ahead.' },
      { id: 6, type: 'action', timestamp: '11:24:02 AM', title: 'Action Triggered \u2014 Process Upgrade', content: 'Subscription upgraded from Basic to Pro. Payment link sent.', meta: { plan: 'Pro \u20b93,999/mo', payment: 'Link sent', status: 'Pending' } },
      { id: 7, type: 'action', timestamp: '11:28:00 AM', title: 'Action Triggered \u2014 Send Confirmation', content: 'Upgrade confirmation and onboarding guide sent via WhatsApp.', meta: { channel: 'WhatsApp', template: 'Upgrade Confirmed' } },
    ]
  },
  {
    id: 'c3',
    contactName: 'Amit Singh',
    channel: 'voice',
    duration: '12m 30s',
    outcome: 'escalated',
    date: 'Yesterday',
    avatar: 'AS',
    score: { autonomous: 4, total: 8, actions: 1, avgConfidence: 74 },
    steps: [
      { id: 1, type: 'customer', timestamp: '3:10:01 PM', title: 'Customer Message', content: 'I have been billed incorrectly. This is the third time!' },
      { id: 2, type: 'ai_reasoning', timestamp: '3:10:03 PM', title: 'AI Reasoning', content: 'Billing dispute detected. Negative sentiment. Fetching account history and invoice records.', meta: { intent: 'BILLING_DISPUTE', confidence: '88%', sentiment: 'NEGATIVE' } },
      { id: 3, type: 'knowledge', timestamp: '3:10:05 PM', title: 'Knowledge Lookup', content: 'Billing dispute resolution policy: escalate after 2 prior attempts. Check refund eligibility criteria.', meta: { source: 'Support Handbook.pdf', confidence: '78%', chunks: '4' } },
      { id: 4, type: 'ai_response', timestamp: '3:10:07 PM', title: 'AI Response', content: 'I sincerely apologize for the repeated billing issue. I am pulling up your account details and invoices right now. Can you confirm your account email?' },
      { id: 5, type: 'customer', timestamp: '3:14:00 PM', title: 'Customer Message', content: 'amit.singh@example.com \u2014 I want a full refund!' },
      { id: 6, type: 'ai_reasoning', timestamp: '3:14:02 PM', title: 'AI Reasoning', content: 'Refund demand with escalation history. Confidence too low for autonomous refund processing. Escalation required.', meta: { escalation_reason: 'Repeat dispute + refund demand', threshold: 'LOW' } },
      { id: 7, type: 'action', timestamp: '3:14:05 PM', title: 'Action Triggered \u2014 Escalate to Human', content: 'Conversation escalated to billing specialist team.', meta: { team: 'Billing Support', priority: 'HIGH', ticket: '#BLG-4421' } },
      { id: 8, type: 'ai_response', timestamp: '3:14:06 PM', title: 'AI Response', content: 'I have escalated your case to our billing specialist with high priority. You will receive a callback within 2 hours. Ticket: #BLG-4421.' },
    ]
  },
  {
    id: 'c4',
    contactName: 'Neha Kapoor',
    channel: 'chat',
    duration: '3m 05s',
    outcome: 'resolved',
    date: 'Yesterday',
    avatar: 'NK',
    score: { autonomous: 5, total: 5, actions: 1, avgConfidence: 95 },
    steps: [
      { id: 1, type: 'customer', timestamp: '10:05:01 AM', title: 'Customer Message', content: 'What are your working hours?' },
      { id: 2, type: 'ai_reasoning', timestamp: '10:05:02 AM', title: 'AI Reasoning', content: 'Simple FAQ query about support hours. High confidence match in knowledge base.', meta: { intent: 'FAQ_HOURS', confidence: '99%' } },
      { id: 3, type: 'knowledge', timestamp: '10:05:03 AM', title: 'Knowledge Lookup', content: 'Support available 24/7 via AI. Human agents: Mon\u2013Sat 9 AM\u20137 PM IST.', meta: { source: 'Company FAQ.pdf', confidence: '99%', chunks: '1' } },
      { id: 4, type: 'ai_response', timestamp: '10:05:04 AM', title: 'AI Response', content: 'Our AI support is available 24/7! Human agents are available Monday\u2013Saturday, 9 AM to 7 PM IST. Is there anything else I can help with?' },
      { id: 5, type: 'action', timestamp: '10:08:00 AM', title: 'Action Triggered \u2014 Mark Resolved', content: 'Conversation auto-closed after 3m idle with positive sentiment.', meta: { resolution: 'Auto-closed', CSAT: 'Positive' } },
    ]
  },
  {
    id: 'c5',
    contactName: 'Vikram Joshi',
    channel: 'whatsapp',
    duration: '6m 18s',
    outcome: 'escalated',
    date: 'Jun 13',
    avatar: 'VJ',
    score: { autonomous: 4, total: 6, actions: 0, avgConfidence: 71 },
    steps: [
      { id: 1, type: 'customer', timestamp: '4:22:01 PM', title: 'Customer Message', content: 'How do I integrate your API with Salesforce?' },
      { id: 2, type: 'ai_reasoning', timestamp: '4:22:03 PM', title: 'AI Reasoning', content: 'Technical integration query. Checking API docs and integration guides.', meta: { intent: 'TECHNICAL_QUERY', confidence: '82%' } },
      { id: 3, type: 'knowledge', timestamp: '4:22:05 PM', title: 'Knowledge Lookup', content: 'Salesforce integration via Zapier or REST API. OAuth 2.0 authentication required.', meta: { source: 'API Docs v2.pdf', confidence: '76%', chunks: '5' } },
      { id: 4, type: 'ai_response', timestamp: '4:22:07 PM', title: 'AI Response', content: 'You can integrate via Zapier (no-code) or our REST API with OAuth 2.0. Want me to send you the detailed integration guide?' },
      { id: 5, type: 'customer', timestamp: '4:25:00 PM', title: 'Customer Message', content: 'Yes but I need custom field mapping, can your team help set it up?' },
      { id: 6, type: 'action', timestamp: '4:28:10 PM', title: 'Action Triggered \u2014 Escalate to Solutions', content: 'Complex custom integration request escalated to solutions team.', meta: { team: 'Solutions Engineering', priority: 'MEDIUM' } },
    ]
  },
  {
    id: 'c6',
    contactName: 'Sunita Rao',
    channel: 'email',
    duration: '2m 40s',
    outcome: 'abandoned',
    date: 'Jun 13',
    avatar: 'SR',
    score: { autonomous: 2, total: 4, actions: 0, avgConfidence: 61 },
    steps: [
      { id: 1, type: 'customer', timestamp: '9:01:01 AM', title: 'Customer Message', content: 'I need to cancel my subscription.' },
      { id: 2, type: 'ai_reasoning', timestamp: '9:01:03 AM', title: 'AI Reasoning', content: 'Cancellation intent detected. High churn risk. Fetching retention offers.', meta: { intent: 'CANCELLATION', confidence: '94%', risk: 'HIGH_CHURN' } },
      { id: 3, type: 'ai_response', timestamp: '9:01:05 AM', title: 'AI Response', content: 'We are sorry to hear that! Before you go, we have a special 30% discount offer for the next 3 months. Would you like to explore that?' },
      { id: 4, type: 'customer', timestamp: '9:03:30 AM', title: 'Customer Message', content: '(No response \u2014 session abandoned)' },
    ]
  },
  {
    id: 'c7',
    contactName: 'Arjun Patel',
    channel: 'voice',
    duration: '5m 55s',
    outcome: 'resolved',
    date: 'Jun 12',
    avatar: 'AP',
    score: { autonomous: 6, total: 6, actions: 2, avgConfidence: 93 },
    steps: [
      { id: 1, type: 'customer', timestamp: '1:15:01 PM', title: 'Customer Message', content: 'I want to add two more AI agents to my plan.' },
      { id: 2, type: 'ai_reasoning', timestamp: '1:15:03 PM', title: 'AI Reasoning', content: 'Upsell opportunity: Agent add-on request. Checking current plan and add-on pricing.', meta: { intent: 'ADD_ON_PURCHASE', confidence: '98%' } },
      { id: 3, type: 'knowledge', timestamp: '1:15:05 PM', title: 'Knowledge Lookup', content: 'Additional AI agents: \u20b9999/agent/mo. Discount available for 3+ agents.', meta: { source: 'Add-ons Pricing.pdf', confidence: '97%', chunks: '2' } },
      { id: 4, type: 'ai_response', timestamp: '1:15:06 PM', title: 'AI Response', content: 'Adding 2 AI agents is \u20b91,998/mo. Good news \u2014 if you add 3 agents, you get a 10% discount! Shall I process 2 or 3 additional agents?' },
      { id: 5, type: 'customer', timestamp: '1:18:00 PM', title: 'Customer Message', content: 'Let us go with 3 to get the discount.' },
      { id: 6, type: 'action', timestamp: '1:18:03 PM', title: 'Action Triggered \u2014 Add Agents', content: '3 AI agents added to plan with 10% bundle discount applied.', meta: { agents: '3', discount: '10%', amount: '\u20b92,697/mo' } },
    ]
  },
  {
    id: 'c8',
    contactName: 'Meera Iyer',
    channel: 'sms',
    duration: '1m 30s',
    outcome: 'resolved',
    date: 'Jun 12',
    avatar: 'MI',
    score: { autonomous: 3, total: 3, actions: 1, avgConfidence: 96 },
    steps: [
      { id: 1, type: 'customer', timestamp: '6:45:01 PM', title: 'Customer Message', content: 'Confirm my appointment tomorrow at 2PM please.' },
      { id: 2, type: 'ai_reasoning', timestamp: '6:45:02 PM', title: 'AI Reasoning', content: 'Appointment confirmation request. Looking up scheduled appointments for Meera Iyer.', meta: { intent: 'APPT_CONFIRM', confidence: '99%' } },
      { id: 3, type: 'action', timestamp: '6:45:04 PM', title: 'Action Triggered \u2014 Confirm Appointment', content: 'Appointment confirmed. Reminder SMS sent.', meta: { slot: 'Tomorrow 2:00 PM', agent: 'Rajesh', status: 'Confirmed' } },
    ]
  },
];

const channelConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  chat: { icon: <Globe size={14} />, label: 'Website Chat', color: '#3b82f6' },
  whatsapp: { icon: <MessageCircle size={14} />, label: 'WhatsApp', color: '#25d366' },
  voice: { icon: <Mic size={14} />, label: 'Voice', color: '#f59e0b' },
  email: { icon: <MessageSquare size={14} />, label: 'Email', color: '#8b5cf6' },
  sms: { icon: <MessageSquare size={14} />, label: 'SMS', color: '#06b6d4' },
};

const outcomeConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  resolved: { label: 'Resolved', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: <CheckCircle2 size={12} /> },
  escalated: { label: 'Escalated', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: <AlertTriangle size={12} /> },
  abandoned: { label: 'Abandoned', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: <XCircle size={12} /> },
};

const stepConfig: Record<StepType, { label: string; icon: React.ReactNode; borderColor: string; bgColor: string; iconBg: string }> = {
  customer: {
    label: 'Customer Message', icon: <MessageSquare size={15} />,
    borderColor: '#3b82f6', bgColor: 'rgba(59,130,246,0.06)', iconBg: 'rgba(59,130,246,0.2)'
  },
  ai_reasoning: {
    label: 'AI Reasoning', icon: <Brain size={15} />,
    borderColor: '#8b5cf6', bgColor: 'rgba(139,92,246,0.06)', iconBg: 'rgba(139,92,246,0.2)'
  },
  knowledge: {
    label: 'Knowledge Lookup', icon: <BookOpen size={15} />,
    borderColor: '#10b981', bgColor: 'rgba(16,185,129,0.06)', iconBg: 'rgba(16,185,129,0.2)'
  },
  ai_response: {
    label: 'AI Response', icon: <Bot size={15} />,
    borderColor: '#a855f7', bgColor: 'rgba(168,85,247,0.06)', iconBg: 'rgba(168,85,247,0.2)'
  },
  action: {
    label: 'Action Triggered', icon: <Zap size={15} />,
    borderColor: '#f59e0b', bgColor: 'rgba(245,158,11,0.06)', iconBg: 'rgba(245,158,11,0.2)'
  },
};

export const ConversationReplayView: React.FC<ConversationReplayViewProps> = ({ conversations, tenantId }) => {
  const [selectedId, setSelectedId] = useState<string>('c1');
  const [filter, setFilter] = useState<'all' | 'resolved' | 'escalated' | 'abandoned'>('all');
  const [search, setSearch] = useState('');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const selected = MOCK_CONVERSATIONS.find(c => c.id === selectedId) ?? MOCK_CONVERSATIONS[0];

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStep(prev => {
          if (prev >= selected.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, selected.steps.length]);

  const filtered = MOCK_CONVERSATIONS.filter(c => {
    const matchFilter = filter === 'all' || c.outcome === filter;
    const matchSearch = c.contactName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handlePrev = () => setActiveStep(s => Math.max(0, s - 1));
  const handleNext = () => setActiveStep(s => Math.min(selected.steps.length - 1, s + 1));

  const handleFilterDate = () => {
    alert("Date filtering simulated: Conversations from the last 7 days are active.");
  };

  const handleViewAnalytics = () => {
    alert("Navigating to Analytics Center...");
  };

  const handleFlagReview = () => {
    alert(`Conversation with ${selected.contactName} flagged for administrator manual review.`);
  };

  const handleExportReplay = () => {
    alert(`Replay data for ${selected.contactName} exported to JSON format successfully.`);
  };

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setActiveStep(0);
    setIsPlaying(false);
  };

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={18} color="#fff" />
            </div>
            Conversation Replay Center
          </h1>
          <p className="view-subtitle" style={{ marginLeft: 48 }}>Step-by-step AI reasoning, knowledge lookups, and action logs</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleFilterDate} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Filter size={14} /> Filter Date
          </button>
          <button onClick={handleViewAnalytics} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <BarChart2 size={14} /> Analytics
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', flex: 1 }}>

        {/* LEFT: Conversation List */}
        <div className="glass-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: 'calc(100vh - 200px)' }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-glass)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Conversations{' '}
              <span style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: 4, padding: '1px 6px', fontSize: 11, marginLeft: 6 }}>{filtered.length}</span>
            </p>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                className="form-input"
                placeholder="Search contacts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 30, height: 34, fontSize: 12, width: '100%' }}
              />
            </div>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'resolved', 'escalated', 'abandoned'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: filter === f ? (f === 'all' ? 'rgba(99,102,241,0.25)' : f === 'resolved' ? 'rgba(16,185,129,0.2)' : f === 'escalated' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)') : 'transparent',
                  color: filter === f ? (f === 'all' ? '#818cf8' : f === 'resolved' ? '#10b981' : f === 'escalated' ? '#f59e0b' : '#ef4444') : 'var(--text-secondary)',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(conv => {
              const ch = channelConfig[conv.channel];
              const oc = outcomeConfig[conv.outcome];
              const isSelected = conv.id === selectedId;
              return (
                <div key={conv.id} onClick={() => selectConversation(conv.id)} style={{
                  padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: isSelected ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>
                      {conv.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{conv.contactName}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{conv.date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: ch.color, fontSize: 11, fontWeight: 500 }}>
                          {ch.icon} {ch.label}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)', fontSize: 11 }}>
                          <Clock size={10} /> {conv.duration}
                        </span>
                      </div>
                      <div style={{ marginTop: 5 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: oc.bg, color: oc.color }}>
                          {oc.icon} {oc.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Replay Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Replay Header */}
          <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#fff' }}>
                  {selected.avatar}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{selected.contactName}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: channelConfig[selected.channel].color, fontSize: 12, fontWeight: 500 }}>
                      {channelConfig[selected.channel].icon} {channelConfig[selected.channel].label}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>·</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{selected.date}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)', fontSize: 12 }}>
                      <Clock size={11} /> {selected.duration}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: outcomeConfig[selected.outcome].bg, color: outcomeConfig[selected.outcome].color }}>
                      {outcomeConfig[selected.outcome].icon} {outcomeConfig[selected.outcome].label}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleFlagReview} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px' }}>
                  <Flag size={13} /> Flag for Review
                </button>
                <button onClick={handleExportReplay} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px' }}>
                  <Download size={13} /> Export Replay
                </button>
              </div>
            </div>

            {/* Step progress bar */}
            <div style={{ marginTop: 14, display: 'flex', gap: 4, alignItems: 'center' }}>
              {selected.steps.map((step, i) => {
                const cfg = stepConfig[step.type];
                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStep(i)}
                    style={{ flex: 1, height: 4, borderRadius: 2, background: i <= activeStep ? cfg.borderColor : 'rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 0.3s' }}
                    title={`Step ${i + 1}: ${cfg.label}`}
                  />
                );
              })}
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 8, flexShrink: 0 }}>{activeStep + 1}/{selected.steps.length}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card" style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(100vh - 360px)', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Play size={14} color="#6366f1" /> Replay Timeline
              </span>
              <button
                onClick={() => setIsPlaying(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)', background: isPlaying ? 'rgba(99,102,241,0.2)' : 'transparent', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {isPlaying ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Auto-Play</>}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
              {/* Connector line */}
              <div style={{ position: 'absolute', left: 20, top: 40, bottom: 20, width: 2, background: 'linear-gradient(to bottom, rgba(99,102,241,0.4), rgba(139,92,246,0.1))', borderRadius: 2 }} />
              {selected.steps.map((step, i) => {
                const cfg = stepConfig[step.type];
                const isActive = i === activeStep;
                const isPast = i < activeStep;
                return (
                  <div key={step.id} onClick={() => setActiveStep(i)} style={{ display: 'flex', gap: 14, cursor: 'pointer', opacity: (isPast || isActive) ? 1 : 0.5, transition: 'all 0.3s' }}>
                    {/* Step icon */}
                    <div style={{ flexShrink: 0, width: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: isActive ? cfg.borderColor : isPast ? cfg.iconBg : 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `2px solid ${isActive ? cfg.borderColor : 'transparent'}`,
                        boxShadow: isActive ? `0 0 16px ${cfg.borderColor}44` : 'none',
                        transition: 'all 0.3s',
                        zIndex: 1, position: 'relative'
                      }}>
                        <span style={{ color: isActive ? '#fff' : cfg.borderColor }}>{cfg.icon}</span>
                      </div>
                    </div>
                    {/* Step content */}
                    <div style={{
                      flex: 1, padding: '12px 16px', borderRadius: 10,
                      background: isActive ? cfg.bgColor : 'rgba(255,255,255,0.025)',
                      borderLeft: `3px solid ${isActive ? cfg.borderColor : 'rgba(255,255,255,0.06)'}`,
                      border: isActive ? `1px solid ${cfg.borderColor}33` : '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.3s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${cfg.borderColor}22`, color: cfg.borderColor }}>
                            STEP {step.id}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{step.title}</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={10} /> {step.timestamp}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, fontStyle: step.type === 'customer' ? 'italic' : 'normal' }}>
                        {step.type === 'customer' ? `"${step.content}"` : step.content}
                      </p>
                      {step.meta && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {Object.entries(step.meta).map(([k, v]) => (
                            <span key={k} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                              {k}: <strong style={{ color: cfg.borderColor }}>{v}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigator + Bottom Score Bar */}
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Prev/Next */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handlePrev} disabled={activeStep === 0} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '8px 16px', opacity: activeStep === 0 ? 0.4 : 1 }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button onClick={handleNext} disabled={activeStep === selected.steps.length - 1} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '8px 16px', opacity: activeStep === selected.steps.length - 1 ? 0.4 : 1 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
            {/* Score summary */}
            <div className="glass-card" style={{ flex: 1, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={14} color="#f59e0b" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>AI handled {selected.score.autonomous}/{selected.score.total} steps autonomously</strong>
                  {' '}&middot;{' '}{selected.score.actions} action{selected.score.actions !== 1 ? 's' : ''} triggered
                  {' '}&middot;{' '}Knowledge confidence avg:{' '}
                  <strong style={{ color: '#10b981' }}>{selected.score.avgConfidence}%</strong>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#6366f1' }}>{Math.round((selected.score.autonomous / selected.score.total) * 100)}%</div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Autonomous</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981' }}>{selected.score.avgConfidence}%</div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>AI Confidence</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>{selected.score.actions}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Actions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
