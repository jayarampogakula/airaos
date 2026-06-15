import React, { useState } from 'react';
import {
  Mail, MessageCircle, MessageSquare, Plus, Edit3, Copy, Trash2, Sparkles,
  Users, Send, BarChart2, Calendar, Clock, AlertCircle, Check, ChevronRight, Play
} from 'lucide-react';

interface MarketingCampaignViewProps {
  tenantId?: string;
  contacts?: any[];
}

interface CampaignCard {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp' | 'sms';
  status: 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Scheduled';
  audienceSize: number;
  sentCount: number;
  openRate?: number;
  replyRate?: number;
  updatedAt: string;
}

const MOCK_CAMPAIGNS: CampaignCard[] = [
  { id: '1', name: 'May Product Launch', channel: 'email', status: 'Active', audienceSize: 1240, sentCount: 1198, openRate: 42, replyRate: 15, updatedAt: 'Today 10:15 AM' },
  { id: '2', name: 'Demo Follow-up', channel: 'whatsapp', status: 'Active', audienceSize: 89, sentCount: 89, openRate: 98, replyRate: 67, updatedAt: 'Yesterday 4:30 PM' },
  { id: '3', name: 'Pricing Announcement', channel: 'sms', status: 'Completed', audienceSize: 456, sentCount: 456, openRate: 85, replyRate: 8, updatedAt: '2 days ago' },
  { id: '4', name: 'Webinar Invite', channel: 'email', status: 'Draft', audienceSize: 2100, sentCount: 0, updatedAt: '3 days ago' },
  { id: '5', name: 'Re-engagement Q2', channel: 'whatsapp', status: 'Scheduled', audienceSize: 340, sentCount: 0, updatedAt: '4 days ago' }
];

