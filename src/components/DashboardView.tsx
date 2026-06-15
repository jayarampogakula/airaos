import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Users, CheckCircle2, PhoneCall, RefreshCw, 
  ExternalLink, Calendar, GitBranch, ArrowUpRight, Send, MessageSquare, Bot, Sparkles,
  AlertCircle, IndianRupee, Zap, Eye
} from 'lucide-react';
import { Tenant, Contact, Appointment } from '../types';

interface DashboardViewProps {
  tenant: Tenant;
  contacts: Contact[];
  appointments: Appointment[];
  deals: any[];
  chatsUsed: number;
  platformSupportBot: {
    enabled: boolean;
    name: string;
    avatar: string;
    welcomeMessage: string;
    prompt: string;
  };
  usageLimits: {
    conversationsLimit: number;
    conversationsUsed: number;
    voiceLimit: number;
    voiceUsed: number;
    websitesLimit: number;
    websitesUsed: number;
  };
  conversations: any[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tenant,
  contacts,
  appointments,
  deals,
  chatsUsed,
  platformSupportBot,
  usageLimits,
  conversations
}) => {
  const pipelineValue = deals.reduce((acc, d) => acc + d.value, 0);
  const activeAppsCount = appointments.filter(a => a.status === 'scheduled').length;
  const conversionRate = contacts.length > 0 
    ? ((activeAppsCount / contacts.length) * 100).toFixed(1)
    : '0.0';

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  const getBaseDomain = () => {
    const host = window.location.host;
    const hostname = window.location.hostname;
    const cleaned = hostname.replace(/^(app|dashboard|www|admin)\./i, '');
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return host.replace(/^(app|dashboard|www|admin)\./i, '');
    }
    return cleaned;
  };

  const getDisplayDomain = () => {
    const localDomainType = localStorage.getItem(`tenant_domain_type_${tenant.id}`);
    const localCustomDomain = localStorage.getItem(`tenant_custom_domain_${tenant.id}`);
    
    if (localDomainType === 'custom' && localCustomDomain) {
      return localCustomDomain;
    }
    
    if (tenant.domain && !tenant.domain.endsWith('gatidesk.com')) {
      return tenant.domain;
    }
    
    if (tenant.websiteConfig?.isWebsiteGenerated) {
      return tenant.domain.replace(/\.?gatidesk\.com$/, `.${getBaseDomain()}`);
    }
    
    return '';
  };

  // Initialize welcome message when bot configuration is loaded
  useEffect(() => {
    setChatMessages([
      {
        sender: 'bot',
        text: platformSupportBot?.welcomeMessage || 'Hi! I am the GatiDesk Platform Assistant. How can I help you integrate SIP, Twilio, configure BYO, or understand our packages and rates today?'
      }
    ]);
  }, [platformSupportBot]);

  const scrollToBottom = (onlyIfMultiple = false) => {
    if (onlyIfMultiple && chatMessages.length <= 1) {
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    if (chatMessages.length > 1) {
      scrollToBottom();
    }
  }, [chatMessages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    if (!textToSend) {
      setChatInput('');
    }

    // Add user message
    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agentId: 'platform-support',
          tenantId: tenant.id,
          history: chatMessages.map(msg => ({
            sender: msg.sender === 'user' ? 'customer' : 'ai',
            text: msg.text
          }))
        })
      });

      setIsTyping(false);
      if (response.ok) {
        const data = await response.json();
        if (data && data.text) {
          setChatMessages(prev => [...prev, { sender: 'bot', text: data.text }]);
        } else {
          setChatMessages(prev => [...prev, { sender: 'bot', text: 'I am having trouble answering right now. Please check back later.' }]);
        }
      } else {
        setChatMessages(prev => [...prev, { sender: 'bot', text: 'Connection error. Please try again.' }]);
      }
    } catch (err) {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Something went wrong. Please check your network connection.' }]);
    }
  };

  const [weekOffset, setWeekOffset] = useState(0);

  const getMondayOfOffset = (year: number, month: number, offset: number) => {
    const baseDate = new Date(year, month, 1);
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(year, month, diff);
    monday.setDate(monday.getDate() + offset * 7);
    return monday;
  };

  const getWeekRangeString = (year: number, month: number, offset: number) => {
    const monday = getMondayOfOffset(year, month, offset);
    const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);

    const mondayMonth = monday.toLocaleDateString(undefined, { month: 'short' });
    const sundayMonth = sunday.toLocaleDateString(undefined, { month: 'short' });
    const mondayYear = monday.getFullYear();
    const sundayYear = sunday.getFullYear();

    if (mondayYear === sundayYear) {
      if (mondayMonth === sundayMonth) {
        return `${mondayMonth} ${mondayYear} (${monday.getDate()} - ${sunday.getDate()})`;
      }
      return `${mondayMonth} - ${sundayMonth} ${mondayYear} (${monday.getDate()} - ${sunday.getDate()})`;
    }
    return `${mondayMonth} ${mondayYear} - ${sundayMonth} ${sundayYear} (${monday.getDate()} - ${sunday.getDate()})`;
  };

  const getDayDate = (year: number, month: number, offset: number, dayIndex: number) => {
    const monday = getMondayOfOffset(year, month, offset);
    const date = new Date(monday.getTime());
    date.setDate(monday.getDate() + dayIndex);
    return date;
  };

  const getRealTrafficDataForOffset = (year: number, month: number, offset: number) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return days.map((day, idx) => {
      const dayDate = getDayDate(year, month, offset, idx);
      const startOfDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59);
      
      let chatCount = 0;
      let voiceCount = 0;
      
      (conversations || []).forEach(conv => {
        const hasActivityOnDay = conv.messages?.some((msg: any) => {
          if (!msg.timestamp) return false;
          const msgDate = new Date(msg.timestamp);
          return msgDate >= startOfDay && msgDate <= endOfDay;
        });
        
        if (hasActivityOnDay) {
          if (conv.channel === 'voice') {
            voiceCount++;
          } else {
            chatCount++;
          }
        }
      });
      
      return {
        day,
        date: dayDate.getDate(),
        chats: chatCount,
        calls: voiceCount
      };
    });
  };

  const trafficData = getRealTrafficDataForOffset(selectedYear, selectedMonth, weekOffset);
  const maxChatsOrCalls = Math.max(...trafficData.map(t => Math.max(t.chats, t.calls)), 5);
  const maxTraffic = Math.ceil(maxChatsOrCalls / 5) * 5;

  return (
    <div className="animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="view-title">{tenant.name} Overview</h2>
          <p className="view-subtitle">Dashboard control console & live execution metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {getDisplayDomain() ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Domain: <a href={`https://${getDisplayDomain()}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>{getDisplayDomain()} <ExternalLink size={10} style={{ display: 'inline' }} /></a>
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Domain: Not Configured
            </span>
          )}
          <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={12} /> Sync Data
          </button>
        </div>
      </div>

      {/* Recovery Alert Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, marginBottom: 24, fontSize: 13, color: '#f87171' }}>
        <AlertCircle size={15} />
        <span>⚠️ <b>Missed Lead Recovery Alert:</b> 12 high-intent leads went cold this week. The AI Recovery sequence has been initiated for 4 of them. Click <b>Missed Lead Recovery</b> to review.</span>
      </div>

      {/* AI Daily Briefing & Live Visitor Count Widget */}
      <div className="grid-cols-12" style={{ marginBottom: '24px', gap: '20px' }}>
        {/* AI Daily Briefing */}
        <div className="col-span-8 glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)', borderColor: 'rgba(99, 102, 241, 0.2)', padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '10px', color: 'var(--primary-color)' }}>
            <Bot size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>AI Daily Briefing</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              ✨ <b>3 hot leads</b> are active now on the site. <b>2 missed follow-ups</b> were auto-recovered by WhatsApp agent. Total pipeline value generated this week stands at <b>₹12.4L</b>, up 18% MoM. Recommend prioritizing <b>Rahul Mehta</b> (intent score: 89) for immediate callback.
            </p>
          </div>
        </div>

        {/* Live Visitor Count Widget */}
        <div className="col-span-4 glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Real-time Traffic</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
          </div>
          <div style={{ margin: '10px 0' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>
              12 Live
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Visitors on site now</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            View Visitor Intelligence &rarr;
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-12" style={{ marginBottom: '24px' }}>
        <div className="col-span-3 glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Revenue Generated</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', fontFamily: 'Space Grotesk, sans-serif', color: '#22c55e' }}>
              ₹12.4L
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <TrendingUp size={12} /> +18% vs last month
            </span>
          </div>
          <div className="icon-box" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)' }}><IndianRupee size={20} /></div>
        </div>

        <div className="col-span-3 glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>CRM Contacts</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', fontFamily: 'Space Grotesk, sans-serif' }}>
              {contacts.length}
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <TrendingUp size={12} /> Total leads in system
            </span>
          </div>
          <div className="icon-box" style={{ color: 'var(--accent-color)' }}><Users size={20} /></div>
        </div>

        <div className="col-span-3 glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Live Visitor Count</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', fontFamily: 'Space Grotesk, sans-serif', color: 'var(--accent-color)' }}>
              12
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
              Pulsing live visitors
            </span>
          </div>
          <div className="icon-box" style={{ color: 'var(--accent-color)', background: 'rgba(6,182,212,0.1)' }}><Eye size={20} /></div>
        </div>

        <div className="col-span-3 glass-card animate-pulse-glow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(99, 102, 241, 0.03)', borderColor: 'rgba(99,102,241,0.2)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Conversions</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', fontFamily: 'Space Grotesk, sans-serif', color: 'var(--primary-color)' }}>
              {activeAppsCount}
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-color)', display: 'inline-block' }}></span>
              Rate: {conversionRate}%
            </span>
          </div>
          <div className="icon-box" style={{ color: 'var(--primary-color)', backgroundColor: 'var(--primary-glow)' }}><PhoneCall size={20} /></div>
        </div>
      </div>

      {/* Main Section: Chart and System Status */}
      <div className="grid-cols-12" style={{ marginBottom: '24px' }}>
        {/* CSS Chart */}
        <div className="col-span-8 glass-card" style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Weekly Traffic Distribution</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => {
                    setSelectedMonth(Number(e.target.value));
                    setWeekOffset(0);
                  }}
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', padding: '2px 6px', fontSize: '0.7rem', outline: 'none', cursor: 'pointer' }}
                >
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                    <option key={idx} value={idx} style={{ background: '#090d16', color: 'white' }}>{m}</option>
                  ))}
                </select>

                <select 
                  value={selectedYear} 
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setWeekOffset(0);
                  }}
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', padding: '2px 6px', fontSize: '0.7rem', outline: 'none', cursor: 'pointer' }}
                >
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y} style={{ background: '#090d16', color: 'white' }}>{y}</option>
                  ))}
                </select>

                <button 
                  onClick={() => setWeekOffset(prev => prev - 1)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer', padding: '2px 8px', fontSize: '0.7rem' }}
                >
                  &larr; Prev
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {getWeekRangeString(selectedYear, selectedMonth, weekOffset)}
                </span>
                <button 
                  onClick={() => setWeekOffset(prev => prev + 1)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer', padding: '2px 8px', fontSize: '0.7rem' }}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--primary-color)', borderRadius: '2px' }}></span> Chat interactions
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '2px' }}></span> Voice calls
              </span>
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '10px 20px 20px 20px', borderBottom: '1px solid var(--border-glass)' }}>
            {trafficData.map((d, i) => {
              const totalHeight = 200; // max chart height in pixels
              const chatHeight = (d.chats / maxTraffic) * totalHeight;
              const callHeight = (d.calls / maxTraffic) * totalHeight;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                  <div style={{ position: 'relative', width: '28px', height: `${totalHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '2px' }}>
                    {/* Tooltip on hover */}
                    <div className="chart-tooltip" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ height: `${callHeight}px`, width: '100%', background: 'var(--accent-color)', borderRadius: '4px' }}></div>
                      <div style={{ height: `${chatHeight}px`, width: '100%', background: 'var(--primary-color)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{d.day}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Stacked Resource Limits */}
        <div className="col-span-4" style={{ height: '360px' }}>
          {/* Resource Limits Card */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>Resource Limits</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Current billing allocation</span>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{tenant.plan || 'Growth'}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '5px', fontSize: '0.75rem' }}>
                  <span>Chats & Conversations</span>
                  <span>{usageLimits.conversationsUsed} / {usageLimits.conversationsLimit}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${Math.min(100, (usageLimits.conversationsUsed / usageLimits.conversationsLimit) * 100)}%`,
                      background: 'var(--primary-color)' 
                    }} 
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '5px', fontSize: '0.75rem' }}>
                  <span>Voice Calling (Mins)</span>
                  <span>{usageLimits.voiceUsed} / {usageLimits.voiceLimit}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${Math.min(100, (usageLimits.voiceUsed / usageLimits.voiceLimit) * 100)}%`,
                      background: 'var(--accent-color)' 
                    }} 
                  />
                </div>
              </div>

              {usageLimits.websitesLimit !== undefined && usageLimits.websitesLimit > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '5px', fontSize: '0.75rem' }}>
                    <span>Web Widgets Active</span>
                    <span>{usageLimits.websitesUsed ?? 0} / {usageLimits.websitesLimit}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min(100, ((usageLimits.websitesUsed ?? 0) / usageLimits.websitesLimit) * 100)}%`,
                        background: 'linear-gradient(90deg, var(--primary-color) 0%, var(--accent-color) 100%)' 
                      }} 
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '12px', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Renews dynamically monthly</span>
              <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>System Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Upcoming Appointments and Activity */}
      <div className="grid-cols-12" style={{ gap: '20px' }}>
        <div className={platformSupportBot?.enabled ? "col-span-4 glass-card" : "col-span-6 glass-card"} style={{ minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Scheduled Appointments</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {appointments.length} scheduled
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', maxHeight: '280px' }}>
            {appointments.map((a) => {
              const contactName = a.contactId === 'c-101' ? 'John Doe' : 'Sarah Jenkins';
              const date = new Date(a.dateTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
              const time = new Date(a.dateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ padding: '6px', background: 'var(--primary-glow)', borderRadius: '6px', color: 'var(--primary-color)' }}>
                      <Calendar size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{a.type} - {contactName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{a.location ? a.location.substring(0, 20) : ''}...</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '500' }}>{date}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {platformSupportBot?.enabled && (
          <div className="col-span-4 glass-card" style={{ minHeight: '360px', display: 'flex', flexDirection: 'column', padding: '16px', background: 'rgba(99, 102, 241, 0.02)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{platformSupportBot.avatar || '🤖'}</span>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {platformSupportBot.name || 'Platform Assistant'}
                  </h4>
                  <span style={{ fontSize: '0.65rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--success-color)', display: 'inline-block' }}></span>
                    Online Guide
                  </span>
                </div>
              </div>
              <Sparkles size={14} className="animate-pulse" style={{ color: 'var(--primary-color)' }} />
            </div>

            {/* Chat Messages Log */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', border: '1px solid var(--border-glass)', marginBottom: '8px' }}>
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.sender === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    borderBottomRightRadius: msg.sender === 'user' ? '2px' : '8px',
                    borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '8px',
                    fontSize: '0.72rem',
                    lineHeight: '1.35',
                    border: msg.sender === 'bot' ? '1px solid var(--border-glass)' : 'none',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px', borderBottomLeftRadius: '2px', border: '1px solid var(--border-glass)', display: 'flex', gap: '3px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-secondary)', display: 'inline-block' }} className="animate-bounce"></span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-secondary)', display: 'inline-block', animationDelay: '0.2s' }} className="animate-bounce"></span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-secondary)', display: 'inline-block', animationDelay: '0.4s' }} className="animate-bounce"></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* suggestion chips */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '6px' }}>
              <button
                type="button"
                onClick={() => handleSendMessage('How to integrate Twilio?')}
                style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '4px 8px', fontSize: '0.65rem', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                🔑 Twilio
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('How to configure BYO SIP Server?')}
                style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '4px 8px', fontSize: '0.65rem', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                🌐 SIP Carrier
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('What are the packages and overage rates?')}
                style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '4px 8px', fontSize: '0.65rem', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                💰 Plan Rates
              </button>
            </div>

            {/* Input entry */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: '6px' }}
            >
              <input
                type="text"
                placeholder="Ask about SIP, Twilio, BYO..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', color: 'var(--text-primary)', outline: 'none' }}
              />
              <button
                type="submit"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', background: 'var(--primary-color)', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        )}

        <div className={platformSupportBot?.enabled ? "col-span-4 glass-card" : "col-span-6 glass-card"} style={{ minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Active Workflow Logs</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              Live executions
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', maxHeight: '280px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Workflow Run Succeeded: Lead Capture & CRM Sync</span>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Trigger: Chat Lead Capture • Created deal worth ${tenant.settings?.defaultLeadValue !== undefined ? tenant.settings.defaultLeadValue : 450} in CRM</div>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>3m ago</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Scheduler Event Triggered: Appointment Reminder Loop</span>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Sent SMS & WhatsApp reminders to Sarah Jenkins for Penthouse Tour</div>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>45m ago</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning-color)' }}></div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Human Escalation SLA Pinged</span>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Conversation conv-3 with Michael Chen transferred to developer support</div>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>2h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
