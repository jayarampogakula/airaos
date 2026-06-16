import React from 'react';
import {
  LayoutDashboard, Inbox, Phone, Workflow, Users, Calendar,
  Bot, Database, Network, MessageSquareCode, Globe, BrainCircuit,
  PlugZap, Shield, Palette, CreditCard, Settings, LifeBuoy,
  ChevronDown, ChevronRight, AlertCircle, ShieldAlert, Key, ShoppingBag, MessageSquare,
  TrendingUp, Target, Eye, RefreshCw, Play, BarChart3, Megaphone, GitBranch, Zap, Clock
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
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const groups = [
    {
      title: '📊 Dashboard',
      tabs: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'revenue_dashboard', label: 'Revenue', icon: TrendingUp },
        { id: 'analytics_center', label: 'Analytics', icon: BarChart3 }
      ]
    },
    {
      title: '🎯 Leads',
      tabs: [
        { id: 'lead_sources', label: 'Lead Sources', icon: Target },
        { id: 'visitor_intel', label: 'Website Visitors', icon: Eye },
        { id: 'lead_scoring', label: 'Lead Qualification', icon: Zap },
        { id: 'missed_recovery', label: 'Lead Recovery', icon: RefreshCw }
      ]
    },
    {
      title: '👤 Contacts',
      tabs: [
        { id: 'contacts', label: 'All Contacts', icon: Users }
      ]
    },
    {
      title: '💬 Conversations',
      tabs: [
        { id: 'inbox', label: 'Unified Inbox', icon: Inbox },
        { id: 'voice', label: 'Voice AI', icon: Phone }
      ]
    },
    {
      title: '💼 Sales',
      tabs: [
        { id: 'crm', label: 'Pipeline', icon: GitBranch },
        { id: 'scheduler', label: 'Calendar', icon: Calendar }
      ]
    },
    {
      title: '📣 Marketing',
      tabs: [
        { id: 'marketing_campaigns', label: 'Campaigns', icon: Megaphone },
        { id: 'workflow', label: 'Automation', icon: Workflow }
      ]
    },
    {
      title: '🤖 AI Employees',
      tabs: [
        { id: 'employees', label: 'Agent Builder', icon: Bot },
        { id: 'multi_agents', label: 'AI Team', icon: Network },
        { id: 'knowledge', label: 'Knowledge Hub', icon: Database },
        { id: 'crew', label: 'Orchestrator', icon: GitBranch }
      ]
    },
    {
      title: '🌐 Channels',
      tabs: [
        { id: 'widget', label: 'Chat Widget', icon: MessageSquareCode }
      ]
    },
    {
      title: '⚙️ Settings',
      tabs: [
        { id: 'brain', label: 'AI Settings', icon: BrainCircuit },
        { id: 'integrations', label: 'Integrations', icon: PlugZap },
        { id: 'team', label: 'Team & Permissions', icon: Shield },
        { id: 'whitelabel', label: 'White Label', icon: Palette },
        { id: 'billing', label: 'Billing & Credits', icon: CreditCard },
        { id: 'tenant_settings', label: 'System Settings', icon: Settings },
        { id: 'tenant_support', label: 'Help & Support', icon: LifeBuoy }
      ]
    }
  ];

  const adminTabs = [
    { id: 'tenants', label: 'Manage Tenants', icon: Users },
    { id: 'plans', label: 'Billing & Plans', icon: Settings },
    { id: 'infrastructure', label: 'Infrastructure Status', icon: Database },
    { id: 'settings', label: 'API & LLM Settings', icon: Key },
    { id: 'marketplace', label: 'Marketplace Templates', icon: ShoppingBag },
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
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>AI Sales Operating System</p>
          </div>
        )}
      </div>

      {/* Collapse/Expand Toggle Button */}
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
                <div style={{
                  fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 14px 2px 8px'
                }}>
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
                      gap: isCollapsed ? '0px' : '10px',
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
                    {!isCollapsed && (
                      <span style={{ flex: 1, textAlign: 'left' }}>{tab.label}</span>
                    )}
                    {!isCollapsed && (tab as any).badge && (
                      <span style={{
                        fontSize: '0.55rem',
                        padding: '1px 5px',
                        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                        borderRadius: '50px',
                        color: 'white',
                        fontWeight: '700',
                        letterSpacing: '0.05em'
                      }}>
                        {(tab as any).badge}
                      </span>
                    )}
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
