import React, { useState } from 'react';
import {
  UserPlus, Globe, Eye, MessageSquare, MessageCircle, Phone,
  Calendar, Mail, Trophy, ChevronDown, ChevronUp, Clock, Filter, Sparkles
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  channel?: string;
  actor: 'ai' | 'human' | 'system' | 'customer';
  actorName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface CustomerTimelineViewProps {
  contactId?: string;
  contactName?: string;
  events?: TimelineEvent[];
  isEmbedded?: boolean; // if true, no page header, more compact
}

const DEFAULT_MOCK_EVENTS: TimelineEvent[] = [
  {
    id: 'e1',
    type: 'lead_created',
    title: 'Lead Created',
    description: 'Lead created via Facebook Lead Ads',
    channel: 'facebook',
    actor: 'ai',
    actorName: 'Attribution Engine',
    timestamp: '5 days ago',
    metadata: { campaign: 'FB_SummerSale_2026', adSet: 'Homeowners_25-45', adName: 'Video_Testimonial_v3' }
  },
  {
    id: 'e2',
    type: 'website_visit',
    title: 'Website Visit',
    description: 'Visited homepage from Facebook ad',
    channel: 'website',
    actor: 'system',
    timestamp: '4 days ago',
    metadata: { ip: '192.168.1.54', browser: 'Chrome on macOS', referrer: 'facebook.com' }
  },
  {
    id: 'e3',
    type: 'page_viewed',
    title: 'Page Viewed',
    description: 'Viewed /pricing (3 min 45 sec on page)',
    channel: 'website',
    actor: 'system',
    timestamp: '4 days ago',
    metadata: { duration: '3m 45s', scrollDepth: '80%' }
  },
  {
    id: 'e4',
    type: 'chat_started',
    title: 'Chat Started',
    description: 'Started website chat with Sales Agent Marcus',
    channel: 'chat',
    actor: 'ai',
    actorName: 'Marcus (AI)',
    timestamp: '4 days ago',
    metadata: { duration: '4m 12s', initialMsg: 'Hi, I need info about your premium plan' }
  },
  {
    id: 'e5',
    type: 'whatsapp_message',
    title: 'WhatsApp Follow-up Sent',
    description: 'WhatsApp follow-up sent automatically by AI',
    channel: 'whatsapp',
    actor: 'ai',
    actorName: 'Follow-up Agent',
    timestamp: '3 days ago',
    metadata: { status: 'delivered', template: 'pricing_followup_v2' }
  },
  {
    id: 'e6',
    type: 'voice_call',
    title: 'Outbound Voice Call Attempt',
    description: 'Outbound voice call attempt made by Voice Agent',
    channel: 'voice',
    actor: 'ai',
    actorName: 'Voice Agent',
    timestamp: '2 days ago',
    metadata: { outcome: 'no_answer', duration: '0s' }
  },
  {
    id: 'e7',
    type: 'appointment_booked',
    title: 'Appointment Booked',
    description: 'Demo booked for Jun 20 at 3:00 PM',
    channel: 'calendar',
    actor: 'customer',
    timestamp: '1 day ago',
    metadata: { slot: 'Jun 20, 3:00 PM', type: 'Product Demo', duration: '30 mins' }
  },
  {
    id: 'e8',
    type: 'email_sent',
    title: 'Proposal Email Sent',
    description: 'Proposal email sent by Sales Rep',
    channel: 'email',
    actor: 'human',
    actorName: 'Sarah Jenkins',
    timestamp: '2 hours ago',
    metadata: { subject: 'Custom Proposal for Scale Plan', attachments: 'Proposal_TechNova.pdf' }
  },
  {
    id: 'e9',
    type: 'deal_won',
    title: 'Deal Closed Won',
    description: 'Deal closed — ₹2.4L — Scale Plan',
    channel: 'crm',
    actor: 'human',
    actorName: 'Sarah Jenkins',
    timestamp: '30 mins ago',
    metadata: { value: '₹2,40,000', plan: 'Scale Premium', cycle: '5 days' }
  }
];

export const CustomerTimelineView: React.FC<CustomerTimelineViewProps> = ({
  contactId,
  contactName = 'Rahul Mehta',
  events = DEFAULT_MOCK_EVENTS,
  isEmbedded = false
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ai' | 'human'>('all');
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const toggleExpand = (id: string) => {
    setExpandedEvents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getEventStyle = (type: string) => {
    const config: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
      lead_created: { color: '#6366f1', bg: 'rgba(99,102,241,0.15)', icon: <UserPlus size={14} color="#6366f1" /> },
      website_visit: { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', icon: <Globe size={14} color="#06b6d4" /> },
      page_viewed: { color: '#475569', bg: 'rgba(71,85,105,0.15)', icon: <Eye size={14} color="#94a3b8" /> },
      chat_started: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: <MessageSquare size={14} color="#3b82f6" /> },
      whatsapp_message: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: <MessageCircle size={14} color="#22c55e" /> },
      voice_call: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: <Phone size={14} color="#f59e0b" /> },
      appointment_booked: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: <Calendar size={14} color="#10b981" /> },
      email_sent: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', icon: <Mail size={14} color="#8b5cf6" /> },
      deal_won: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', icon: <Trophy size={14} color="#fbbf24" /> }
    };
    return config[type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: <Sparkles size={14} color="#94a3b8" /> };
  };

  const getActorBadgeStyle = (actor: string) => {
    const config: Record<string, { color: string; bg: string }> = {
      ai: { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
      human: { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
      system: { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
      customer: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)' }
    };
    return config[actor] || { color: '#94a3b8', bg: 'rgba(255,255,255,0.05)' };
  };

  // Filter logic
  const filteredEvents = events.filter(e => {
    // Channel filter
    if (channelFilter !== 'all' && e.channel !== channelFilter) return false;

    // Actor filter
    if (activeFilter === 'ai') return e.actor === 'ai';
    if (activeFilter === 'human') return e.actor === 'human';
    return true;
  });

  return (
    <div style={{
      padding: isEmbedded ? '0' : '28px 32px',
      background: isEmbedded ? 'transparent' : 'var(--bg-primary, #0b0f19)',
      fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      
      {/* Header if not embedded */}
      {!isEmbedded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: '#fff' }}>
              Customer Journey
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', marginTop: 8 }}>
              Interactive timeline for <b>{contactName}</b>
            </p>
          </div>
          <span style={{ fontSize: 12, color: 'var(--primary-color, #6366f1)', background: 'rgba(99,102,241,0.12)', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
            {events.length} events total
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 3 }}>
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'ai', label: '🤖 AI Activity' },
            { id: 'human', label: '👤 Human Activity' }
          ].map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id as any)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              background: activeFilter === f.id ? 'var(--primary-color, #6366f1)' : 'transparent',
              color: activeFilter === f.id ? '#fff' : '#64748b'
            }}>{f.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'pointer', color: '#64748b', fontSize: 12 }}>
          <Filter size={12} />
          <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} style={{ background: 'none', border: 'none', color: 'inherit', fontSize: 'inherit', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
            <option value="all">All Channels</option>
            <option value="facebook">Facebook</option>
            <option value="website">Website</option>
            <option value="chat">Website Chat</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="voice">Voice Call</option>
            <option value="calendar">Calendar</option>
            <option value="email">Email</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      {filteredEvents.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>No events match the active filters.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          {/* Main vertical line */}
          <div style={{ position: 'absolute', left: 28, top: 10, bottom: 10, width: 2, background: 'linear-gradient(180deg, rgba(99,102,241,0.3) 0%, rgba(255,255,255,0.02) 100%)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredEvents.map(e => {
              const style = getEventStyle(e.type);
              const abStyle = getActorBadgeStyle(e.actor);
              const isExpanded = !!expandedEvents[e.id];

              return (
                <div key={e.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                  {/* Connector icon */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#0b0f19', border: `2px solid ${style.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', left: -10, top: 4, zIndex: 2
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: style.color }} />
                  </div>

                  {/* Icon Circle */}
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', background: style.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 16
                  }}>{style.icon}</div>

                  {/* Card panel */}
                  <div style={{
                    flex: 1, background: 'var(--bg-glass, rgba(255,255,255,0.03))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))',
                    borderRadius: 14, padding: 14, cursor: e.metadata ? 'pointer' : 'default'
                  }} onClick={() => e.metadata && toggleExpand(e.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>{e.title}</h4>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{e.description}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {e.channel && (
                          <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: '#64748b', padding: '2px 8px', borderRadius: 4, textTransform: 'capitalize' }}>
                            {e.channel}
                          </span>
                        )}
                        <span style={{ fontSize: 10, background: abStyle.bg, color: abStyle.color, padding: '2px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                          {e.actorName || e.actor}
                        </span>
                        <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> {e.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Metadata expand area */}
                    {e.metadata && isExpanded && (
                      <div style={{
                        marginTop: 12, padding: 10, background: 'rgba(0,0,0,0.15)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)',
                        fontSize: 11, fontFamily: 'monospace', color: '#cbd5e1'
                      }} onClick={ev => ev.stopPropagation()}>
                        {Object.entries(e.metadata).map(([k, v]) => (
                          <div key={k} style={{ marginBottom: 4 }}>
                            <span style={{ color: 'var(--primary-color, #6366f1)' }}>{k}:</span> {v.toString()}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Indicator to show metadata exists */}
                    {e.metadata && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: 10, color: '#475569', alignItems: 'center', gap: 2 }}>
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        {isExpanded ? 'Hide metadata' : 'Click to see details'}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
export default CustomerTimelineView;
