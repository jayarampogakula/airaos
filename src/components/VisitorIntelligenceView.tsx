import React, { useState } from 'react';
import {
  Users, Eye, Clock, UserCheck, ShieldAlert, Monitor, Smartphone,
  MapPin, ArrowUpRight, CheckCircle2, ChevronRight, Zap, RefreshCw,
  Search, Filter, Activity, Compass, Play, Globe
} from 'lucide-react';

interface VisitorIntelligenceViewProps {
  tenantId?: string;
}

interface VisitorPageView {
  page: string;
  title: string;
  timeSpent: string;
}

interface Visitor {
  id: string;
  name: string;
  status: 'identified' | 'anonymous';
  pagesVisited: number;
  timeOnSite: string;
  entryPage: string;
  device: 'desktop' | 'mobile' | 'tablet';
  country: string;
  flag: string;
  intentScore: number;
  isActive: boolean;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  journey: VisitorPageView[];
  engagementScore: number;
  purchaseProbability: number;
}

const MOCK_VISITORS: Visitor[] = [
  {
    id: 'v1',
    name: 'Rahul Mehta',
    status: 'identified',
    pagesVisited: 5,
    timeOnSite: '8m 12s',
    entryPage: '/features',
    device: 'desktop',
    country: 'India',
    flag: '🇮🇳',
    intentScore: 89,
    isActive: true,
    referrer: 'Google Search',
    utmSource: 'google',
    utmMedium: 'organic',
    engagementScore: 85,
    purchaseProbability: 78,
    journey: [
      { page: '/features', title: 'Product Features', timeSpent: '2m 15s' },
      { page: '/case-studies', title: 'Enterprise Case Studies', timeSpent: '1m 45s' },
      { page: '/pricing', title: 'Pricing Plans', timeSpent: '3m 10s' },
      { page: '/demo', title: 'Book a Demo', timeSpent: '1m 02s' }
    ]
  },
  {
    id: 'v2',
    name: 'Anonymous #7291',
    status: 'anonymous',
    pagesVisited: 3,
    timeOnSite: '2m 45s',
    entryPage: '/blog/ai-sales',
    device: 'mobile',
    country: 'India',
    flag: '🇮🇳',
    intentScore: 45,
    isActive: true,
    referrer: 'LinkedIn Organic',
    utmSource: 'linkedin',
    utmMedium: 'social',
    engagementScore: 40,
    purchaseProbability: 25,
    journey: [
      { page: '/blog/ai-sales', title: 'How AI changes sales', timeSpent: '1m 30s' },
      { page: '/features', title: 'Product Features', timeSpent: '1m 15s' }
    ]
  },
  {
    id: 'v3',
    name: 'Priya Sharma',
    status: 'identified',
    pagesVisited: 7,
    timeOnSite: '12m 30s',
    entryPage: '/home',
    device: 'desktop',
    country: 'India',
    flag: '🇮🇳',
    intentScore: 94,
    isActive: true,
    referrer: 'Facebook Ads',
    utmSource: 'facebook',
    utmMedium: 'cpc',
    utmCampaign: 'lead_gen_june',
    engagementScore: 95,
    purchaseProbability: 92,
    journey: [
      { page: '/home', title: 'Homepage', timeSpent: '1m 20s' },
      { page: '/features', title: 'Product Features', timeSpent: '2m 10s' },
      { page: '/pricing', title: 'Pricing & Plans', timeSpent: '4m 15s' },
      { page: '/docs', title: 'API Documentation', timeSpent: '2m 45s' },
      { page: '/checkout', title: 'Subscription Checkout', timeSpent: '2m 00s' }
    ]
  },
  {
    id: 'v4',
    name: 'Anonymous #8812',
    status: 'anonymous',
    pagesVisited: 4,
    timeOnSite: '5m 18s',
    entryPage: '/pricing',
    device: 'desktop',
    country: 'United States',
    flag: '🇺🇸',
    intentScore: 78,
    isActive: true,
    referrer: 'Direct Traffic',
    engagementScore: 70,
    purchaseProbability: 60,
    journey: [
      { page: '/pricing', title: 'Pricing', timeSpent: '3m 12s' },
      { page: '/features', title: 'Features', timeSpent: '1m 40s' },
      { page: '/faq', title: 'Frequently Asked Questions', timeSpent: '26s' }
    ]
  },
  {
    id: 'v5',
    name: 'Anonymous #9011',
    status: 'anonymous',
    pagesVisited: 1,
    timeOnSite: '0m 45s',
    entryPage: '/home',
    device: 'mobile',
    country: 'United Kingdom',
    flag: '🇬🇧',
    intentScore: 12,
    isActive: false,
    referrer: 'Twitter Post',
    engagementScore: 10,
    purchaseProbability: 5,
    journey: [
      { page: '/home', title: 'Homepage', timeSpent: '45s' }
    ]
  },
  {
    id: 'v6',
    name: 'Amit Kumar',
    status: 'identified',
    pagesVisited: 6,
    timeOnSite: '9m 50s',
    entryPage: '/features',
    device: 'tablet',
    country: 'India',
    flag: '🇮🇳',
    intentScore: 82,
    isActive: false,
    referrer: 'Google Ads',
    utmSource: 'google',
    utmMedium: 'cpc',
    engagementScore: 80,
    purchaseProbability: 70,
    journey: [
      { page: '/features', title: 'Features', timeSpent: '2m 00s' },
      { page: '/pricing', title: 'Pricing', timeSpent: '3m 10s' },
      { page: '/integrations', title: 'Integrations Hub', timeSpent: '4m 40s' }
    ]
  },
  {
    id: 'v7',
    name: 'Anonymous #3409',
    status: 'anonymous',
    pagesVisited: 2,
    timeOnSite: '1m 55s',
    entryPage: '/contact',
    device: 'mobile',
    country: 'India',
    flag: '🇮🇳',
    intentScore: 52,
    isActive: true,
    referrer: 'Direct Traffic',
    engagementScore: 48,
    purchaseProbability: 30,
    journey: [
      { page: '/contact', title: 'Contact Us', timeSpent: '1m 20s' },
      { page: '/about', title: 'About Us', timeSpent: '35s' }
    ]
  },
  {
    id: 'v8',
    name: 'Vikram Singh',
    status: 'identified',
    pagesVisited: 8,
    timeOnSite: '15m 40s',
    entryPage: '/home',
    device: 'desktop',
    country: 'India',
    flag: '🇮🇳',
    intentScore: 97,
    isActive: true,
    referrer: 'Email Newsletter',
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: 'june_product_update',
    engagementScore: 98,
    purchaseProbability: 95,
    journey: [
      { page: '/home', title: 'Homepage', timeSpent: '1m 10s' },
      { page: '/features', title: 'Features', timeSpent: '2m 20s' },
      { page: '/pricing', title: 'Pricing', timeSpent: '3m 50s' },
      { page: '/demo', title: 'Book a Demo', timeSpent: '8m 20s' }
    ]
  }
];

