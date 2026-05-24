import React from 'react';
import { 
  TrendingUp, Users, CheckCircle2, PhoneCall, RefreshCw, 
  ExternalLink, Calendar, GitBranch, ArrowUpRight
} from 'lucide-react';
import { Tenant, Contact, Appointment } from '../types';

interface DashboardViewProps {
  tenant: Tenant;
  contacts: Contact[];
  appointments: Appointment[];
  deals: any[];
  chatsUsed: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tenant,
  contacts,
  appointments,
  deals,
  chatsUsed
}) => {
  const pipelineValue = deals.reduce((acc, d) => acc + d.value, 0);
  const activeAppsCount = appointments.filter(a => a.status === 'scheduled').length;
  const conversionRate = contacts.length > 0 
    ? ((activeAppsCount / contacts.length) * 100).toFixed(1)
    : '0.0';

  // Chart mock data
  const trafficData = [
    { day: 'Mon', chats: 42, calls: 12 },
    { day: 'Tue', chats: 58, calls: 18 },
    { day: 'Wed', chats: 74, calls: 24 },
    { day: 'Thu', chats: 62, calls: 15 },
    { day: 'Fri', chats: 89, calls: 30 },
    { day: 'Sat', chats: 35, calls: 8 },
    { day: 'Sun', chats: 20, calls: 5 },
  ];

  const maxTraffic = 120; // scale factor

  return (
    <div className="animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="view-title">{tenant.name} Overview</h2>
          <p className="view-subtitle">Dashboard control console & live execution metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Domain: <a href={`https://${tenant.domain}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>{tenant.domain} <ExternalLink size={10} style={{ display: 'inline' }} /></a>
          </span>
          <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={12} /> Sync Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-12" style={{ marginBottom: '24px' }}>
        <div className="col-span-3 glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Pipeline Value</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', fontFamily: 'Space Grotesk, sans-serif' }}>
              ${pipelineValue.toLocaleString()}
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <TrendingUp size={12} /> Opportunities: {deals.length}
            </span>
          </div>
          <div className="icon-box" style={{ color: 'var(--primary-color)' }}><TrendingUp size={20} /></div>
        </div>

        <div className="col-span-3 glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>CRM Contacts</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', fontFamily: 'Space Grotesk, sans-serif' }}>
              {contacts.length}
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <TrendingUp size={12} /> Leads in system
            </span>
          </div>
          <div className="icon-box" style={{ color: 'var(--accent-color)' }}><Users size={20} /></div>
        </div>

        <div className="col-span-3 glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Chats Done</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', fontFamily: 'Space Grotesk, sans-serif' }}>
              {chatsUsed}
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              Total chats processed
            </span>
          </div>
          <div className="icon-box" style={{ color: 'var(--success-color)' }}><CheckCircle2 size={20} /></div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Weekly Traffic Distribution</h4>
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
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{ position: 'relative', width: '28px', height: `${totalHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '2px' }}>
                    {/* Tooltip on hover */}
                    <div className="chart-tooltip" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ height: `${callHeight}px`, width: '100%', background: 'var(--accent-color)', borderRadius: '4px' }}></div>
                      <div style={{ height: `${chatHeight}px`, width: '100%', background: 'var(--primary-color)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Infrastructure Status */}
        <div className="col-span-4 glass-card" style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Connected Subsystems</h4>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem' }}>🧠</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>AI Reasoning Engine</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>4 active models configured</div>
                </div>
              </div>
              <span className="badge badge-success">Online</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem' }}>💬</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>Unified Inbox Manager</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>3 communication channels active</div>
                </div>
              </div>
              <span className="badge badge-success">Online</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem' }}>🔄</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>Process Workflows</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>3 active automation runbooks</div>
                </div>
              </div>
              <span className="badge badge-success">Online</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem' }}>📅</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>Calendar Scheduler</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Google & Outlook Sync Active</div>
                </div>
              </div>
              <span className="badge badge-success">Synced</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem' }}>🗄️</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>CRM Database</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Relational Contacts Ledger</div>
                </div>
              </div>
              <span className="badge badge-success">Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Upcoming Appointments and Activity */}
      <div className="grid-cols-12">
        <div className="col-span-6 glass-card" style={{ minHeight: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Scheduled Appointments</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {appointments.length} scheduled
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {appointments.map((a) => {
              const contactName = a.contactId === 'c-101' ? 'John Doe' : 'Sarah Jenkins';
              const date = new Date(a.dateTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
              const time = new Date(a.dateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ padding: '8px', background: 'var(--primary-glow)', borderRadius: '6px', color: 'var(--primary-color)' }}>
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{a.type} - {contactName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.location}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>{date}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{time} ({a.duration}m)</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-6 glass-card" style={{ minHeight: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Active Workflow Logs</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Live executions
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Workflow Run Succeeded: Lead Capture & CRM Sync</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Trigger: Chat Lead Capture • Created deal worth $450 in CRM</div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>3 mins ago</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Scheduler Event Triggered: Appointment Reminder Loop</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Sent SMS & WhatsApp reminders to Sarah Jenkins for Penthouse Tour</div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>45 mins ago</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning-color)' }}></div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Human Escalation SLA Pinged</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Conversation conv-3 with Michael Chen transferred to developer support</div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
