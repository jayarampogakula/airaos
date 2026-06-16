import React, { useState, useEffect } from 'react';
import {
  Brain, TrendingUp, TrendingDown, CheckCircle2, XCircle,
  Users, Flame, Thermometer, Snowflake, Star, Play,
  MessageSquare, Calendar, UserCheck, ChevronRight,
  RefreshCw, Filter, BarChart2, Zap, Clock, Activity,
  ArrowUpRight, ArrowDownRight, Phone, Mail, Building2
} from 'lucide-react';

interface LeadScoringViewProps {
  contacts?: Array<{
    id: string;
    name: string;
    company: string;
    email: string;
    leadScore?: number;
    leadCategory?: string;
    source?: string;
  }>;
  tenantId?: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  score: number;
  category: 'Sales Ready' | 'Hot' | 'Warm' | 'Cold';
  source: string;
  lastActivity: string;
  avatar: string;
  phone: string;
  scoreFactors: Array<{ label: string; points: number; positive: boolean }>;
  trendData: number[];
}

const MOCK_LEADS: Lead[] = [
  {
    id: '1', name: 'Rahul Mehta', company: 'TechNova Pvt Ltd', email: 'rahul@technova.io',
    score: 91, category: 'Sales Ready', source: 'Website', lastActivity: '5 mins ago',
    avatar: 'RM', phone: '+91 98765 43210',
    scoreFactors: [
      { label: 'Requested Demo (High Intent Signal)', points: 25, positive: true },
      { label: 'Mentioned Budget ₹5L+', points: 20, positive: true },
      { label: 'Decision Maker (CEO)', points: 15, positive: true },
      { label: 'Visited Pricing Page 3x', points: 18, positive: true },
      { label: 'Replied within 5 minutes', points: 12, positive: true },
      { label: 'No appointment booked yet', points: -7, positive: false },
      { label: 'Single channel engagement only', points: -3, positive: false },
    ],
    trendData: [45, 52, 60, 68, 75, 85, 91],
  },
  {
    id: '2', name: 'Priya Sharma', company: 'Growthify Inc', email: 'priya@growthify.com',
    score: 87, category: 'Hot', source: 'LinkedIn', lastActivity: '12 mins ago',
    avatar: 'PS', phone: '+91 97654 32109',
    scoreFactors: [
      { label: 'Visited Pricing Page 5x', points: 20, positive: true },
      { label: 'Opened 6 Emails', points: 18, positive: true },
      { label: 'Clicked CTA 3 times', points: 15, positive: true },
      { label: 'VP Sales Title', points: 12, positive: true },
      { label: 'Budget Indicated', points: 18, positive: true },
      { label: 'No direct conversation yet', points: -10, positive: false },
      { label: 'Unsubscribed once before', points: -5, positive: false },
    ],
    trendData: [30, 44, 55, 62, 70, 80, 87],
  },
  {
    id: '3', name: 'Amit Singh', company: 'ScaleUp SaaS', email: 'amit@scaleupsaas.in',
    score: 72, category: 'Warm', source: 'Referral', lastActivity: '1 hr ago',
    avatar: 'AS', phone: '+91 96543 21098',
    scoreFactors: [
      { label: 'Referral from existing customer', points: 22, positive: true },
      { label: 'Engaged with demo video', points: 18, positive: true },
      { label: 'Mid-level title (Manager)', points: 8, positive: true },
      { label: 'No budget mentioned', points: -10, positive: false },
      { label: 'Only 1 touchpoint', points: -8, positive: false },
    ],
    trendData: [20, 30, 42, 51, 60, 68, 72],
  },
  {
    id: '4', name: 'Sunita Patel', company: 'BizBoost Corp', email: 'sunita@bizboost.co',
    score: 68, category: 'Warm', source: 'Google Ads', lastActivity: '2 hrs ago',
    avatar: 'SP', phone: '+91 95432 10987',
    scoreFactors: [
      { label: 'Clicked 2 Ads', points: 15, positive: true },
      { label: 'Downloaded Whitepaper', points: 20, positive: true },
      { label: 'Opened 4 Emails', points: 12, positive: true },
      { label: 'No pricing page visit', points: -12, positive: false },
      { label: 'No response to last message', points: -8, positive: false },
    ],
    trendData: [15, 22, 35, 48, 55, 63, 68],
  },
  {
    id: '5', name: 'Vikram Reddy', company: 'Nexus Systems', email: 'vikram@nexus.io',
    score: 61, category: 'Warm', source: 'Email Campaign', lastActivity: '3 hrs ago',
    avatar: 'VR', phone: '+91 94321 09876',
    scoreFactors: [
      { label: 'Replied to cold email', points: 18, positive: true },
      { label: 'Mid-size company (50-200)', points: 12, positive: true },
      { label: 'Director-level title', points: 10, positive: true },
      { label: 'No demo interest shown', points: -15, positive: false },
      { label: 'Slow response time', points: -8, positive: false },
    ],
    trendData: [18, 27, 35, 43, 50, 57, 61],
  },
  {
    id: '6', name: 'Meera Joshi', company: 'CloudPilot', email: 'meera@cloudpilot.dev',
    score: 48, category: 'Cold', source: 'Webinar', lastActivity: '1 day ago',
    avatar: 'MJ', phone: '+91 93210 98765',
    scoreFactors: [
      { label: 'Attended webinar', points: 15, positive: true },
      { label: 'Filled registration form', points: 10, positive: true },
      { label: 'No follow-up engagement', points: -20, positive: false },
      { label: 'Junior title (Executive)', points: -8, positive: false },
    ],
    trendData: [10, 18, 25, 32, 40, 45, 48],
  },
  {
    id: '7', name: 'Arjun Kapoor', company: 'DataSprint', email: 'arjun@datasprint.in',
    score: 39, category: 'Cold', source: 'Instagram', lastActivity: '2 days ago',
    avatar: 'AK', phone: '+91 92109 87654',
    scoreFactors: [
      { label: 'Liked social post', points: 8, positive: true },
      { label: 'Visited website once', points: 10, positive: true },
      { label: 'No email interaction', points: -20, positive: false },
      { label: 'No direct intent shown', points: -15, positive: false },
    ],
    trendData: [5, 12, 18, 25, 30, 36, 39],
  },
  {
    id: '8', name: 'Kavya Nair', company: 'InnovateTech', email: 'kavya@innovate.tech',
    score: 83, category: 'Hot', source: 'WhatsApp', lastActivity: '20 mins ago',
    avatar: 'KN', phone: '+91 91098 76543',
    scoreFactors: [
      { label: 'Initiated WhatsApp conversation', points: 22, positive: true },
      { label: 'Asked specific product questions', points: 20, positive: true },
      { label: 'Mentioned competitor comparison', points: 15, positive: true },
      { label: 'CTO title', points: 14, positive: true },
      { label: 'No budget discussed yet', points: -8, positive: false },
      { label: 'Weekend engagement pattern', points: -5, positive: false },
    ],
    trendData: [25, 38, 50, 60, 70, 78, 83],
  },
  {
    id: '9', name: 'Rohan Das', company: 'Momentum Labs', email: 'rohan@momentumlabs.co',
    score: 29, category: 'Cold', source: 'Facebook',  lastActivity: '5 days ago',
    avatar: 'RD', phone: '+91 90987 65432',
    scoreFactors: [
      { label: 'Clicked ad once', points: 8, positive: true },
      { label: 'Visited landing page', points: 5, positive: true },
      { label: 'Bounced quickly', points: -15, positive: false },
      { label: 'No form fill', points: -18, positive: false },
    ],
    trendData: [5, 8, 12, 18, 22, 26, 29],
  },
  {
    id: '10', name: 'Tanvi Gupta', company: 'RapidScale', email: 'tanvi@rapidscale.io',
    score: 76, category: 'Hot', source: 'Demo Request', lastActivity: '45 mins ago',
    avatar: 'TG', phone: '+91 89876 54321',
    scoreFactors: [
      { label: 'Requested Product Demo', points: 25, positive: true },
      { label: 'Visited Pricing Page 2x', points: 15, positive: true },
      { label: 'Operations Head Title', points: 10, positive: true },
      { label: 'Engaged with case study', points: 12, positive: true },
      { label: 'No budget clarity', points: -10, positive: false },
      { label: 'Low email open rate', points: -7, positive: false },
    ],
    trendData: [20, 32, 44, 55, 63, 70, 76],
  },
];