const topPages = [
  { page: '/pricing', visitors: 148, avgTime: '3m 45s', percent: 85 },
  { page: '/features', visitors: 220, avgTime: '2m 10s', percent: 70 },
  { page: '/demo', visitors: 85, avgTime: '4m 15s', percent: 55 },
  { page: '/docs', visitors: 62, avgTime: '5m 02s', percent: 40 },
];

const trafficSources = [
  { name: 'Google Search', count: 145, pct: 41, color: '#3b82f6' },
  { name: 'Facebook Ads', count: 98, pct: 28, color: '#ec4899' },
  { name: 'Direct Traffic', count: 68, pct: 19, color: '#22c55e' },
  { name: 'LinkedIn Organic', count: 36, pct: 12, color: '#f59e0b' }
];

export const VisitorIntelligenceView: React.FC<VisitorIntelligenceViewProps> = ({ tenantId }) => {
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor>(MOCK_VISITORS[0]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'identified' | 'high_intent' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVisitors = MOCK_VISITORS.filter(v => {
    // Search filter
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.country.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Tab filter
    if (activeFilter === 'identified') return matchesSearch && v.status === 'identified';
    if (activeFilter === 'high_intent') return matchesSearch && v.intentScore >= 70;
    if (activeFilter === 'active') return matchesSearch && v.isActive;
    return matchesSearch;
  });

  const getIntentColor = (score: number) => {
    if (score >= 80) return { text: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', label: 'Sales Ready' };
    if (score >= 50) return { text: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', label: 'Warm Intent' };
    return { text: '#6b7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)', label: 'Cold' };
  };

  const getDeviceIcon = (dev: 'desktop' | 'mobile' | 'tablet') => {
    if (dev === 'mobile') return <Smartphone size={14} />;
    return <Monitor size={14} />; // fallback desktop/tablet
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
              <Activity size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #fff 40%, var(--primary-color, #6366f1))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Visitor Intelligence
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Real-time website visitor tracking with AI-powered intent scoring
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => alert('Real-time visitor telemetry reloaded. 12 active web sessions tracked.')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'var(--bg-glass, rgba(255,255,255,0.04))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 10, color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Hero Stat Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Live Visitors', value: '12', icon: Users, color: '#22c55e', sub: 'Pulsing green dot', pulse: true },
          { label: "Today's Sessions", value: '347', icon: Eye, color: '#3b82f6', sub: '+18% vs yesterday' },
          { label: 'Avg Time on Site', value: '4m 23s', icon: Clock, color: '#a78bfa', sub: 'Engagement is up' },
          { label: 'Identified Visitors', value: '89', icon: UserCheck, color: '#06b6d4', sub: '25.6% conversion rate' },
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif', lineHeight: 1 }}>{stat.value}</span>
              {stat.pulse && (
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block', position: 'relative', top: -4, boxShadow: '0 0 10px #22c55e', animation: 'pulse-dot 1.5s infinite' }} />
              )}
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 3, gap: 2 }}>
          {[
            { id: 'all', label: 'All Visitors' },
            { id: 'identified', label: 'Identified Only' },
            { id: 'high_intent', label: 'High Intent (>70)' },
            { id: 'active', label: 'Active Now' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveFilter(t.id as any)} style={{
              padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s',
              background: activeFilter === t.id ? 'var(--primary-color, #6366f1)' : 'transparent',
              color: activeFilter === t.id ? '#fff' : '#64748b'
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search visitor or country..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ── Main Layout Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 28 }}>
        
        {/* LEFT PANEL: Visitor Table */}
        <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.03))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif' }}>Live Traffic Table</h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>Showing {filteredVisitors.length} sessions</span>
          </div>

          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 0.8fr 0.8fr 1fr', gap: 8, padding: '12px 24px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {['Visitor', 'Activity', 'Entry Page', 'Device/Geo', 'Intent', 'Actions'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {/* Table Rows */}
          {filteredVisitors.map(v => {
            const isSelected = selectedVisitor.id === v.id;
            const inc = getIntentColor(v.intentScore);
            return (
              <div key={v.id} onClick={() => setSelectedVisitor(v)} style={{
                display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 0.8fr 0.8fr 1fr', gap: 8, padding: '14px 24px', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                borderLeft: isSelected ? '3px solid var(--primary-color, #6366f1)' : '3px solid transparent',
                transition: 'all 0.15s',
                alignItems: 'center'
              }}>
                {/* Visitor Name & status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{v.status === 'identified' ? '👤' : '👻'}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: v.isActive ? '#22c55e' : '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.isActive ? '#22c55e' : '#475569' }} />
                      {v.isActive ? 'Active now' : 'Inactive'}
                    </div>
                  </div>
                </div>

                {/* Activity stats */}
                <div>
                  <div style={{ fontSize: 13, color: '#cbd5e1' }}>{v.pagesVisited} pages</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{v.timeOnSite}</div>
                </div>

                {/* Entry page */}
                <span style={{ fontSize: 12, color: 'var(--primary-color, #6366f1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.entryPage}
                </span>

                {/* Device & Location */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' }}>
                    {getDeviceIcon(v.device)} <span style={{ textTransform: 'capitalize' }}>{v.device}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span>{v.flag}</span> {v.country}
                  </div>
                </div>

                {/* Intent Score */}
                <div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: inc.bg, color: inc.text, border: `1px solid ${inc.border}`
                  }}>{v.intentScore}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => alert(`Opening active live chat connection with ${v.name || 'anonymous visitor'}. Navigating to Unified Inbox...`)}
                    style={{
                      padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none',
                      background: 'linear-gradient(135deg, var(--primary-color, #6366f1), var(--accent-color, #06b6d4))',
                      color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Play size={10} fill="#fff" /> Engage
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT PANEL: Selected Visitor Journey */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Journey detail card */}
          <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.03))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, padding: 22 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif' }}>Selected Session Journey</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{selectedVisitor.name}</h4>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Referrer: {selectedVisitor.referrer}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 24 }}>{selectedVisitor.flag}</span>
                <div style={{ fontSize: 11, color: '#64748b' }}>{selectedVisitor.country}</div>
              </div>
            </div>

            {/* Campaign info if exists */}
            {selectedVisitor.utmSource && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Campaign parameters</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
                  <span style={{ color: 'var(--accent-color, #06b6d4)' }}>source: <b>{selectedVisitor.utmSource}</b></span>
                  <span style={{ color: 'var(--accent-color, #06b6d4)' }}>medium: <b>{selectedVisitor.utmMedium}</b></span>
                  {selectedVisitor.utmCampaign && <span style={{ color: 'var(--accent-color, #06b6d4)' }}>campaign: <b>{selectedVisitor.utmCampaign}</b></span>}
                </div>
              </div>
            )}

            {/* Intent gauge */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24, padding: '14px', background: 'rgba(0,0,0,0.15)', borderRadius: 12 }}>
              <div style={{ position: 'relative', width: 70, height: 70 }}>
                <svg width="70" height="70" viewBox="0 0 70 70">
                  <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                  <circle cx="35" cy="35" r="30" fill="none" 
                          stroke={getIntentColor(selectedVisitor.intentScore).text} 
                          strokeWidth="5" 
                          strokeLinecap="round"
                          strokeDasharray={`${(selectedVisitor.intentScore / 100) * 188.4} 188.4`} 
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: '"Space Grotesk", sans-serif' }}>
                  {selectedVisitor.intentScore}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>AI Intent Scoring</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{getIntentColor(selectedVisitor.intentScore).label}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11 }}>
                  <span>Engagement: <b style={{ color: '#fff' }}>{selectedVisitor.engagementScore}%</b></span>
                  <span>Conversion Prob: <b style={{ color: '#fff' }}>{selectedVisitor.purchaseProbability}%</b></span>
                </div>
              </div>
            </div>

            {/* Vertical timeline journey */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 8, borderLeft: '2px solid rgba(255,255,255,0.05)', marginLeft: 10 }}>
              {selectedVisitor.journey.map((step, idx) => (
                <div key={idx} style={{ position: 'relative', paddingLeft: 16 }}>
                  <div style={{
                    position: 'absolute', left: -21, top: 4, width: 8, height: 8, borderRadius: '50%',
                    background: idx === selectedVisitor.journey.length - 1 ? 'var(--primary-color, #6366f1)' : '#475569',
                    boxShadow: idx === selectedVisitor.journey.length - 1 ? '0 0 8px var(--primary-color)' : 'none'
                  }} />
                  <div style={{ fontSize: 12, color: '#64748b' }}>{step.timeSpent}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginTop: 2 }}>{step.title}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{step.page}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        
        {/* Top Pages engagement */}
        <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.03))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, padding: 22 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif' }}>Top Pages by Engagement</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topPages.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  <span>{p.page} <span style={{ color: '#475569' }}>({p.avgTime} avg)</span></span>
                  <span style={{ fontWeight: 700, color: '#fff' }}>{p.visitors} visitors</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${p.percent}%`, background: 'linear-gradient(90deg, var(--primary-color, #6366f1), var(--accent-color, #06b6d4))', borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.03))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, padding: 22 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif' }}>Traffic Sources</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {trafficSources.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#cbd5e1', flex: 1 }}>{s.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.count} sessions</span>
                <span style={{ fontSize: 11, color: '#64748b', width: 32, textAlign: 'right' }}>{s.pct}%</span>
              </div>
            ))}
            <div style={{
              height: 10, borderRadius: 99, display: 'flex', overflow: 'hidden', marginTop: 10
            }}>
              {trafficSources.map(s => (
                <div key={s.name} style={{ width: `${s.pct}%`, background: s.color }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
      `}</style>

    </div>
  );
};
