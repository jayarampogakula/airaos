import React, { useState } from 'react';
import {
  BarChart2, Bot, Megaphone, MessageSquare, DollarSign, Target,
  TrendingUp, TrendingDown, Download, Zap, ChevronDown,
  Calendar, Users, Award, Clock, Star, Globe, Phone, Mail,
  AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight,
  Activity, Filter, RefreshCw, Layers, PieChart
} from 'lucide-react';

interface AnalyticsCenterViewProps {
  tenantId?: string;
  contacts?: any[];
  deals?: any[];
  conversations?: any[];
  appointments?: any[];
}

type Tab = 'sales' | 'agent' | 'marketing' | 'conversation' | 'revenue' | 'leadsource';
type DateRange = '7D' | '30D' | '90D' | 'Custom';

const KPICard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  icon: React.ReactNode;
  color?: string;
}> = ({ label, value, sub, trend, icon, color = 'var(--primary-color)' }) => (
  <div style={{
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)',
    borderRadius: 16,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: '1 1 0',
    minWidth: 150,
    backdropFilter: 'blur(12px)',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: 0, right: 0, width: 80, height: 80,
      background: color, borderRadius: '0 16px 0 80px', opacity: 0.08,
    }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted, #8892a4)', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ color, opacity: 0.9 }}>{icon}</div>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1 }}>
      {value}
    </div>
    {(sub || trend !== undefined) && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {trend !== undefined && (
          <span style={{ color: trend >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 12, color: 'var(--text-muted, #8892a4)' }}>{sub}</span>}
      </div>
    )}
  </div>
);

const AIInsightsCard: React.FC<{ insights: string[] }> = ({ insights }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 16,
    padding: '20px 24px',
    marginTop: 24,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, padding: 6, display: 'flex' }}>
        <Zap size={16} color="#fff" />
      </div>
      <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif', fontSize: 15 }}>AI Insights</span>
      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(99,102,241,0.8)', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>POWERED BY AI</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {insights.map((insight, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{i + 1}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{insight}</p>
        </div>
      ))}
    </div>
  </div>
);

const ExportButton: React.FC = () => (
  <button style={{
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
    color: '#fff', borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, backdropFilter: 'blur(12px)',
    transition: 'all 0.2s',
  }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-color)')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-glass)')}
  >
    <Download size={14} />
    Export Data
  </button>
);

// ─── SALES TAB ─────────────────────────────────────────────────────────────────

const salesMonthlyData = [
  { month: 'Jan', won: 14, lost: 5 },
  { month: 'Feb', won: 18, lost: 8 },
  { month: 'Mar', won: 22, lost: 6 },
  { month: 'Apr', won: 19, lost: 9 },
  { month: 'May', won: 25, lost: 4 },
  { month: 'Jun', won: 31, lost: 7 },
];

const pipelineStages = [
  { stage: 'New Leads', count: 247, color: '#6366f1' },
  { stage: 'Qualified', count: 189, color: '#8b5cf6' },
  { stage: 'Proposal', count: 134, color: '#06b6d4' },
  { stage: 'Negotiation', count: 78, color: '#f59e0b' },
  { stage: 'Closed Won', count: 89, color: '#10b981' },
];

const topDeals = [
  { name: 'TechCorp ERP Suite', contact: 'Rahul Mehra', stage: 'Negotiation', value: '₹8.4L', prob: 85 },
  { name: 'RetailPro Analytics', contact: 'Priya Sharma', stage: 'Proposal', value: '₹5.2L', prob: 65 },
  { name: 'FinEdge Platform', contact: 'Amit Singh', stage: 'Closed Won', value: '₹4.1L', prob: 100 },
  { name: 'HealthFirst CRM', contact: 'Neha Joshi', stage: 'Qualified', value: '₹3.7L', prob: 45 },
  { name: 'LogiChain Suite', contact: 'Vikram Patel', stage: 'Negotiation', value: '₹2.9L', prob: 78 },
];