const categoryConfig = {
  'Sales Ready': { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', icon: Star, label: 'Sales Ready' },
  'Hot': { color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', icon: Flame, label: 'Hot' },
  'Warm': { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', icon: Thermometer, label: 'Warm' },
  'Cold': { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', icon: Snowflake, label: 'Cold' },
};

const getScoreGradient = (score: number) => {
  if (score >= 80) return { start: '#10b981', end: '#06d6a0' };
  if (score >= 60) return { start: '#f97316', end: '#fb923c' };
  if (score >= 40) return { start: '#f59e0b', end: '#fbbf24' };
  return { start: '#60a5fa', end: '#818cf8' };
};

export const LeadScoringView: React.FC<LeadScoringViewProps> = ({ contacts, tenantId }) => {
  const [selectedLead, setSelectedLead] = useState<Lead>(MOCK_LEADS[0]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [isBulkScoring, setIsBulkScoring] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkComplete, setBulkComplete] = useState(false);

  const filters = ['All', 'Sales Ready', 'Hot', 'Warm', 'Cold'];

  const filteredLeads = activeFilter === 'All'
    ? MOCK_LEADS
    : MOCK_LEADS.filter(l => l.category === activeFilter);

  const sortedLeads = [...filteredLeads].sort((a, b) => b.score - a.score);

  const stats = {
    total: 247,
    salesReady: 34,
    hot: 67,
    warm: 89,
    cold: 57,
  };

  const handleBulkScoring = () => {
    if (isBulkScoring) return;
    setIsBulkScoring(true);
    setBulkProgress(0);
    setBulkComplete(false);
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.floor(Math.random() * 12) + 5;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setBulkProgress(100);
        setTimeout(() => {
          setIsBulkScoring(false);
          setBulkComplete(true);
          setTimeout(() => setBulkComplete(false), 3000);
        }, 500);
      } else {
        setBulkProgress(prog);
      }
    }, 180);
  };

  const grad = getScoreGradient(selectedLead.score);
  const circumference = 2 * Math.PI * 54;
  const strokeDash = (selectedLead.score / 100) * circumference;

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(139,92,246,0.4)',
            }}>
              <Brain size={20} color="#fff" />
            </div>
            <h1 style={{
              margin: 0, fontSize: '26px', fontWeight: 700,
              fontFamily: 'Space Grotesk, sans-serif',
              background: 'linear-gradient(135deg, #a78bfa, #818cf8, #60a5fa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>AI Lead Scoring Engine</h1>
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            AI analyzes 12+ signals to score every lead from 0–100
          </p>
        </div>
        <button
          onClick={handleBulkScoring}
          disabled={isBulkScoring}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: isBulkScoring ? 'not-allowed' : 'pointer',
            background: isBulkScoring ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            color: '#fff', fontWeight: 600, fontSize: '14px',
            boxShadow: isBulkScoring ? 'none' : '0 0 18px rgba(139,92,246,0.4)',
            transition: 'all 0.3s',
          }}
        >
          <RefreshCw size={16} style={{ animation: isBulkScoring ? 'spin 1s linear infinite' : 'none' }} />
          {isBulkScoring ? `Scoring... ${bulkProgress}%` : bulkComplete ? '✅ Scoring Complete!' : 'Run Bulk Scoring'}
        </button>
      </div>

      {/* ── Bulk Progress Bar ── */}
      {isBulkScoring && (
        <div style={{
          marginBottom: '20px', padding: '14px 20px', borderRadius: '12px',
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#a78bfa', fontWeight: 600, fontSize: '13px' }}>
              🧠 AI is analyzing 247 leads across 12 signals...
            </span>
            <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '13px' }}>{bulkProgress}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px',
              background: 'linear-gradient(90deg, #8b5cf6, #6366f1, #60a5fa)',
              width: `${bulkProgress}%`, transition: 'width 0.2s ease',
              boxShadow: '0 0 12px rgba(139,92,246,0.6)',
            }} />
          </div>
        </div>
      )}

      {/* ── Stats Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Scored', value: stats.total, color: '#a78bfa', icon: Users, bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
          { label: 'Sales Ready', value: stats.salesReady, color: '#10b981', icon: Star, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
          { label: 'Hot', value: stats.hot, color: '#f97316', icon: Flame, bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
          { label: 'Warm', value: stats.warm, color: '#f59e0b', icon: Thermometer, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
          { label: 'Cold', value: stats.cold, color: '#60a5fa', icon: Snowflake, bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: '14px',
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <Filter size={16} color="rgba(255,255,255,0.4)" style={{ marginTop: '6px' }} />
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            padding: '6px 16px', borderRadius: '99px', border: '1px solid',
            borderColor: activeFilter === f ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)',
            background: activeFilter === f ? 'rgba(139,92,246,0.2)' : 'transparent',
            color: activeFilter === f ? '#a78bfa' : 'rgba(255,255,255,0.5)',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
          }}>{f}</button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px' }}>
          {sortedLeads.length} leads
        </span>
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '20px', alignItems: 'start' }}>

        {/* ── LEFT: Leads Table ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px', overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#a78bfa" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>All Leads Scoreboard</span>
          </div>

          {/* Table Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
            padding: '10px 20px', background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {['Contact', 'Score', 'Category', 'Source'].map(h => (
              <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {sortedLeads.map((lead, i) => {
            const cfg = categoryConfig[lead.category];
            const isSelected = selectedLead.id === lead.id;
            const g = getScoreGradient(lead.score);
            return (
              <div key={lead.id} onClick={() => setSelectedLead(lead)} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: isSelected ? 'rgba(139,92,246,0.1)' : 'transparent',
                borderLeft: isSelected ? '3px solid #8b5cf6' : '3px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s',
                alignItems: 'center',
              }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                {/* Contact */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${g.start}, ${g.end})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 800, color: '#fff', flexShrink: 0,
                    boxShadow: `0 0 8px ${g.start}60`,
                  }}>{lead.avatar}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{lead.name}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{lead.company}</div>
                  </div>
                </div>

                {/* Score */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: `linear-gradient(135deg, ${g.start}30, ${g.end}20)`,
                  border: `2px solid ${g.start}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '13px', color: g.start,
                  boxShadow: `0 0 10px ${g.start}40`,
                }}>{lead.score}</div>

                {/* Category */}
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                }}>{lead.category}</span>

                {/* Source */}
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{lead.source}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{lead.lastActivity}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: Selected Lead Detail ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Score Ring + Header */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px', padding: '28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
              {/* Score Ring */}
              <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                  <circle cx="65" cy="65" r="54" fill="none"
                    stroke={`url(#scoreGrad_${selectedLead.id})`} strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${grad.start})` }}
                  />
                  <defs>
                    <linearGradient id={`scoreGrad_${selectedLead.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={grad.start} />
                      <stop offset="100%" stopColor={grad.end} />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontSize: '36px', fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif',
                    background: `linear-gradient(135deg, ${grad.start}, ${grad.end})`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    lineHeight: 1,
                  }}>{selectedLead.score}</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>/ 100</span>
                </div>
              </div>

              {/* Lead Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${grad.start}, ${grad.end})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 800, color: '#fff',
                    boxShadow: `0 0 16px ${grad.start}60`,
                  }}>{selectedLead.avatar}</div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>{selectedLead.name}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{selectedLead.company}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {(() => { const cfg = categoryConfig[selectedLead.category]; return (
                    <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {selectedLead.category}
                    </span>
                  ); })()}
                  <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    📍 {selectedLead.source}
                  </span>
                  <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Clock size={10} style={{ marginRight: '4px' }} />{selectedLead.lastActivity}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} />{selectedLead.email}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} />{selectedLead.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => alert(`Booking demo session for ${selectedLead.name} (${selectedLead.company}). Calendar invitation dispatched.`)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff',
                  fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 0 16px rgba(139,92,246,0.4)',
                }}
              >
                <Calendar size={14} /> Book Demo
              </button>
              <button 
                onClick={() => alert(`Initiating direct WhatsApp outbound channel to ${selectedLead.name} at ${selectedLead.phone}...`)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                  fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 0 16px rgba(16,185,129,0.4)',
                }}
              >
                <MessageSquare size={14} /> Send WhatsApp
              </button>
              <button 
                onClick={() => alert(`Assigning lead ${selectedLead.name} to sales agent. CRM ownership record updated.`)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)',
                  fontWeight: 700, fontSize: '13px', border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <UserCheck size={14} /> Assign to Sales
              </button>
            </div>
          </div>

          {/* Score Factors */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px', padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BarChart2 size={16} color="#a78bfa" />
              <span style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>Score Breakdown</span>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                12 signals analyzed
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedLead.scoreFactors.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '10px',
                  background: f.positive ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
                  border: `1px solid ${f.positive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  {f.positive
                    ? <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                    : <XCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                  }
                  <span style={{ flex: 1, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{f.label}</span>
                  <span style={{
                    fontWeight: 800, fontSize: '14px',
                    color: f.positive ? '#10b981' : '#ef4444',
                    fontFamily: 'Space Grotesk, sans-serif',
                    minWidth: '40px', textAlign: 'right',
                  }}>
                    {f.positive ? '+' : ''}{f.points}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Score Trend Sparkline */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px', padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingUp size={16} color="#60a5fa" />
              <span style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>Score Trend</span>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Last 7 days</span>
            </div>
            <div style={{ position: 'relative', height: '70px' }}>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(v => (
                <div key={v} style={{
                  position: 'absolute', left: 0, right: 0,
                  bottom: `${v}%`, height: '1px',
                  background: 'rgba(255,255,255,0.05)',
                }} />
              ))}
              {/* Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '6px' }}>
                {selectedLead.trendData.map((val, i) => {
                  const isLast = i === selectedLead.trendData.length - 1;
                  const pct = (val / 100) * 100;
                  const g2 = getScoreGradient(val);
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{
                        width: '100%', borderRadius: '4px 4px 2px 2px',
                        height: `${pct}%`,
                        background: isLast
                          ? `linear-gradient(180deg, ${g2.start}, ${g2.end})`
                          : `linear-gradient(180deg, ${g2.start}80, ${g2.end}40)`,
                        boxShadow: isLast ? `0 0 10px ${g2.start}60` : 'none',
                        transition: 'height 0.6s ease',
                        position: 'relative',
                      }}>
                        {isLast && (
                          <div style={{
                            position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
                            fontSize: '10px', fontWeight: 800, color: g2.start,
                            whiteSpace: 'nowrap',
                          }}>{val}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              {['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Today'].map(d => (
                <span key={d} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', flex: 1, textAlign: 'center' }}>{d}</span>
              ))}
            </div>
          </div>

          {/* AI Recommendation */}
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: '14px', padding: '18px 20px',
            display: 'flex', gap: '12px', alignItems: 'flex-start',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Zap size={18} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#f59e0b', marginBottom: '4px' }}>
                🤖 AI Recommendation
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(245,158,11,0.9)', lineHeight: 1.6 }}>
                This lead is ready for human sales intervention. Recommend scheduling a demo call within 24 hours to maximize conversion probability.
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LeadScoringView;
