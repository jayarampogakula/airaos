import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Calendar, Download, Share2, FileText,
  Bot, Target, AlertTriangle, Zap, Flame, DollarSign, Users,
  CheckCircle, Award, BarChart2, ChevronRight, ArrowUpRight, ArrowDownRight,
  Clock, Briefcase, RefreshCw
} from 'lucide-react';

interface RevenueDashboardViewProps {
  tenantId?: string;
  contacts?: any[];
  deals?: any[];
  appointments?: any[];
}

const kpiRow1 = [
  {
    label: 'Revenue Generated',
    value: '₹24.8L',
    change: '+18%',
    sub: 'vs last month',
    positive: true,
    icon: DollarSign,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
  },
  {
    label: 'Appointments Booked',
    value: '183',
    change: '+12%',
    sub: 'vs last month',
    positive: true,
    icon: Calendar,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
  },
  {
    label: 'Qualified Leads',
    value: '312',
    change: '+8%',
    sub: 'vs last month',
    positive: true,
    icon: Users,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.08)',
  },
  {
    label: 'Conversion Rate',
    value: '28.6%',
    change: '+3.2pp',
    sub: 'vs last month',
    positive: true,
    icon: Target,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
  },
];

const kpiRow2 = [
  {
    label: 'Deals Won',
    value: '89',
    change: '+15%',
    sub: 'vs last month',
    positive: true,
    icon: CheckCircle,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
  },
  {
    label: 'Pipeline Value',
    value: '₹67.3L',
    change: '+9%',
    sub: 'vs last month',
    positive: true,
    icon: Briefcase,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
  },
  {
    label: 'Cost Per Lead',
    value: '₹420',
    change: '-12%',
    sub: 'improved',
    positive: true,
    icon: RefreshCw,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.08)',
  },
  {
    label: 'ROI',
    value: '4.8x',
    change: '+0.6x',
    sub: 'vs last month',
    positive: true,
    icon: Award,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
  },
];

const revenueMonths = [
  { month: 'Jan', value: 18, label: '₹18L' },
  { month: 'Feb', value: 21, label: '₹21L' },
  { month: 'Mar', value: 19, label: '₹19L' },
  { month: 'Apr', value: 22, label: '₹22L' },
  { month: 'May', value: 20, label: '₹20L' },
  { month: 'Jun', value: 24.8, label: '₹24.8L' },
];

const pipelineStages = [
  { label: 'Lead', count: 247, color: '#6366f1', pct: 100 },
  { label: 'Qualified', count: 156, color: '#06b6d4', pct: 63 },
  { label: 'Proposal', count: 89, color: '#f59e0b', pct: 57 },
  { label: 'Negotiation', count: 45, color: '#f97316', pct: 51 },
  { label: 'Won', count: 89, color: '#22c55e', pct: 198 },
];

const wonVsLost = [
  { month: 'Jan', won: 14, lost: 9 },
  { month: 'Feb', won: 18, lost: 7 },
  { month: 'Mar', won: 16, lost: 11 },
  { month: 'Apr', won: 21, lost: 8 },
  { month: 'May', won: 19, lost: 10 },
  { month: 'Jun', won: 24, lost: 6 },
];

const aiInsights = [
  { icon: '🎯', text: 'Top performer: Facebook Ads (ROI 6.2x)', color: '#22c55e' },
  { icon: '⚠️', text: '12 deals stalled in Proposal stage for 7+ days', color: '#f59e0b' },
  { icon: '📈', text: 'WhatsApp follow-ups converted 3x better than email', color: '#6366f1' },
  { icon: '🔥', text: 'Tuesday 3–5 PM is peak demo booking time', color: '#f97316' },
];

const leadSources = [
  { source: 'Facebook Ads', leads: 234, revenue: '₹9.4L', roi: '6.2x', roiNum: 6.2, color: '#6366f1' },
  { source: 'Google Ads', leads: 87, revenue: '₹4.1L', roi: '3.8x', roiNum: 3.8, color: '#06b6d4' },
  { source: 'Website Chat', leads: 189, revenue: '₹7.2L', roi: '5.1x', roiNum: 5.1, color: '#22c55e' },
  { source: 'WhatsApp', leads: 98, revenue: '₹3.8L', roi: '4.2x', roiNum: 4.2, color: '#f59e0b' },
];

const topDeals = [
  { name: 'Reliance Infra — Enterprise Suite', value: '₹4.2L', stage: 'Negotiation', stageColor: '#f97316' },
  { name: 'TechNova Solutions — CRM Bundle', value: '₹2.8L', stage: 'Proposal', stageColor: '#f59e0b' },
  { name: 'Bharat Fintech — Starter Plan', value: '₹1.5L', stage: 'Won', stageColor: '#22c55e' },
];

