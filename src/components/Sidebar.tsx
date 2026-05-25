import React from 'react';
import { 
  LayoutDashboard, Brain, UserCheck, MessageSquare, Users, Calendar, 
  GitBranch, PhoneCall, Database, Settings, Code, ShieldAlert,
  ChevronDown, ChevronRight, AlertCircle, ShoppingBag, Globe, Link, CreditCard
} from 'lucide-react';
import { Tenant } from '../types';

interface SidebarProps {
  currentRole: 'tenant' | 'superadmin';
  selectedTenant: Tenant;
  tenants: Tenant[];
  onSelectTenant: (tenantId: string) => void;
  onSelectRole: (role: 'tenant' | 'superadmin') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  usageLimits: {
    conversationsUsed: number;
    conversationsLimit: number;
    voiceUsed: number;
    voiceLimit: number;
    websitesUsed?: number;
    websitesLimit?: number;
  };
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  selectedTenant,
  tenants,
  onSelectTenant,
  onSelectRole,
  activeTab,
  setActiveTab,
  usageLimits,
  onLogout,
  isOpen,
  onClose
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const groups = [
    {
      title: "Workspace Overview",
      tabs: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'inbox', label: 'Unified Inbox', icon: MessageSquare },
        { id: 'crm', label: 'CRM Pipeline', icon: Users },
        { id: 'billing', label: 'Billing & Credits', icon: CreditCard }
      ]
    },
    {
      title: "Chatbot Agent Suite",
      tabs: [
        { id: 'employees', label: 'AI Employees', icon: UserCheck },
        { id: 'knowledge', label: 'Knowledge Base', icon: Database },
        { id: 'widget', label: 'Chatbot Widget Builder', icon: Code },
        { id: 'crew', label: 'CrewAI Orchestrator', icon: Brain }
      ]
    },
    {
      title: "AI Web Publisher",
      tabs: [
        { id: 'website', label: 'AI Website Builder', icon: Globe }
      ]
    },
    {
      title: "Voice Call Center",
      tabs: [
        { id: 'voice', label: 'Inbound/Outbound Calls', icon: PhoneCall },
        { id: 'scheduler', label: 'Calendar Scheduler', icon: Calendar },
        { id: 'workflow', label: 'Automation Workflows', icon: GitBranch }
      ]
    },
    {
      title: "Administration",
      tabs: [
        { id: 'brain', label: 'AI Brain', icon: Brain },
        { id: 'whitelabel', label: 'White Label', icon: Settings },
        { id: 'team', label: 'Team Access', icon: Users },
        { id: 'integrations', label: 'Integrations', icon: Link }
      ]
    }
  ];

  const adminTabs = [
    { id: 'tenants', label: 'Manage Tenants', icon: Users },
    { id: 'plans', label: 'Billing & Plans', icon: Settings },
    { id: 'infrastructure', label: 'Infrastructure status', icon: Database },
    { id: 'marketplace', label: 'Marketplace templates', icon: ShoppingBag },
  ];


  return (
    <div 
      className={`sidebar-container glass-panel ${isOpen ? 'open' : ''}`}
    >
      {/* Brand Header */}
      <div 
        style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div 
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            color: 'white',
            fontWeight: '800',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          A
        </div>
        <div>
          <h1 
            style={{ 
              fontSize: '1.15rem', 
              fontWeight: '800', 
              fontFamily: 'Space Grotesk, sans-serif',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            AiraOS
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
              v1.0
            </span>
          </h1>
        </div>
      </div>

      {/* Account / Tenant Switcher */}
      <div style={{ padding: '16px', position: 'relative' }}>
        {currentRole === 'tenant' ? (
          <button
            className="btn btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'var(--border-glass)',
              cursor: 'default'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
              <span style={{ fontSize: '1.2rem' }}>{selectedTenant.logo}</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                  {selectedTenant.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {selectedTenant.plan} Tenant
                </div>
              </div>
            </div>
          </button>
        ) : (
          <div
            className="glass-card"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <ShieldAlert size={18} className="badge-danger" style={{ color: 'var(--danger-color)' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--danger-color)' }}>
                Super Admin
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Agency Owner Console
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {currentRole === 'tenant' ? (
          groups.map((group, gIdx) => (
            <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 14px 2px 8px' }}>
                {group.title}
              </div>
              {group.tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); if (onClose) onClose(); }}
                    className="btn"
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? '600' : '500',
                      backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary-color)' : 'none',
                      borderRadius: isActive ? 'var(--radius-sm)' : '4px',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={16} style={{ color: isActive ? 'var(--primary-color)' : 'var(--text-muted)' }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          adminTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (onClose) onClose(); }}
                className="btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? '600' : '500',
                  backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary-color)' : 'none',
                  borderRadius: isActive ? 'var(--radius-sm)' : '4px',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--primary-color)' : 'var(--text-muted)' }} />
                {tab.label}
              </button>
            );
          })
        )}
      </div>

      {/* Tenant Limits Card */}
      {currentRole === 'tenant' && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-glass)' }}>
          <div 
            className="glass-card" 
            style={{ 
              padding: '12px', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: 'rgba(255,255,255,0.01)',
              fontSize: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Resource Limits</span>
              <span className="badge badge-primary">{selectedTenant.plan}</span>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '0.7rem' }}>
                <span>Chats</span>
                <span>{usageLimits.conversationsUsed} / {usageLimits.conversationsLimit}</span>
              </div>
              <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min(100, (usageLimits.conversationsUsed / usageLimits.conversationsLimit) * 100)}%`,
                    background: 'var(--primary-color)' 
                  }} 
                />
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '0.7rem' }}>
                <span>Voice Mins</span>
                <span>{usageLimits.voiceUsed} / {usageLimits.voiceLimit}</span>
              </div>
              <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '0.7rem' }}>
                  <span>Web Edits</span>
                  <span>{usageLimits.websitesUsed ?? 0} / {usageLimits.websitesLimit}</span>
                </div>
                <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
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
            
            {usageLimits.conversationsUsed >= usageLimits.conversationsLimit * 0.8 && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', color: 'var(--warning-color)', fontSize: '0.65rem', alignItems: 'center' }}>
                <AlertCircle size={10} />
                <span>Plan is reaching limits.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log Out Button */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-glass)' }}>
        <button
          onClick={onLogout}
          className="btn btn-secondary"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            fontSize: '0.8rem',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            borderColor: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--danger-color)',
            cursor: 'pointer'
          }}
        >
          <span>🚪</span> Log Out
        </button>
      </div>
    </div>
  );
};