const SalesTab: React.FC = () => {
  const maxWon = Math.max(...salesMonthlyData.map(d => d.won + d.lost));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', color: '#fff', fontSize: 18 }}>Sales Analytics</h3>
        <ExportButton />
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPICard label="Total Deals" value="247" sub="vs last period" trend={12} icon={<Layers size={18} />} color="#6366f1" />
        <KPICard label="Won" value="89" sub="deals closed" trend={8} icon={<Award size={18} />} color="#10b981" />
        <KPICard label="Lost" value="34" sub="deals lost" trend={-3} icon={<AlertTriangle size={18} />} color="#ef4444" />
        <KPICard label="Win Rate" value="72%" sub="industry avg 58%" trend={5} icon={<TrendingUp size={18} />} color="#f59e0b" />
        <KPICard label="Avg Deal Size" value="₹2.8L" sub="per deal" trend={14} icon={<DollarSign size={18} />} color="#06b6d4" />
        <KPICard label="Sales Cycle" value="14 days" sub="time to close" trend={-6} icon={<Clock size={18} />} color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
        {/* Pipeline Funnel */}
        <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)' }}>
          <h4 style={{ margin: '0 0 20px', color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Pipeline Funnel</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pipelineStages.map((s) => (
              <div key={s.stage} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  <span>{s.stage}</span>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(s.count / 247) * 100}%`, background: s.color, borderRadius: 99, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Deals Chart */}
        <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)' }}>
          <h4 style={{ margin: '0 0 20px', color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Monthly Deals Trend</h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
            {salesMonthlyData.map((d) => (
              <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                  <div style={{ width: '60%', height: `${(d.lost / maxWon) * 120}px`, background: 'rgba(239,68,68,0.5)', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                  <div style={{ width: '60%', height: `${(d.won / maxWon) * 120}px`, background: 'linear-gradient(180deg, #10b981, #059669)', borderRadius: '4px 4px 0 0', minHeight: 6 }} />
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{d.month}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} /><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Won</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(239,68,68,0.5)' }} /><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Lost</span></div>
          </div>
        </div>
      </div>

      {/* Top Deals Table */}
      <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
          <h4 style={{ margin: 0, color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Top Deals</h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Deal Name', 'Contact', 'Stage', 'Value', 'Probability'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topDeals.map((d, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '14px 20px', color: '#fff', fontWeight: 600, fontSize: 14 }}>{d.name}</td>
                  <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{d.contact}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: d.stage === 'Closed Won' ? 'rgba(16,185,129,0.15)' : d.stage === 'Negotiation' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                      color: d.stage === 'Closed Won' ? '#10b981' : d.stage === 'Negotiation' ? '#f59e0b' : '#6366f1',
                    }}>{d.stage}</span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#10b981', fontWeight: 700, fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>{d.value}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${d.prob}%`, background: d.prob === 100 ? '#10b981' : d.prob > 70 ? '#6366f1' : '#f59e0b', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', minWidth: 32, textAlign: 'right' }}>{d.prob}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AIInsightsCard insights={[
        'Win rate has improved 5% this quarter — your Negotiation stage success rate is a key driver. Consider replicating the objection-handling scripts across all reps.',
        'Average deal size grew 14% MoM, driven by enterprise upsells. The FinEdge and TechCorp accounts contributed ₹12.5L combined.',
        'Sales cycle at 14 days is 4 days below industry average. Deals with early AI qualification close 2.3x faster than manually processed leads.',
      ]} />
    </div>
  );
};

// ─── AGENT TAB ──────────────────────────────────────────────────────────────────

const agentData = [
  { name: 'Sarah (AI)', convs: 456, resolved: 398, escalated: 58, avgResp: '0.8s', csat: 4.8, type: 'ai' },
  { name: 'Marcus (AI)', convs: 312, resolved: 261, escalated: 51, avgResp: '1.1s', csat: 4.6, type: 'ai' },
  { name: 'Alex (Human)', convs: 278, resolved: 210, escalated: 68, avgResp: '3.4m', csat: 4.4, type: 'human' },
  { name: 'Diana (Human)', convs: 201, resolved: 98, escalated: 103, avgResp: '5.2m', csat: 4.1, type: 'human' },
];