const maxRevenue = Math.max(...revenueMonths.map(m => m.value));
const maxWonLost = Math.max(...wonVsLost.map(m => m.won + m.lost));

export const RevenueDashboardView: React.FC<RevenueDashboardViewProps> = ({
  tenantId,
  contacts,
  deals,
  appointments,
}) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredWonBar, setHoveredWonBar] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('Last 30 Days');

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 28,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            marginBottom: 6,
          }}>
            Revenue Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
            AI-powered revenue intelligence and sales performance tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 4 }}>
            {['Last 7 Days', 'Last 30 Days', 'Last Quarter', 'Custom Range'].map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: dateRange === r ? 'var(--primary-color, #6366f1)' : 'transparent',
                  color: dateRange === r ? '#fff' : '#64748b',
                  transition: 'all 0.2s',
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>
            <Calendar size={14} /> {dateRange}
          </button>
        </div>
      </div>

      {/* KPI ROW 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        {kpiRow1.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      {/* KPI ROW 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {kpiRow2.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* REVENUE TREND CHART */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginBottom: 2 }}>Revenue Trend</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Monthly revenue over the last 6 months</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: '4px 10px' }}>
                <TrendingUp size={13} color="#22c55e" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>+18% MoM</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140, position: 'relative' }}>
              {/* Y-axis labels */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 130, paddingBottom: 4 }}>
                {['₹25L', '₹20L', '₹15L', '₹10L', '₹5L', '₹0'].map(l => (
                  <span key={l} style={{ fontSize: 10, color: '#475569', lineHeight: 1 }}>{l}</span>
                ))}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 10, height: 130, position: 'relative' }}>
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    position: 'absolute',
                    left: 0, right: 0,
                    bottom: `${(i / 5) * 100}%`,
                    borderTop: '1px dashed rgba(255,255,255,0.06)',
                  }} />
                ))}
                {revenueMonths.map((m, i) => {
                  const h = (m.value / maxRevenue) * 110;
                  const isHovered = hoveredBar === i;
                  const isLatest = i === revenueMonths.length - 1;
                  return (
                    <div
                      key={i}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {isHovered && (
                        <div style={{
                          position: 'absolute',
                          bottom: h + 14,
                          background: 'rgba(15,23,42,0.95)',
                          border: '1px solid rgba(99,102,241,0.4)',
                          borderRadius: 8,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#a5b4fc',
                          whiteSpace: 'nowrap',
                          zIndex: 10,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                        }}>
                          {m.label}
                        </div>
                      )}
                      <div style={{
                        width: '100%',
                        height: h,
                        borderRadius: '6px 6px 2px 2px',
                        background: isLatest
                          ? 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)'
                          : isHovered
                            ? 'linear-gradient(180deg, #818cf8 0%, #6366f1 100%)'
                            : 'linear-gradient(180deg, rgba(99,102,241,0.7) 0%, rgba(99,102,241,0.3) 100%)',
                        boxShadow: isLatest ? '0 0 16px rgba(99,102,241,0.4)' : 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                      }} />
                      <span style={{ fontSize: 11, fontWeight: isLatest ? 700 : 400, color: isLatest ? '#a5b4fc' : '#64748b' }}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PIPELINE BY STAGE FUNNEL */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 24,
          }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginBottom: 2 }}>Pipeline by Stage</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Lead-to-close funnel with conversion rates</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pipelineStages.map((stage, i) => {
                const convRate = i > 0 ? Math.round((stage.count / pipelineStages[i - 1].count) * 100) : 100;
                const barW = (stage.count / pipelineStages[0].count) * 100;
                return (
                  <div key={stage.label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                      <div style={{ width: 90, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{stage.label}</div>
                      <div style={{ flex: 1, height: 32, background: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          height: '100%',
                          width: `${barW}%`,
                          background: `linear-gradient(90deg, ${stage.color}cc, ${stage.color})`,
                          borderRadius: 6,
                          transition: 'width 0.6s ease',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: 10,
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{stage.count}</span>
                        </div>
                      </div>
                      <div style={{ width: 60, textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                        {(stage.count / 247 * 100).toFixed(0)}%
                      </div>
                    </div>
                    {i < pipelineStages.length - 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 102, marginBottom: 4 }}>
                        <ChevronRight size={12} color="#475569" />
                        <span style={{ fontSize: 10, color: '#475569' }}>
                          {convRate}% → {pipelineStages[i + 1].label}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DEALS WON VS LOST */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginBottom: 2 }}>Deals Won vs Lost</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Monthly comparison</div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: '#22c55e' }} />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Won</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: '#ef4444' }} />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Lost</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 120 }}>
              {wonVsLost.map((m, i) => {
                const maxH = 100;
                const wonH = (m.won / 30) * maxH;
                const lostH = (m.lost / 30) * maxH;
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: maxH }}>
                      <div
                        onMouseEnter={() => setHoveredWonBar(`won-${i}`)}
                        onMouseLeave={() => setHoveredWonBar(null)}
                        style={{
                          width: 16,
                          height: wonH,
                          borderRadius: '4px 4px 2px 2px',
                          background: hoveredWonBar === `won-${i}` ? '#4ade80' : 'linear-gradient(180deg, #22c55e, #16a34a)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}
                        title={`Won: ${m.won}`}
                      />
                      <div
                        onMouseEnter={() => setHoveredWonBar(`lost-${i}`)}
                        onMouseLeave={() => setHoveredWonBar(null)}
                        style={{
                          width: 16,
                          height: lostH,
                          borderRadius: '4px 4px 2px 2px',
                          background: hoveredWonBar === `lost-${i}` ? '#f87171' : 'linear-gradient(180deg, #ef4444, #dc2626)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        title={`Lost: ${m.lost}`}
                      />
                    </div>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* AI REVENUE INSIGHTS */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(251,191,36,0.05) 100%)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 16,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(245,158,11,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={18} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>AI Revenue Insights</div>
                <div style={{ fontSize: 11, color: '#f59e0b' }}>Updated 2 minutes ago</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {aiInsights.map((ins, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: 10,
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ fontSize: 16, lineHeight: 1.4 }}>{ins.icon}</span>
                  <span style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LEAD SOURCE ROI */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 20,
          }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 14 }}>Lead Source ROI</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Source', 'Leads', 'Revenue', 'ROI'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 11, color: '#475569', fontWeight: 600, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadSources.map((src, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 0', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: src.color }} />
                        <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{src.source}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 0', fontSize: 12, color: '#94a3b8' }}>{src.leads}</td>
                    <td style={{ padding: '10px 0', fontSize: 12, color: '#94a3b8' }}>{src.revenue}</td>
                    <td style={{ padding: '10px 0' }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: src.roiNum >= 5 ? '#22c55e' : src.roiNum >= 4 ? '#f59e0b' : '#94a3b8',
                        background: src.roiNum >= 5 ? 'rgba(34,197,94,0.1)' : src.roiNum >= 4 ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.1)',
                        borderRadius: 6,
                        padding: '2px 7px',
                      }}>
                        {src.roi}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mini ROI bars */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {leadSources.map((src, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 70, fontSize: 10, color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{src.source}</div>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                    <div style={{
                      height: '100%',
                      width: `${(src.roiNum / 7) * 100}%`,
                      background: `linear-gradient(90deg, ${src.color}88, ${src.color})`,
                      borderRadius: 3,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{ width: 28, fontSize: 10, color: src.color, fontWeight: 700 }}>{src.roi}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP DEALS THIS MONTH */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 20,
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>Top Deals This Month</div>
            <button 
              onClick={() => alert('Navigating to CRM Pipeline to view all active deals...')}
              style={{ fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              View all →
            </button>
          </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topDeals.map((deal, i) => (
                <div key={i} style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{deal.name}</div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: deal.stageColor,
                      background: `${deal.stageColor}18`,
                      border: `1px solid ${deal.stageColor}40`,
                      borderRadius: 5,
                      padding: '2px 7px',
                    }}>
                      {deal.stage}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{deal.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EXPORT FOOTER */}
      <div style={{
        display: 'flex',
        gap: 12,
        padding: '20px 24px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, color: '#475569', marginRight: 'auto' }}>
          <Clock size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
          Last updated: {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
        {[
          { label: 'Export CSV', icon: Download },
          { label: 'Export PDF', icon: FileText },
          { label: 'Share Report', icon: Share2 },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => alert(`${label} triggered successfully. Data compiled and processed.`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 9,
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = '#a5b4fc';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  label: string;
  value: string;
  change: string;
  sub: string;
  positive: boolean;
  icon: React.ElementType;
  color: string;
  bg: string;
}> = ({ label, value, change, sub, positive, icon: Icon, color, bg }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? color + '40' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        padding: '18px 20px',
        transition: 'all 0.25s ease',
        cursor: 'default',
        boxShadow: hovered ? `0 4px 24px ${color}20` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</span>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 800, color: '#f1f5f9', marginBottom: 8, letterSpacing: '-0.5px' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3,
          background: positive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          borderRadius: 6, padding: '2px 7px',
        }}>
          {positive
            ? <ArrowUpRight size={12} color="#22c55e" />
            : <ArrowDownRight size={12} color="#ef4444" />}
          <span style={{ fontSize: 11, fontWeight: 700, color: positive ? '#22c55e' : '#ef4444' }}>{change}</span>
        </div>
        <span style={{ fontSize: 11, color: '#475569' }}>{sub}</span>
      </div>
    </div>
  );
};

export default RevenueDashboardView;
