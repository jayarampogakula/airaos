import React, { useState } from 'react';
import {
  Plus, Download, Globe, Filter, TrendingUp, TrendingDown,
  Users, CheckCircle, Trophy, IndianRupee, ExternalLink,
  ChevronDown, Info, Zap, BarChart2, ArrowUpRight, Eye,
  Link2, Tag, RefreshCw, Search
} from 'lucide-react';

interface LeadSourcesViewProps {
  tenantId?: string;
}

const leadSources = [
  {
    id: 1,
    name: 'Facebook Lead Ads',
    icon: '📘',
    leads: 234,
    qualified: 98,
    won: 31,
    revenue: 387500,
    cpl: 0,
    cplLabel: 'Organic',
    trend: +12,
    color: '#3b82f6',
    badge: 'Top Source',
    badgeType: 'success',
  },
  {
    id: 2,
    name: 'Website Chat',
    icon: '💬',
    leads: 189,
    qualified: 76,
    won: 22,
    revenue: 274000,
    cpl: 120,
    trend: +8,
    color: '#8b5cf6',
    badge: 'High Intent',
    badgeType: 'primary',
  },
  {
    id: 3,
    name: 'Instagram',
    icon: '📸',
    leads: 156,
    qualified: 54,
    won: 14,
    revenue: 175000,
    cpl: 85,
    trend: +5,
    color: '#ec4899',
    badge: '',
    badgeType: '',
  },
  {
    id: 4,
    name: 'WhatsApp',
    icon: '💚',
    leads: 98,
    qualified: 42,
    won: 13,
    revenue: 162500,
    cpl: 0,
    cplLabel: 'Organic',
    trend: +19,
    color: '#22c55e',
    badge: 'Growing',
    badgeType: 'cyan',
  },
  {
    id: 5,
    name: 'Google Ads',
    icon: '🔍',
    leads: 87,
    qualified: 28,
    won: 6,
    revenue: 75000,
    cpl: 450,
    trend: -3,
    color: '#f59e0b',
    badge: 'High CPL',
    badgeType: 'warning',
  },
  {
    id: 6,
    name: 'Google Business',
    icon: '📍',
    leads: 43,
    qualified: 10,
    won: 2,
    revenue: 25000,
    cpl: 0,
    cplLabel: 'Free',
    trend: +2,
    color: '#06b6d4',
    badge: '',
    badgeType: '',
  },
  {
    id: 7,
    name: 'Voice Calls',
    icon: '📞',
    leads: 28,
    qualified: 3,
    won: 1,
    revenue: 12500,
    cpl: 200,
    trend: -1,
    color: '#a78bfa',
    badge: '',
    badgeType: '',
  },
  {
    id: 8,
    name: 'Manual Entry',
    icon: '✏️',
    leads: 12,
    qualified: 1,
    won: 0,
    revenue: 0,
    cpl: 0,
    cplLabel: 'N/A',
    trend: 0,
    color: '#6b7280',
    badge: '',
    badgeType: '',
  },
];

const campaigns = [
  {
    id: 1,
    campaign: 'FB_SummerSale_2026',
    adSet: 'Homeowners_25-45',
    adName: 'Video_Testimonial_v3',
    utmSource: 'facebook',
    utmMedium: 'cpc',
    landingPage: '/landing/summer-deal',
    leads: 87,
  },
  {
    id: 2,
    campaign: 'IG_BrandAwareness_Q2',
    adSet: 'Lookalike_Converters',
    adName: 'Carousel_Features',
    utmSource: 'instagram',
    utmMedium: 'social',
    landingPage: '/features',
    leads: 54,
  },
  {
    id: 3,
    campaign: 'Google_SearchMax_June',
    adSet: 'Competitor_Keywords',
    adName: 'RSA_PricingFocus',
    utmSource: 'google',
    utmMedium: 'cpc',
    landingPage: '/pricing',
    leads: 43,
  },
  {
    id: 4,
    campaign: 'FB_Retarget_Visitors',
    adSet: 'Website_7Days',
    adName: 'Dynamic_Offer_Banner',
    utmSource: 'facebook',
    utmMedium: 'retargeting',
    landingPage: '/offer',
    leads: 31,
  },
];

const utmBreakdown = [
  { source: 'facebook', count: 265, pct: 58 },
  { source: 'google', count: 87, pct: 19 },
  { source: 'instagram', count: 54, pct: 12 },
  { source: 'direct', count: 50, pct: 11 },
];

const totalLeads = leadSources.reduce((s, r) => s + r.leads, 0);

// Donut chart segments via conic-gradient
const donutColors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#22c55e',
  '#f59e0b', '#06b6d4', '#a78bfa', '#6b7280',
];