const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const heatmapTimes = ['Morning\n6-12', 'Afternoon\n12-18', 'Evening\n18-24', 'Night\n0-6'];
const heatmapData = [
  [85, 92, 78, 95, 88, 45, 30],
  [70, 88, 95, 82, 76, 38, 25],
  [55, 65, 72, 68, 58, 70, 60],
  [20, 18, 22, 25, 19, 35, 42],
];

const AgentTab: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h3 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', color: '#fff', fontSize: 18 }}>Agent Analytics</h3>
      <ExportButton />
    </div>

    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <KPICard label="Total Conversations" value="1,247" trend={18} sub="this period" icon={<MessageSquare size={18} />} color="#6366f1" />
      <KPICard label="AI Resolved" value="967" sub="77.5% resolution" trend={5} icon={<Bot size={18} />} color="#10b981" />
      <KPICard label="Escalated" value="280" sub="to human agents" trend={-8} icon={<AlertTriangle size={18} />} color="#ef4444" />
      <KPICard label="Avg Response" value="1.2s" sub="AI response time" trend={-12} icon={<Clock size={18} />} color="#06b6d4" />
      <KPICard label="CSAT Score" value="4.6/5" sub="customer rating" trend={3} icon={<Star size={18} />} color="#f59e0b" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
      {/* Agent Table */}
      <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
          <h4 style={{ margin: 0, color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Per-Agent Breakdown</h4>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['Agent', 'Convs', 'Resolved', 'Escalated', 'Avg Resp', 'CSAT'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agentData.map((a, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: a.type === 'ai' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {a.type === 'ai' ? <Bot size={14} color="#fff" /> : <Users size={14} color="#fff" />}
                    </div>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{a.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{a.convs}</td>
                <td style={{ padding: '12px 16px', color: '#10b981', fontSize: 13, fontWeight: 600 }}>{a.resolved}</td>
                <td style={{ padding: '12px 16px', color: '#ef4444', fontSize: 13 }}>{a.escalated}</td>
                <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{a.avgResp}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{a.csat}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI vs Human Donut */}
      <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <h4 style={{ margin: 0, color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif', alignSelf: 'flex-start' }}>AI vs Human Resolution</h4>
        <div style={{ position: 'relative', width: 160, height: 160 }}>
          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            background: 'conic-gradient(#6366f1 0% 77.5%, #06b6d4 77.5% 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-secondary, #111827)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>77.5%</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>AI Rate</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {[{ label: 'AI Resolved', pct: 77.5, color: '#6366f1', count: 967 }, { label: 'Human Handled', pct: 22.5, color: '#06b6d4', count: 280 }].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.pct}%</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Heatmap */}
    <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)' }}>
      <h4 style={{ margin: '0 0 20px', color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Peak Hours Heatmap</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 4 }}>
        <div />
        {heatmapDays.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)', padding: '0 0 8px', fontWeight: 600 }}>{d}</div>
        ))}
        {heatmapTimes.map((time, ti) => (
          <React.Fragment key={ti}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', paddingRight: 8, whiteSpace: 'pre-line', lineHeight: 1.3 }}>{time}</div>
            {heatmapData[ti].map((val, di) => (
              <div key={di} style={{
                height: 36, borderRadius: 6,
                background: `rgba(99,102,241,${val / 100})`,
                border: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: val > 50 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                fontWeight: 600,
              }}>{val}%</div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Low</span>
        <div style={{ height: 8, flex: 1, maxWidth: 120, borderRadius: 99, background: 'linear-gradient(90deg, rgba(99,102,241,0.1), rgba(99,102,241,1))' }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>High</span>
      </div>
    </div>

    <AIInsightsCard insights={[
      'AI agents resolve 77.5% of conversations without human intervention — 19.5% above industry benchmark. Sarah AI has the best CSAT (4.8/5) among all agents.',
      'Peak conversation load occurs Tuesday–Thursday afternoons. Consider scheduling human agents during Mon/Wed mornings when AI escalation rates spike by 8%.',
      'Diana (Human) has the highest escalation rate (51.2%). Recommend pairing her with AI pre-screening to reduce escalations by an estimated 30%.',
    ]} />
  </div>
);

// ─── MARKETING TAB ──────────────────────────────────────────────────────────────

const campaignData = [
  { name: 'Spring Product Launch', channel: 'Email', sent: 2400, openPct: 42, replyPct: 28, converted: 67 },
  { name: 'WhatsApp Reactivation', channel: 'WhatsApp', sent: 1850, openPct: 68, replyPct: 41, converted: 76 },
  { name: 'Demo Invite Campaign', channel: 'Email', sent: 1200, openPct: 35, replyPct: 22, converted: 41 },
  { name: 'Festive Offers SMS', channel: 'SMS', sent: 3000, openPct: 22, replyPct: 8, converted: 50 },
];

const channelComparison = [
  { name: 'Email', open: 38, reply: 24, color: '#6366f1', icon: '📧' },
  { name: 'WhatsApp', open: 68, reply: 41, color: '#25d366', icon: '💚' },
  { name: 'SMS', open: 22, reply: 8, color: '#f59e0b', icon: '📱' },
];

const MarketingTab: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h3 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', color: '#fff', fontSize: 18 }}>Marketing Analytics</h3>
      <ExportButton />
    </div>

    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <KPICard label="Campaigns Sent" value="12" trend={33} sub="this period" icon={<Megaphone size={18} />} color="#8b5cf6" />
      <KPICard label="Total Reach" value="8,450" trend={22} sub="unique contacts" icon={<Users size={18} />} color="#06b6d4" />
      <KPICard label="Avg Open Rate" value="38%" trend={5} sub="vs 32% avg" icon={<Mail size={18} />} color="#f59e0b" />
      <KPICard label="Avg Reply Rate" value="24%" trend={8} sub="strong engagement" icon={<MessageSquare size={18} />} color="#10b981" />
      <KPICard label="Conversions" value="234" trend={18} sub="from campaigns" icon={<CheckCircle size={18} />} color="#6366f1" />
    </div>

    {/* Channel Comparison */}
    <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)' }}>
      <h4 style={{ margin: '0 0 20px', color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Channel Comparison</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {channelComparison.map(ch => (
          <div key={ch.name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{ch.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', minWidth: 80 }}>{ch.name}</span>
              <div style={{ flex: 1, display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                    <span>Open Rate</span><span style={{ color: ch.color, fontWeight: 700 }}>{ch.open}%</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${ch.open}%`, background: ch.color, borderRadius: 99 }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                    <span>Reply Rate</span><span style={{ color: ch.color, fontWeight: 700 }}>{ch.reply}%</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${ch.reply}%`, background: ch.color, borderRadius: 99, opacity: 0.7 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Campaign Table */}
    <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
        <h4 style={{ margin: 0, color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Campaign Performance</h4>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
            {['Campaign Name', 'Channel', 'Sent', 'Open %', 'Reply %', 'Converted'].map(h => (
              <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campaignData.map((c, i) => (
            <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '14px 20px', color: '#fff', fontWeight: 600, fontSize: 14 }}>{c.name}</td>
              <td style={{ padding: '14px 20px' }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.channel === 'WhatsApp' ? 'rgba(37,211,102,0.15)' : c.channel === 'SMS' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)', color: c.channel === 'WhatsApp' ? '#25d366' : c.channel === 'SMS' ? '#f59e0b' : '#6366f1' }}>{c.channel}</span>
              </td>
              <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{c.sent.toLocaleString()}</td>
              <td style={{ padding: '14px 20px', color: '#06b6d4', fontWeight: 700, fontSize: 14 }}>{c.openPct}%</td>
              <td style={{ padding: '14px 20px', color: '#10b981', fontWeight: 700, fontSize: 14 }}>{c.replyPct}%</td>
              <td style={{ padding: '14px 20px', color: '#f59e0b', fontWeight: 700, fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>{c.converted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <AIInsightsCard insights={[
      'WhatsApp campaigns outperform Email by 78% in open rates and 71% in reply rates. Consider migrating 40% of email-only campaigns to WhatsApp for higher ROI.',
      'The "Spring Product Launch" email campaign had a 42% open rate, 10 points above your channel average. The subject line format drove unusually high engagement.',
      'Campaign-driven conversions (234) represent 37% of total new deals this period. Marketing ROI improved by 22% vs last quarter.',
    ]} />
  </div>
);

// ─── CONVERSATION TAB ────────────────────────────────────────────────────────────

const topicTags = [
  { topic: 'Pricing', size: 22, weight: 800 },
  { topic: 'Demo Request', size: 18, weight: 700 },
  { topic: 'Features', size: 16, weight: 600 },
  { topic: 'Integration', size: 14, weight: 600 },
  { topic: 'Billing', size: 20, weight: 700 },
  { topic: 'Onboarding', size: 15, weight: 600 },
  { topic: 'Support', size: 13, weight: 500 },
  { topic: 'API Access', size: 12, weight: 500 },
  { topic: 'Enterprise Plan', size: 17, weight: 700 },
  { topic: 'Cancellation', size: 11, weight: 500 },
  { topic: 'Upgrade', size: 16, weight: 600 },
  { topic: 'WhatsApp Setup', size: 13, weight: 500 },
];

const channelDist = [
  { name: 'Website', pct: 42, color: '#6366f1' },
  { name: 'WhatsApp', pct: 28, color: '#25d366' },
  { name: 'Voice', pct: 18, color: '#f59e0b' },
  { name: 'Email', pct: 12, color: '#06b6d4' },
];

const ConversationTab: React.FC = () => {
  const conicGradient = channelDist.reduce((acc, d, i) => {
    const prev = channelDist.slice(0, i).reduce((s, x) => s + x.pct, 0);
    return acc + `${d.color} ${prev}% ${prev + d.pct}%, `;
  }, '').slice(0, -2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', color: '#fff', fontSize: 18 }}>Conversation Analytics</h3>
        <ExportButton />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPICard label="Total Conversations" value="1,247" trend={18} sub="this period" icon={<MessageSquare size={18} />} color="#6366f1" />
        <KPICard label="Avg Duration" value="5m 23s" trend={-4} sub="per session" icon={<Clock size={18} />} color="#06b6d4" />
        <KPICard label="First Response" value="1.2s" trend={-15} sub="AI-powered" icon={<Zap size={18} />} color="#10b981" />
        <KPICard label="CSAT Score" value="4.6/5" trend={3} sub="customer rating" icon={<Star size={18} />} color="#f59e0b" />
        <KPICard label="Escalation Rate" value="22.5%" trend={-8} sub="vs 31% last period" icon={<ArrowUpRight size={18} />} color="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Channel Donut */}
        <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h4 style={{ margin: 0, color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Channel Breakdown</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
              <div style={{ width: 130, height: 130, borderRadius: '50%', background: `conic-gradient(${conicGradient})` }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-secondary, #111827)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>1.2K</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Total</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {channelDist.map(ch => (
                <div key={ch.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: ch.color }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{ch.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{ch.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sentiment */}
        <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)' }}>
          <h4 style={{ margin: '0 0 20px', color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Sentiment Breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Positive', pct: 67, color: '#10b981', emoji: '😊' },
              { label: 'Neutral', pct: 21, color: '#f59e0b', emoji: '😐' },
              { label: 'Negative', pct: 12, color: '#ef4444', emoji: '😟' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{s.emoji}</span>
                  <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: s.color, fontSize: 15 }}>{s.pct}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 12, background: 'rgba(16,185,129,0.08)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>67% positive</span> — Excellent sentiment trend. Up from 58% last period.
            </p>
          </div>
        </div>
      </div>

      {/* Topic Word Cloud */}
      <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)' }}>
        <h4 style={{ margin: '0 0 20px', color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Common Topics</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {topicTags.map(t => (
            <span key={t.topic} style={{
              fontSize: t.size, fontWeight: t.weight,
              color: `rgba(99,102,241,${0.5 + (t.size - 10) / 30})`,
              padding: '4px 12px', borderRadius: 20,
              background: `rgba(99,102,241,${0.05 + (t.size - 10) / 100})`,
              border: `1px solid rgba(99,102,241,${0.1 + (t.size - 10) / 80})`,
              cursor: 'default',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(99,102,241,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = `rgba(99,102,241,${0.5 + (t.size - 10) / 30})`; e.currentTarget.style.background = `rgba(99,102,241,${0.05 + (t.size - 10) / 100})`; }}
            >
              {t.topic}
            </span>
          ))}
        </div>
      </div>

      <AIInsightsCard insights={[
        '"Pricing" and "Billing" are the top conversation topics. Consider building a self-serve pricing calculator to reduce repetitive inquiries by an estimated 35%.',
        'WhatsApp conversations have 2.1x higher CSAT scores than email, despite lower volume. Increasing WhatsApp capacity could improve overall satisfaction.',
        'Negative sentiment clusters around "Cancellation" and "Billing" topics — triggering an AI retention workflow at these moments could reduce churn by 18%.',
      ]} />
    </div>
  );
};

// ─── REVENUE TAB ────────────────────────────────────────────────────────────────

const revenueMonthly = [
  { month: 'Jan', revenue: 8.4 },
  { month: 'Feb', revenue: 9.2 },
  { month: 'Mar', revenue: 11.5 },
  { month: 'Apr', revenue: 10.8 },
  { month: 'May', revenue: 13.2 },
  { month: 'Jun', revenue: 15.6 },
];

const revenueSources = [
  { source: 'New Business', revenue: '₹28.4L', pct: 45, trend: 18 },
  { source: 'Renewals', revenue: '₹22.1L', pct: 35, trend: 5 },
  { source: 'Upsells', revenue: '₹8.7L', pct: 14, trend: 32 },
  { source: 'Referrals', revenue: '₹4.2L', pct: 6, trend: 12 },
];

const RevenueTab: React.FC = () => {
  const maxRev = Math.max(...revenueMonthly.map(d => d.revenue));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', color: '#fff', fontSize: 18 }}>Revenue Analytics</h3>
        <ExportButton />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPICard label="MRR" value="₹15.6L" trend={18} sub="monthly recurring" icon={<TrendingUp size={18} />} color="#10b981" />
        <KPICard label="ARR" value="₹1.87Cr" trend={18} sub="annual recurring" icon={<BarChart2 size={18} />} color="#6366f1" />
        <KPICard label="Churn Rate" value="2.3%" trend={-1} sub="monthly churn" icon={<TrendingDown size={18} />} color="#ef4444" />
        <KPICard label="Net Revenue" value="₹63.4L" trend={22} sub="total period" icon={<DollarSign size={18} />} color="#f59e0b" />
      </div>

      {/* Monthly Revenue Chart */}
      <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)' }}>
        <h4 style={{ margin: '0 0 24px', color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Monthly Revenue Trend</h4>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
          {revenueMonthly.map((d) => (
            <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>₹{d.revenue}L</span>
              <div style={{
                width: '70%', height: `${(d.revenue / maxRev) * 130}px`,
                background: 'linear-gradient(180deg, #10b981, #059669)',
                borderRadius: '6px 6px 0 0', minHeight: 8,
                boxShadow: '0 0 20px rgba(16,185,129,0.3)',
              }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Forecast Card */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 8, padding: 6 }}>
            <Zap size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif', fontSize: 15 }}>AI Revenue Forecast — July 2026</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Conservative', value: '₹16.8L', conf: 95 },
            { label: 'Expected', value: '₹18.4L', conf: 78, highlight: true },
            { label: 'Optimistic', value: '₹21.2L', conf: 45 },
          ].map(f => (
            <div key={f.label} style={{ padding: 16, borderRadius: 12, background: f.highlight ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${f.highlight ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>{f.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: f.highlight ? '#10b981' : '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>{f.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{f.conf}% confidence</div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Source */}
      <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)' }}>
        <h4 style={{ margin: '0 0 20px', color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Revenue by Source</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {revenueSources.map(s => (
            <div key={s.source} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{s.source}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>+{s.trend}%</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif', minWidth: 60, textAlign: 'right' }}>{s.revenue}</span>
                </div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${s.pct}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <AIInsightsCard insights={[
        'Revenue grew 18% MoM in June — the strongest growth in 6 months. Upsells (+32% MoM) are the fastest-growing category, driven by enterprise tier conversions.',
        'MRR of ₹15.6L with 2.3% churn gives an LTV of ~₹6.8L per enterprise customer. Focus retention efforts on the 12 accounts flagged as high-churn risk.',
        'AI forecasts July revenue at ₹18.4L (expected scenario). To hit the optimistic target of ₹21.2L, close 3 enterprise deals currently in negotiation stage.',
      ]} />
    </div>
  );
};

// ─── LEAD SOURCE TAB ────────────────────────────────────────────────────────────

const leadSources = [
  { source: 'Facebook Ads', leads: 312, converted: 89, convRate: 28.5, cost: '₹45/lead', color: '#1877f2' },
  { source: 'Google Ads', leads: 245, converted: 78, convRate: 31.8, cost: '₹62/lead', color: '#ea4335' },
  { source: 'Organic / SEO', leads: 198, converted: 67, convRate: 33.8, cost: '₹12/lead', color: '#10b981' },
  { source: 'WhatsApp Campaigns', leads: 156, converted: 48, convRate: 30.8, cost: '₹28/lead', color: '#25d366' },
  { source: 'Referrals', leads: 89, converted: 42, convRate: 47.2, cost: '₹8/lead', color: '#f59e0b' },
  { source: 'LinkedIn', leads: 67, converted: 19, convRate: 28.4, cost: '₹95/lead', color: '#0077b5' },
];

const utmData = [
  { campaign: 'spring_launch_2026', medium: 'cpc', source: 'google', clicks: 4250, leads: 89, convRate: 2.1 },
  { campaign: 'fb_retargeting_q2', medium: 'social', source: 'facebook', clicks: 6820, leads: 156, convRate: 2.3 },
  { campaign: 'organic_seo_blog', medium: 'organic', source: 'google', clicks: 12400, leads: 198, convRate: 1.6 },
  { campaign: 'whatsapp_reactivation', medium: 'messaging', source: 'whatsapp', clicks: 2100, leads: 67, convRate: 3.2 },
];

const LeadSourceTab: React.FC = () => {
  const totalLeads = leadSources.reduce((a, b) => a + b.leads, 0);
  let offset = 0;
  const segments = leadSources.map(s => {
    const pct = (s.leads / totalLeads) * 100;
    const seg = { ...s, pct, offset };
    offset += pct;
    return seg;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', color: '#fff', fontSize: 18 }}>Lead Source Analytics</h3>
        <ExportButton />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Source Table */}
        <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
            <h4 style={{ margin: 0, color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Source Performance</h4>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Source', 'Leads', 'Converted', 'Conv Rate', 'Cost/Lead'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leadSources.map((s, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{s.source}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{s.leads}</td>
                  <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 700, fontSize: 13 }}>{s.converted}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: s.convRate > 40 ? '#10b981' : s.convRate > 30 ? '#f59e0b' : 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 13 }}>{s.convRate}%</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{s.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lead Distribution Donut */}
        <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)' }}>
          <h4 style={{ margin: '0 0 20px', color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>Lead Distribution</h4>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', width: 150, height: 150 }}>
              <div style={{
                width: 150, height: 150, borderRadius: '50%',
                background: `conic-gradient(${segments.map(s => `${s.color} ${s.offset}% ${s.offset + s.pct}%`).join(', ')})`,
              }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 90, height: 90, borderRadius: '50%', background: 'var(--bg-secondary, #111827)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{totalLeads}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Total Leads</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leadSources.map(s => (
              <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{s.source}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{((s.leads / totalLeads) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* UTM Table */}
      <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
          <h4 style={{ margin: 0, color: '#fff', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>UTM Performance Breakdown</h4>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['Campaign', 'Medium', 'Source', 'Clicks', 'Leads', 'Conv Rate'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {utmData.map((u, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '14px 20px', color: '#fff', fontFamily: 'monospace', fontSize: 12 }}>{u.campaign}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: 'rgba(99,102,241,0.15)', color: '#6366f1', fontWeight: 600 }}>{u.medium}</span>
                </td>
                <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{u.source}</td>
                <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{u.clicks.toLocaleString()}</td>
                <td style={{ padding: '14px 20px', color: '#06b6d4', fontWeight: 700, fontSize: 14 }}>{u.leads}</td>
                <td style={{ padding: '14px 20px', color: '#10b981', fontWeight: 700, fontSize: 14 }}>{u.convRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AIInsightsCard insights={[
        'Referrals have the highest conversion rate (47.2%) at the lowest cost (₹8/lead). Launch a structured referral program to scale this channel 3–4x.',
        'Facebook Ads and Google Ads generate 52% of all leads but at 4–8x higher cost than organic/referral. Reallocate 20% of paid budget to content/SEO.',
        'WhatsApp UTM campaigns have the highest conversion rate among paid channels (3.2%). Consider A/B testing click-to-WhatsApp vs. landing page campaigns.',
      ]} />
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'sales', label: 'Sales', icon: '📊' },
  { id: 'agent', label: 'Agent', icon: '🤖' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'conversation', label: 'Conversation', icon: '💬' },
  { id: 'revenue', label: 'Revenue', icon: '💰' },
  { id: 'leadsource', label: 'Lead Source', icon: '🎯' },
];

export const AnalyticsCenterView: React.FC<AnalyticsCenterViewProps> = ({
  tenantId,
  contacts,
  deals,
  conversations,
  appointments,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('30D');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0b0f19)', padding: '32px 32px 64px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 12, padding: 10, display: 'flex' }}>
                <BarChart2 size={22} color="#fff" />
              </div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Analytics Center
              </h1>
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 14, maxWidth: 560 }}>
              Deep insights across sales, AI agents, marketing, conversations, revenue, and lead sources
            </p>
          </div>

          {/* Date Range Picker */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, border: '1px solid var(--border-glass)', alignSelf: 'flex-start' }}>
            {(['7D', '30D', '90D', 'Custom'] as DateRange[]).map(dr => (
              <button key={dr} onClick={() => setDateRange(dr)} style={{
                padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: dateRange === dr ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                color: dateRange === dr ? '#fff' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {dr === 'Custom' && <Calendar size={12} />}
                {dr}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { label: 'Data freshness', value: 'Live · 2m ago', icon: <Activity size={12} /> },
            { label: 'Period', value: dateRange === '7D' ? 'Last 7 days' : dateRange === '30D' ? 'Last 30 days' : dateRange === '90D' ? 'Last 90 days' : 'Custom range' },
            { label: 'Tenant', value: tenantId ?? 'GatiDesk Demo' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.icon && <span style={{ color: '#10b981' }}>{item.icon}</span>}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.label}:</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 28, background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4, border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: '0 0 auto', padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))' : 'transparent',
            color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.45)',
            borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'sales' && <SalesTab />}
        {activeTab === 'agent' && <AgentTab />}
        {activeTab === 'marketing' && <MarketingTab />}
        {activeTab === 'conversation' && <ConversationTab />}
        {activeTab === 'revenue' && <RevenueTab />}
        {activeTab === 'leadsource' && <LeadSourceTab />}
      </div>
    </div>
  );
};

export default AnalyticsCenterView;
