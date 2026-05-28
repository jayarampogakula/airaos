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
  const [isCollapsed, setIsCollapsed] = React.useState(false);

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
        { id: 'inbox', label: 'GatiDesk Inbox', icon: Inbox },
        { id: 'voice', label: 'GATI Voice Gateway', icon: Phone },
        { id: 'workflow', label: 'GATI Automation', icon: Workflow }
      ]
    },
    {
      title: "👥 CRM & Sales",
      tabs: [
        { id: 'crm', label: 'GATI CRM Pipeline', icon: Users },
        { id: 'scheduler', label: 'Calendar Scheduler', icon: Calendar }
      ]
    },
    {
      title: "🤖 AI Agents",
      tabs: [
        { id: 'employees', label: 'GATI AI Agents', icon: Bot },
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
      style={{
        width: isCollapsed ? '76px' : '260px',
        minWidth: isCollapsed ? '76px' : '260px',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Brand Header */}
      <div 
        style={{ 
          padding: isCollapsed ? '20px 10px' : '20px 24px', 
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: isCollapsed ? 'center' : 'flex-start'
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
            boxShadow: 'var(--shadow-glow)',
            flexShrink: 0
          }}
        >
          G
        </div>
        {!isCollapsed && (
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
              GatiDesk
              <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                {appVersionString}
              </span>
            </h1>
          </div>
        )}
      </div>

      {/* Account / Tenant Switcher */}
      <div style={{ padding: isCollapsed ? '16px 8px' : '16px', position: 'relative' }}>
        {currentRole === 'tenant' ? (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setDropdownOpen(prev => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                alignItems: 'center',
                padding: isCollapsed ? '10px' : '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderColor: 'var(--border-glass)',
                cursor: 'pointer'
              }}
              title={selectedTenant.name}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                <span style={{ fontSize: '1.2rem' }}>{selectedTenant.logo}</span>
                {!isCollapsed && (
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                      {selectedTenant.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {selectedTenant.plan} Tenant
                    </div>
                  </div>
                )}
              </div>
              {!isCollapsed && (dropdownOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            </button>
            {dropdownOpen && (
              <div
                className="glass-card"
                style={{
                  position: 'absolute',
                  left: isCollapsed ? '4px' : '16px',
                  right: isCollapsed ? '4px' : '16px',
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
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      fontSize: '0.78rem'
                    }}
                    title={tenant.name}
                  >
                    <span>{tenant.logo}</span>
                    {!isCollapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenant.name}</span>}
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
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '10px',
              padding: isCollapsed ? '10px' : '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)'
            }}
            title="Super Admin"
          >
            <ShieldAlert size={18} className="badge-danger" style={{ color: 'var(--danger-color)', flexShrink: 0 }} />
            {!isCollapsed && (
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--danger-color)' }}>
                  Super Admin
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Agency Owner Console
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapse/Expand Toggle Button (Desktop helper) */}
      <div className="desktop-collapse-btn" style={{ padding: '0 16px 12px 16px' }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="btn btn-secondary"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isCollapsed ? '0px' : '8px',
            padding: '6px',
            fontSize: '0.72rem',
            backgroundColor: 'rgba(255,255,255,0.01)',
            borderColor: 'var(--border-glass)',
            color: 'var(--text-secondary)'
          }}
          title={isCollapsed ? 'Expand sidebar menu' : 'Collapse sidebar menu'}
        >
          {isCollapsed ? '➡️' : '⬅️ Collapse Sidebar'}
        </button>
      </div>

      {/* Navigation Items */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: isCollapsed ? '0 8px' : '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {currentRole === 'tenant' ? (
          groups.map((group, gIdx) => (
            <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {!isCollapsed && (
                <div style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 14px 2px 8px' }}>
                  {group.title}
                </div>
              )}
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
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      alignItems: 'center',
                      gap: isCollapsed ? '0px' : '12px',
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? '600' : '500',
                      backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary-color)' : 'none',
                      borderRadius: isActive ? 'var(--radius-sm)' : '4px',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                    title={tab.label}
                  >
                    <Icon size={16} style={{ color: isActive ? 'var(--primary-color)' : 'var(--text-muted)', flexShrink: 0 }} />
                    {!isCollapsed && tab.label}
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
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  alignItems: 'center',
                  gap: isCollapsed ? '0px' : '12px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? '600' : '500',
                  backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary-color)' : 'none',
                  borderRadius: isActive ? 'var(--radius-sm)' : '4px',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
                title={tab.label}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--primary-color)' : 'var(--text-muted)', flexShrink: 0 }} />
                {!isCollapsed && tab.label}
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
            gap: isCollapsed ? '0px' : '8px',
            padding: '8px 12px',
            fontSize: '0.8rem',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            borderColor: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--danger-color)',
            cursor: 'pointer'
          }}
          title="Log Out"
        >
          <span>🚪</span> {!isCollapsed && 'Log Out'}
        </button>
      </div>
    </div>
  );
};