function formatRevenue(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

export const LeadSourcesView: React.FC<LeadSourcesViewProps> = ({ tenantId }) => {
  const [activeDateRange, setActiveDateRange] = useState('30d');
  const [activeFilter, setActiveFilter] = useState('All');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<number>(1);

  // Build conic-gradient string
  let cumulativePct = 0;
  const conicSegments = leadSources.map((src, i) => {
    const pct = (src.leads / totalLeads) * 100;
    const seg = `${donutColors[i]} ${cumulativePct.toFixed(1)}% ${(cumulativePct + pct).toFixed(1)}%`;
    cumulativePct += pct;
    return seg;
  });
  const conicGradient = `conic-gradient(${conicSegments.join(', ')})`;

  const badgeStyle = (type: string): React.CSSProperties => {
    const map: Record<string, string> = {
      success: 'var(--success-color)',
      primary: 'var(--primary-color)',
      warning: 'var(--warning-color)',
      danger: 'var(--danger-color)',
      cyan: 'var(--accent-color)',
    };
    return {
      background: `${map[type] || '#6b7280'}22`,
      color: map[type] || '#6b7280',
      border: `1px solid ${map[type] || '#6b7280'}44`,
      borderRadius: 6,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap' as const,
    };
  };

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px var(--primary-color)44',
            }}>
              <Globe size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #fff 40%, var(--primary-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Lead Sources & Attribution
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary, #6b7280)' }}>
                Every lead is automatically tracked with full source attribution
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'var(--bg-glass, rgba(255,255,255,0.05))', border: '1px solid var(--border-glass, rgba(255,255,255,0.1))', borderRadius: 10, color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
            <Download size={14} /> CSV Import
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'var(--bg-glass, rgba(255,255,255,0.05))', border: '1px solid var(--border-glass, rgba(255,255,255,0.1))', borderRadius: 10, color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
            <Link2 size={14} /> API Leads
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px var(--primary-color)44', transition: 'all 0.2s' }}>
            <Plus size={14} /> Add Lead Source
          </button>
        </div>
      </div>

      {/* ── Yellow Info Banner ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, marginBottom: 24, fontSize: 13, color: '#fbbf24' }}>
        <Info size={15} />
        🔒 Lead source attribution is automatically captured from all channels — Facebook, Instagram, WhatsApp, Google, Website, and Voice calls in real-time.
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Leads', value: '847', icon: Users, color: '#3b82f6', sub: '+62 this month', up: true },
          { label: 'Qualified', value: '312', icon: CheckCircle, color: '#22c55e', sub: '36.8% qualify rate', up: true },
          { label: 'Won', value: '89', icon: Trophy, color: '#f59e0b', sub: '28.5% close rate', up: false },
          { label: 'Total Revenue', value: '₹12.4L', icon: IndianRupee, color: '#a78bfa', sub: '↑ ₹2.1L from last month', up: true },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: 'var(--bg-glass, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-glass, rgba(255,255,255,0.08))',
            borderRadius: 16, padding: '20px 22px',
            backdropFilter: 'blur(12px)',
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${kpi.color}, transparent)`, borderRadius: '16px 16px 0 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${kpi.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={17} color={kpi.color} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif', lineHeight: 1, marginBottom: 8 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: kpi.up ? '#22c55e' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
              {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', background: 'var(--bg-glass, rgba(255,255,255,0.04))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 10, padding: 3, gap: 2 }}>
          {['7d', '30d', '90d', 'All'].map(r => (
            <button key={r} onClick={() => setActiveDateRange(r)} style={{
              padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s',
              background: activeDateRange === r ? 'var(--primary-color)' : 'transparent',
              color: activeDateRange === r ? '#fff' : '#6b7280',
            }}>{r}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'var(--bg-glass, rgba(255,255,255,0.04))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 10, cursor: 'pointer', color: '#6b7280', fontSize: 13 }}>
          <Filter size={14} /> Source Type <ChevronDown size={13} />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'var(--bg-glass, rgba(255,255,255,0.04))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 10, color: '#6b7280', fontSize: 13 }}>
          <RefreshCw size={13} /> Auto-refreshing
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 24 }}>

        {/* LEFT: Lead Source Table */}
        <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.04))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif' }}>Lead Sources</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280', marginTop: 2 }}>{leadSources.length} active channels tracked</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['All', 'Paid', 'Organic'].map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: '5px 14px', borderRadius: 8, border: `1px solid ${activeFilter === f ? 'var(--primary-color)' : 'var(--border-glass, rgba(255,255,255,0.1))'}`, background: activeFilter === f ? 'var(--primary-color)22' : 'transparent', color: activeFilter === f ? 'var(--primary-color)' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 70px 100px 90px 120px', gap: 8, padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.2)' }}>
            {['Source', 'Leads', 'Qualified', 'Won', 'Revenue', 'CPL', 'Actions'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {/* Table Rows */}
          {leadSources.map((src, i) => (
            <div
              key={src.id}
              onClick={() => setSelectedSource(src.id)}
              onMouseEnter={() => setHoveredRow(src.id)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 80px 80px 70px 100px 90px 120px',
                gap: 8, padding: '14px 24px', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: selectedSource === src.id
                  ? `${donutColors[i]}0a`
                  : hoveredRow === src.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                transition: 'background 0.15s',
                borderLeft: selectedSource === src.id ? `3px solid ${donutColors[i]}` : '3px solid transparent',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{src.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>{src.name}</div>
                  {src.badge && <span style={badgeStyle(src.badgeType)}>{src.badge}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{src.leads}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#94a3b8' }}>{src.qualified}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: src.won > 0 ? '#22c55e' : '#475569' }}>{src.won}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: src.revenue > 0 ? '#a78bfa' : '#475569' }}>
                  {src.revenue > 0 ? formatRevenue(src.revenue) : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: src.cpl > 300 ? '#f87171' : src.cpl > 0 ? '#fbbf24' : '#22c55e', fontWeight: 600 }}>
                  {src.cplLabel ? src.cplLabel : `₹${src.cpl}`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button style={{ padding: '4px 10px', fontSize: 11, borderRadius: 7, border: `1px solid ${donutColors[i]}55`, background: `${donutColors[i]}15`, color: donutColors[i], cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>View</button>
                <button style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#6b7280', cursor: 'pointer' }}>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: Donut + Top Source + UTM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Donut Chart */}
          <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.04))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, padding: '22px', backdropFilter: 'blur(12px)' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 700, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif' }}>Source Distribution</h3>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative' }}>
              <div style={{
                width: 160, height: 160, borderRadius: '50%',
                background: conicGradient,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'var(--bg-primary, #0b0f19)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif', lineHeight: 1 }}>847</span>
                  <span style={{ fontSize: 9, color: '#6b7280', marginTop: 2, letterSpacing: '0.04em' }}>TOTAL</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {leadSources.slice(0, 5).map((src, i) => (
                <div key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: donutColors[i], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{src.leads}</span>
                  <span style={{ fontSize: 11, color: '#475569', width: 38, textAlign: 'right' }}>{((src.leads / totalLeads) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performer Card */}
          <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 18, padding: '20px 22px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Trophy size={15} color="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>Top Performer</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>Last 30d</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 32 }}>📘</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>Facebook Lead Ads</div>
                <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp size={11} /> +12% vs last period
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Leads', value: '234', color: '#3b82f6' },
                { label: 'Revenue', value: '₹3.9L', color: '#a78bfa' },
                { label: 'CPL', value: '₹0', color: '#22c55e' },
                { label: 'Conv Rate', value: '13.2%', color: '#f59e0b' },
              ].map((m, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.color, fontFamily: '"Space Grotesk", sans-serif' }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* UTM Tracker */}
          <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.04))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, padding: '20px 22px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Tag size={14} color="var(--accent-color)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>UTM Source Breakdown</span>
            </div>
            {utmBreakdown.map((u, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>utm_source={u.source}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{u.count}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${u.pct}%`, background: donutColors[i], borderRadius: 99, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active Campaigns Table ── */}
      <div style={{ background: 'var(--bg-glass, rgba(255,255,255,0.04))', border: '1px solid var(--border-glass, rgba(255,255,255,0.08))', borderRadius: 18, backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-glass, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart2 size={16} color="var(--primary-color)" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif' }}>Active Campaigns</h3>
            <span style={{ padding: '2px 10px', background: 'var(--primary-color)22', color: 'var(--primary-color)', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{campaigns.length} running</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: '1px solid var(--border-glass, rgba(255,255,255,0.1))', borderRadius: 9, color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Eye size={12} /> View All
          </button>
        </div>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 1.4fr 110px 110px 1.2fr 70px', gap: 10, padding: '10px 24px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {['Campaign', 'Ad Set', 'Ad Name', 'UTM Source', 'UTM Medium', 'Landing Page', 'Leads'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>
        {campaigns.map((c, i) => {
          const srcColors: Record<string, string> = { facebook: '#3b82f6', instagram: '#ec4899', google: '#f59e0b', direct: '#22c55e' };
          const col = srcColors[c.utmSource] || '#6b7280';
          return (
            <div key={c.id} style={{
              display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 1.4fr 110px 110px 1.2fr 70px',
              gap: 10, padding: '14px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: hoveredRow === 100 + i ? 'rgba(255,255,255,0.02)' : 'transparent',
              transition: 'background 0.15s', cursor: 'pointer',
            }}
              onMouseEnter={() => setHoveredRow(100 + i)}
              onMouseLeave={() => setHoveredRow(null)}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={12} color={col} />
                {c.campaign}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.adSet}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.adName}</span>
              <span style={{ padding: '3px 10px', background: `${col}18`, color: col, borderRadius: 6, fontSize: 11, fontWeight: 700, height: 'fit-content', alignSelf: 'center' }}>{c.utmSource}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>/{c.utmMedium}</span>
              <span style={{ fontSize: 12, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Link2 size={10} /> {c.landingPage}
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', fontFamily: '"Space Grotesk", sans-serif' }}>{c.leads}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeadSourcesView;
