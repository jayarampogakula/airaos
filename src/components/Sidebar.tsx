import React from 'react';
import { 
  LayoutDashboard, Inbox, Phone, Workflow, Users, Calendar, 
  Bot, Database, Network, MessageSquareCode, Globe, BrainCircuit,
  PlugZap, Shield, Palette, CreditCard, Settings, LifeBuoy,
  ChevronDown, ChevronRight, AlertCircle, ShieldAlert, Key, ShoppingBag, MessageSquare
} from 'lucide-react';
import { Tenant, User } from '../types';

interface SidebarProps {
  user?: User | null;
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

import versionData from '../version.json';

const commitCount = versionData?.commitCount || 42;
const major = Math.floor(commitCount / 100);
const minor = Math.floor((commitCount % 100) / 10);
const patch = commitCount % 10;
const appVersionString = `v${major}.${minor}.${patch}`;

export const Sidebar: React.FC<SidebarProps> = ({
  user,
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
      title: "🏠 Dashboard",
      tabs: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      title: "💬 Communications",
      tabs: [
        { id: 'inbox', label: 'Omnichannel Inbox', icon: Inbox },
        { id: 'voice', label: 'Voice Calls', icon: Phone },
        { id: 'workflow', label: 'Workflow Automation', icon: Workflow }
      ]
    },
    {
      title: "👥 CRM & Sales",
      tabs: [
        { id: 'crm', label: 'CRM Pipeline', icon: Users },
        { id: 'scheduler', label: 'Calendar Scheduler', icon: Calendar }
      ]
    },
    {
      title: "🤖 AI Agents",
      tabs: [
        { id: 'employees', label: 'AI Agents', icon: Bot },
        { id: 'knowledge', label: 'Knowledge Base', icon: Database },
        { id: 'crew', label: 'Agent Orchestrator', icon: Network }
      ]
    },
    {
      title: "🌐 Channels & Widgets",
      tabs: [
        { id: 'widget', label: 'Chatbot Widget Builder', icon: MessageSquareCode },
        { id: 'website', label: 'Website Builder', icon: Globe }
      ]
    },
    {
      title: "🧠 AI Models",
      tabs: [
        { id: 'brain', label: 'AI Brain', icon: BrainCircuit }
      ]
    },
    {
      title: "🔌 Integrations",
      tabs: [
        { id: 'integrations', label: 'Integrations', icon: PlugZap }
      ]
    },
    {
      title: "👨‍💼 Administration",
      tabs: [
        { id: 'team', label: 'Team Access', icon: Shield },
        { id: 'whitelabel', label: 'White Label', icon: Palette },
        { id: 'billing', label: 'Billing & Credits', icon: CreditCard }
      ]
    },
    {
      title: "⚙️ System",
      tabs: [
        { id: 'tenant_settings', label: 'Settings', icon: Settings },
        { id: 'tenant_support', label: 'Help & Support', icon: LifeBuoy }
      ]
    }
  ];

  const adminTabs = [
    { id: 'tenants', label: 'Manage Tenants', icon: Users },
    { id: 'plans', label: 'Billing & Plans', icon: Settings },
    { id: 'infrastructure', label: 'Infrastructure status', icon: Database },
    { id: 'settings', label: 'API & LLM Settings', icon: Key },
    { id: 'marketplace', label: 'Marketplace templates', icon: ShoppingBag },
    { id: 'support_bot', label: 'Platform Support Bot', icon: MessageSquare }
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
              {appVersionString}
            </span>
          </h1>
        </div>
      </div>

      {/* Account / Tenant Switcher */}
      <div style={{ padding: '16px', position: 'relative' }}>
        {currentRole === 'tenant' ? (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setDropdownOpen(prev => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderColor: 'var(--border-glass)',
                cursor: 'pointer'
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
              {dropdownOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {dropdownOpen && (
              <div
                className="glass-card"
                style={{
                  position: 'absolute',
                  left: '16px',
                  right: '16px',
                  top: '72px',
                  zIndex: 50,
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  backgroundColor: '#0a0d16',
                  border: '1px solid var(--border-glass)'
                }}
              >
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    className="btn"
                    onClick={() => {
                      onSelectTenant(tenant.id);
                      setDropdownOpen(false);
                      if (onClose) onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: tenant.id === selectedTenant.id ? 'var(--primary-glow)' : 'transparent',
                      color: 'var(--text-primary)',
                      justifyContent: 'flex-start',
                      fontSize: '0.78rem'
                    }}
                  >
                    <span>{tenant.logo}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenant.name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
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