export const MarketingCampaignView: React.FC<MarketingCampaignViewProps> = ({ tenantId, contacts }) => {
  const [campaigns, setCampaigns] = useState<CampaignCard[]>(MOCK_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignCard>(MOCK_CAMPAIGNS[0]);
  const [activeChannelTab, setActiveChannelTab] = useState<'all' | 'email' | 'whatsapp' | 'sms'>('all');
  const [editorTab, setEditorTab] = useState<'compose' | 'audience' | 'triggers' | 'analytics'>('compose');

  // Form states
  const [campaignName, setCampaignName] = useState(selectedCampaign.name);
  const [campaignChannel, setCampaignChannel] = useState(selectedCampaign.channel);
  const [subject, setSubject] = useState('Exclusive Access: Learn about our new features');
  const [message, setMessage] = useState('Hi {contact_name},\n\nWe wanted to share some exciting updates about {company}. Since your lead score is {lead_score}, you qualify for early access to our Sales OS module!\n\nReply to book a chat.');
  const [audienceType, setAudienceType] = useState<'all' | 'tag' | 'score' | 'stage'>('all');
  const [scoreFilter, setScoreFilter] = useState(70);
  const [triggerType, setTriggerType] = useState<'immediate' | 'scheduled' | 'behavior'>('immediate');
  const [behaviorEvent, setBehaviorEvent] = useState('visited_pricing');

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (activeChannelTab === 'all') return true;
    return c.channel === activeChannelTab;
  });

  const handleSelectCampaign = (c: CampaignCard) => {
    setSelectedCampaign(c);
    setCampaignName(c.name);
    setCampaignChannel(c.channel);
    if (c.status === 'Draft') {
      setEditorTab('compose');
    } else {
      setEditorTab('analytics');
    }
  };

  const handleGenerateAI = () => {
    setMessage(`Hello {contact_name}!\n\nWe noticed you are doing amazing work at {company}. We have prepared a customized AI-sales sequence that can boost your conversions.\n\nLet's connect soon!\n\nBest,\nSales Team`);
  };

  const getChannelIcon = (ch: 'email' | 'whatsapp' | 'sms') => {
    if (ch === 'email') return <Mail size={14} color="#3b82f6" />;
    if (ch === 'whatsapp') return <MessageCircle size={14} color="#22c55e" />;
    return <MessageSquare size={14} color="#f59e0b" />;
  };

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
              <Send size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #fff 40%, var(--primary-color, #6366f1))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Marketing Campaigns
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Reach your audience across Email, WhatsApp, and SMS with AI-powered messaging
              </p>
            </div>
          </div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'linear-gradient(135deg, var(--primary-color, #6366f1), var(--accent-color, #06b6d4))', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* ── Channel Switcher Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'all', label: 'All Channels', icon: null },
          { id: 'email', label: '📧 Email', icon: null },
          { id: 'whatsapp', label: '💬 WhatsApp', icon: null },
          { id: 'sms', label: '📱 SMS', icon: null }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveChannelTab(t.id as any)} style={{
            padding: '8px 16px', borderRadius: 10, border: '1px solid',
            borderColor: activeChannelTab === t.id ? 'var(--primary-color, #6366f1)' : 'var(--border-glass, rgba(255,255,255,0.08))',
            background: activeChannelTab === t.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
            color: activeChannelTab === t.id ? '#fff' : '#64748b',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Main Layout Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
        
        {/* LEFT COLUMN: Campaign List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredCampaigns.map(c => {
            const isSelected = selectedCampaign.id === c.id;
            return (
              <div key={c.id} onClick={() => handleSelectCampaign(c)} style={{
                background: isSelected ? 'rgba(99,102,241,0.08)' : 'var(--bg-glass, rgba(255,255,255,0.03))',
                border: `1px solid ${isSelected ? 'var(--primary-color, #6366f1)' : 'var(--border-glass, rgba(255,255,255,0.08))'}`,
                borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    {getChannelIcon(c.channel)} {c.channel}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: c.status === 'Active' ? 'rgba(34,197,94,0.15)' : c.status === 'Draft' ? 'rgba(107,114,128,0.15)' : 'rgba(99,102,241,0.15)',
                    color: c.status === 'Active' ? '#22c55e' : c.status === 'Draft' ? '#cbd5e1' : '#a78bfa'
                  }}>{c.status}</span>
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#fff' }}>{c.name}</h4>
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 12, marginBottom: 8 }}>
                  <span>Reach: <b>{c.audienceSize}</b></span>
                  {c.sentCount > 0 && <span>Sent: <b>{c.sentCount}</b></span>}
                </div>
                {c.sentCount > 0 && (
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#22c55e', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 8 }}>
                    {c.openRate && <span>Open rate: <b>{c.openRate}%</b></span>}
                    {c.replyRate && <span>Reply rate: <b>{c.replyRate}%</b></span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Campaign Editor */}
        <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.03))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, padding: 24 }}>
          
          {/* Editor Tabs */}
          <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, marginBottom: 20 }}>
            {[
              { id: 'compose', label: 'Compose' },
              { id: 'audience', label: 'Audience Segment' },
              { id: 'triggers', label: 'Triggers' },
              { id: 'analytics', label: 'Campaign Analytics', hidden: selectedCampaign.status === 'Draft' }
            ].map(tab => {
              if (tab.hidden) return null;
              return (
                <button key={tab.id} onClick={() => setEditorTab(tab.id as any)} style={{
                  background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                  color: editorTab === tab.id ? 'var(--primary-color, #6366f1)' : '#64748b',
                  borderBottom: editorTab === tab.id ? '2px solid var(--primary-color, #6366f1)' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}>{tab.label}</button>
              );
            })}
          </div>

          {/* Tab content 1: Compose */}
          {editorTab === 'compose' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>Campaign Name</label>
                  <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>Channel</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['email', 'whatsapp', 'sms'].map(ch => (
                      <button key={ch} onClick={() => setCampaignChannel(ch as any)} style={{
                        flex: 1, padding: 10, borderRadius: 10, border: '1px solid',
                        borderColor: campaignChannel === ch ? 'var(--primary-color, #6366f1)' : 'rgba(255,255,255,0.08)',
                        background: campaignChannel === ch ? 'rgba(99,102,241,0.1)' : 'transparent',
                        color: campaignChannel === ch ? '#fff' : '#64748b',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                      }}>{ch.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                {campaignChannel === 'email' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>Subject Line</label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>Message Composer</label>
                    <button onClick={handleGenerateAI} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--accent-color, #06b6d4)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <Sparkles size={12} /> Generate with AI
                    </button>
                  </div>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {['{contact_name}', '{company}', '{lead_score}'].map(tok => (
                      <button key={tok} onClick={() => setMessage(prev => prev + tok)} style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', border: 'none', padding: '3px 8px', borderRadius: 4, color: '#cbd5e1', cursor: 'pointer' }}>{tok}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 20 }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Live Preview</div>
                {campaignChannel === 'whatsapp' || campaignChannel === 'sms' ? (
                  /* Phone mockup */
                  <div style={{ width: '100%', maxWidth: 260, border: '6px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 10, background: '#075e54', minHeight: 300, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: '#128c7e', padding: 8, borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 700, marginBottom: 10 }}>GatiDesk AI OS</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                      <div style={{ background: '#dcf8c6', borderRadius: 10, padding: 8, color: '#303030', fontSize: 11, maxWidth: '85%', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                        {message.replace('{contact_name}', 'Rahul').replace('{company}', 'TechNova').replace('{lead_score}', '89')}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Email mockup */
                  <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, background: 'rgba(0,0,0,0.2)', minHeight: 280 }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8, marginBottom: 10, fontSize: 12 }}>
                      <div style={{ color: '#64748b' }}>Subject: <span style={{ color: '#fff', fontWeight: 600 }}>{subject}</span></div>
                    </div>
                    <div style={{ fontSize: 12, color: '#cbd5e1', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                      {message.replace('{contact_name}', 'Rahul').replace('{company}', 'TechNova').replace('{lead_score}', '89')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab content 2: Audience Segment */}
          {editorTab === 'audience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>Target Segment</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { id: 'all', label: 'All Contacts' },
                    { id: 'score', label: 'By Lead Score' },
                    { id: 'stage', label: 'By Stage' }
                  ].map(aud => (
                    <button key={aud.id} onClick={() => setAudienceType(aud.id as any)} style={{
                      flex: 1, padding: 10, borderRadius: 10, border: '1px solid',
                      borderColor: audienceType === aud.id ? 'var(--primary-color, #6366f1)' : 'rgba(255,255,255,0.08)',
                      background: audienceType === aud.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: audienceType === aud.id ? '#fff' : '#64748b',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                    }}>{aud.label}</button>
                  ))}
                </div>
              </div>
              {audienceType === 'score' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>Minimum Lead Score: {scoreFilter}</label>
                  <input type="range" min="0" max="100" value={scoreFilter} onChange={e => setScoreFilter(parseInt(e.target.value))} style={{ width: '100%' }} />
                </div>
              )}
              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#cbd5e1' }}>Estimated reach with current filters:</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary-color, #6366f1)', fontFamily: '"Space Grotesk", sans-serif' }}>
                  {audienceType === 'score' ? '184 contacts' : '1,240 contacts'}
                </span>
              </div>
            </div>
          )}

          {/* Tab content 3: Triggers */}
          {editorTab === 'triggers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>Send Settings</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { id: 'immediate', label: 'Send Immediately' },
                    { id: 'scheduled', label: 'Scheduled Time (One-off)' },
                    { id: 'behavior', label: 'Behavioral-based trigger (Automation)' }
                  ].map(trig => (
                    <button key={trig.id} onClick={() => setTriggerType(trig.id as any)} style={{
                      padding: 12, borderRadius: 10, border: '1px solid', textAlign: 'left',
                      borderColor: triggerType === trig.id ? 'var(--primary-color, #6366f1)' : 'rgba(255,255,255,0.08)',
                      background: triggerType === trig.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: triggerType === trig.id ? '#fff' : '#64748b',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                    }}>{trig.label}</button>
                  ))}
                </div>
              </div>
              {triggerType === 'behavior' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>Behavioral Trigger Event</label>
                  <select value={behaviorEvent} onChange={e => setBehaviorEvent(e.target.value)} style={{ width: '100%', padding: 10, background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', outline: 'none' }}>
                    <option value="visited_pricing">Visitor views pricing page 3+ times</option>
                    <option value="no_reply_24h">No reply from contact in 24 hours</option>
                    <option value="appointment_noshow">Appointment booked but lead is a no-show</option>
                    <option value="deal_stalled">Deal remains in Proposal stage for 7+ days</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Tab content 4: Analytics */}
          {editorTab === 'analytics' && (
            <div>
              <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#fff' }}>Performance Funnel Analysis</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { stage: 'Sent', count: selectedCampaign.sentCount, pct: 100 },
                  { stage: 'Delivered', count: Math.round(selectedCampaign.sentCount * 0.98), pct: 98 },
                  { stage: 'Opened', count: Math.round(selectedCampaign.sentCount * (selectedCampaign.openRate || 0) / 100), pct: selectedCampaign.openRate || 0 },
                  { stage: 'Replied', count: Math.round(selectedCampaign.sentCount * (selectedCampaign.replyRate || 0) / 100), pct: selectedCampaign.replyRate || 0 }
                ].map(fun => (
                  <div key={fun.stage} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#cbd5e1' }}>
                      <span>{fun.stage}</span>
                      <span><b>{fun.count}</b> ({fun.pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${fun.pct}%`, background: 'var(--primary-color, #6366f1)', borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            <button style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--border-glass, rgba(255,255,255,0.1))', borderRadius: 10, color: '#cbd5e1', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Save Draft</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'linear-gradient(135deg, var(--primary-color, #6366f1), var(--accent-color, #06b6d4))', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Play size={13} fill="#fff" /> Launch Campaign
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
