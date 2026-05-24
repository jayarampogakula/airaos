import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Server, ShoppingBag, HardDrive, CheckCircle2, 
  Play, AlertTriangle, DollarSign, Globe, Key, BookOpen, Save, Cpu, Terminal 
} from 'lucide-react';
import { Tenant } from '../types';

interface SuperAdminViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tenants: Tenant[];
  onToggleTenantStatus: (tenantId: string) => void;
  onInstallTemplate: (templateName: string) => void;
  onVisitTenant: (tenantId: string) => void;
}

export interface IntegrationSettings {
  difyUrl: string;
  difyApiKey: string;
  chatwootUrl: string;
  chatwootInboxToken: string;
  n8nUrl: string;
  n8nApiKey: string;
  calUrl: string;
  twentyUrl: string;
  twentyApiKey: string;
  dograhUrl: string;
  dograhApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  openaiApiKey: string;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  activeTab,
  setActiveTab,
  tenants,
  onToggleTenantStatus,
  onInstallTemplate,
  onVisitTenant
}) => {
  const [installedTemplate, setInstalledTemplate] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Billing Pricing and Limit variables in state
  const [plansSettings, setPlansSettings] = useState(() => {
    const stored = localStorage.getItem('platform_billing_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          growthPrice: parsed.growthPrice ?? 499,
          growthChats: parsed.growthChats ?? 2000,
          growthVoice: parsed.growthVoice ?? 500,
          growthWebsites: parsed.growthWebsites ?? 2,
          scalePrice: parsed.scalePrice ?? 1200,
          scaleChats: parsed.scaleChats ?? 5000,
          scaleVoice: parsed.scaleVoice ?? 1000,
          scaleWebsites: parsed.scaleWebsites ?? 5,
          enterprisePrice: parsed.enterprisePrice ?? 2500,
          enterpriseChats: parsed.enterpriseChats ?? 10000,
          enterpriseVoice: parsed.enterpriseVoice ?? 2500,
          enterpriseWebsites: parsed.enterpriseWebsites ?? 999,
          overageChatRate: parsed.overageChatRate ?? 0.05,
          overageVoiceRate: parsed.overageVoiceRate ?? 0.15,
          inboundCallRate: parsed.inboundCallRate ?? 0.10,
          outboundCallRate: parsed.outboundCallRate ?? 0.20,
          voiceSynthesisRate: parsed.voiceSynthesisRate ?? 0.02
        };
      } catch (e) {}
    }
    return {
      growthPrice: 499,
      growthChats: 2000,
      growthVoice: 500,
      growthWebsites: 2,
      scalePrice: 1200,
      scaleChats: 5000,
      scaleVoice: 1000,
      scaleWebsites: 5,
      enterprisePrice: 2500,
      enterpriseChats: 10000,
      enterpriseVoice: 2500,
      enterpriseWebsites: 999,
      overageChatRate: 0.05,
      overageVoiceRate: 0.15,
      inboundCallRate: 0.10,
      outboundCallRate: 0.20,
      voiceSynthesisRate: 0.02
    };
  });

  // Integration settings state
  const [integrations, setIntegrations] = useState<IntegrationSettings>(() => {
    const stored = localStorage.getItem('coolify_integrations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          difyUrl: parsed.difyUrl || 'https://dify.my-agency.com',
          difyApiKey: parsed.difyApiKey || '',
          chatwootUrl: parsed.chatwootUrl || 'https://chatwoot.my-agency.com',
          chatwootInboxToken: parsed.chatwootInboxToken || '',
          n8nUrl: parsed.n8nUrl || 'https://n8n.my-agency.com',
          n8nApiKey: parsed.n8nApiKey || '',
          calUrl: parsed.calUrl || 'https://cal.my-agency.com/agency/30min',
          twentyUrl: parsed.twentyUrl || 'https://twenty.my-agency.com',
          twentyApiKey: parsed.twentyApiKey || '',
          dograhUrl: parsed.dograhUrl || 'http://localhost:3010',
          dograhApiKey: parsed.dograhApiKey || '',
          twilioAccountSid: parsed.twilioAccountSid || '',
          twilioAuthToken: parsed.twilioAuthToken || '',
          twilioPhoneNumber: parsed.twilioPhoneNumber || '',
          openaiApiKey: parsed.openaiApiKey || ''
        };
      } catch (e) {}
    }
    return {
      difyUrl: 'https://dify.my-agency.com',
      difyApiKey: '',
      chatwootUrl: 'https://chatwoot.my-agency.com',
      chatwootInboxToken: '',
      n8nUrl: 'https://n8n.my-agency.com',
      n8nApiKey: '',
      calUrl: 'https://cal.my-agency.com/agency/30min',
      twentyUrl: 'https://twenty.my-agency.com',
      twentyApiKey: '',
      dograhUrl: 'http://localhost:3010',
      dograhApiKey: '',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
      openaiApiKey: ''
    };
  });

  useEffect(() => {
    fetch('/api/integrations')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setIntegrations(prev => ({ ...prev, ...data }));
          localStorage.setItem('coolify_integrations', JSON.stringify(data));
        }
      })
      .catch(() => {
        console.warn('Backend integrations API not reachable. Using localStorage.');
      });
  }, []);

  const [infraGuideOpen, setInfraGuideOpen] = useState(false);

  const marketplaceTemplates = [
    { name: 'Clinic AI Receptionist', desc: 'Pre-trained dental and medical receptionist. Handles Calendar Scheduler bookings, basic co-pay FAQ, and emergency escalation.', sector: 'Medical' },
    { name: 'Real Estate Sales Agent', desc: 'Penthouse tours coordinator. Qualifies buyer budgets, details square footage layouts, and pushes contacts into CRM.', sector: 'Real Estate' },
    { name: 'Insurance Advisor', desc: 'Explains health and car deductible limits, matches policies, and logs quotes in the CRM pipeline.', sector: 'Finance' },
    { name: 'Law Firm Assistant', desc: 'Schedules legal consultations, checks conflict-of-interest indicators, and processes intake forms.', sector: 'Legal' },
    { name: 'Restaurant Booking Agent', desc: 'Manages table reservations, dietary preferences, and triggers Workflow Automator SMS alerts for reservation confirmations.', sector: 'Hospitality' },
    { name: 'Automotive Service Advisor (Leo)', desc: 'Pre-trained garage advisor. Qualifies mileage, checks brake checkup openings, lists repair service packages, and books service bays.', sector: 'Automotive' },
    { name: 'SaaS Onboarding Specialist (Clara)', desc: 'Assists developers with API keys, troubleshoot credentials rate limits, and matches client subscription plan benefits.', sector: 'Technology' },
    { name: 'Fitness Club Coordinator (Derrick)', desc: 'Coordinates gym trial passes, schedules fitness consultations, and details personal trainer rates/packages.', sector: 'Wellness' },
    { name: 'E-Commerce Lead Qualifier (Aria)', desc: 'Apparel sizing advisor. Recommends clothing sizes, qualifies shopper budgets, and captures purchase interests.', sector: 'Retail' }
  ];

  const handleInstall = (tplName: string) => {
    onInstallTemplate(tplName);
    setInstalledTemplate(tplName);
    setTimeout(() => setInstalledTemplate(null), 2500);
  };

  const handleSaveBilling = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('platform_billing_settings', JSON.stringify(plansSettings));
    setSaveSuccess('billing');
    setTimeout(() => setSaveSuccess(null), 2500);
  };

  const handleSaveIntegrations = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('coolify_integrations', JSON.stringify(integrations));
    
    fetch('/api/integrations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(integrations)
    })
      .then(() => {
        setSaveSuccess('integrations');
        setTimeout(() => setSaveSuccess(null), 2500);
      })
      .catch(err => {
        console.warn('Failed to save integrations to backend:', err);
        setSaveSuccess('integrations');
        setTimeout(() => setSaveSuccess(null), 2500);
      });
  };

  // Calculate platform metrics
  const totalMRR = tenants.reduce((acc, t) => {
    if (t.status === 'suspended') return acc;
    if (t.plan === 'Growth') return acc + plansSettings.growthPrice;
    if (t.plan === 'Scale') return acc + plansSettings.scalePrice;
    return acc + plansSettings.enterprisePrice;
  }, 0);

  const activeTenantsCount = tenants.filter(t => t.status === 'active').length;

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={24} style={{ color: 'var(--danger-color)' }} /> Super Admin Platform Control
          </h2>
          <p className="view-subtitle">Global agency infrastructure, client accounts subscription management, and template marketplaces.</p>
        </div>

        {/* Sub tabs switches synced to global activeTab */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <button 
            onClick={() => setActiveTab('tenants')} 
            className="btn" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.75rem', 
              backgroundColor: activeTab === 'tenants' ? 'var(--primary-color)' : 'transparent', 
              color: activeTab === 'tenants' ? 'white' : 'var(--text-secondary)',
              gap: '6px'
            }}
          >
            <Users size={14} /> Client Accounts
          </button>
          <button 
            onClick={() => setActiveTab('plans')} 
            className="btn" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.75rem', 
              backgroundColor: activeTab === 'plans' ? 'var(--primary-color)' : 'transparent', 
              color: activeTab === 'plans' ? 'white' : 'var(--text-secondary)',
              gap: '6px'
            }}
          >
            <DollarSign size={14} /> Billing & Plans
          </button>
          <button 
            onClick={() => setActiveTab('infrastructure')} 
            className="btn" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.75rem', 
              backgroundColor: activeTab === 'infrastructure' ? 'var(--primary-color)' : 'transparent', 
              color: activeTab === 'infrastructure' ? 'white' : 'var(--text-secondary)',
              gap: '6px'
            }}
          >
            <Server size={14} /> System Infrastructure
          </button>
          <button 
            onClick={() => setActiveTab('marketplace')} 
            className="btn" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.75rem', 
              backgroundColor: activeTab === 'marketplace' ? 'var(--primary-color)' : 'transparent', 
              color: activeTab === 'marketplace' ? 'white' : 'var(--text-secondary)',
              gap: '6px'
            }}
          >
            <ShoppingBag size={14} /> Template Marketplace
          </button>
        </div>
      </div>

      {activeTab === 'tenants' && (
        /* Tenants List */
        <div className="glass-panel" style={{ padding: '20px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>Client Accounts Ledgers</h3>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Subdomain URL</th>
                <th>Billing Subscription Plan</th>
                <th>Account Status</th>
                <th>Usage Load</th>
                <th>Controls</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>{t.logo}</span>
                      <span style={{ fontWeight: '600' }}>{t.name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.domain}</span></td>
                  <td>
                    <span className={`badge ${t.plan === 'Growth' ? 'badge-primary' : t.plan === 'Scale' ? 'badge-warning' : 'badge-danger'}`}>
                      {t.plan}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {t.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {t.id === 't-1' ? '842 / 2000 chats' : t.id === 't-2' ? '1240 / 5000 chats' : '154 / 2000 chats'}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => onVisitTenant(t.id)}
                      className="btn btn-primary"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        marginRight: '6px',
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      👁️ Visit Account
                    </button>
                    <button
                      onClick={() => onToggleTenantStatus(t.id)}
                      className="btn"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        backgroundColor: t.status === 'active' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: t.status === 'active' ? 'var(--danger-color)' : 'var(--success-color)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {t.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'plans' && (
        /* Billing & Plans Control Panel */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Revenue KPI Section */}
          <div className="grid-cols-12">
            <div className="col-span-4 glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--success-color)22', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                💲
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PLATFORM ACTIVE MRR</span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', fontFamily: 'Space Grotesk, sans-serif' }}>
                  ${totalMRR.toLocaleString()}/mo
                </h4>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Calculated from {activeTenantsCount} active client seats</span>
              </div>
            </div>

            <div className="col-span-4 glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--primary-glow)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                🏢
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL PROVISIONED SEATS</span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {tenants.length} Tenants
                </h4>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{activeTenantsCount} active • {tenants.length - activeTenantsCount} suspended</span>
              </div>
            </div>

            <div className="col-span-4 glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                🚨
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>USAGE WARNING ALERTS</span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {tenants.some(t => t.id === 't-1' || t.id === 't-2') ? '1 Account' : '0 Accounts'}
                </h4>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Apex Heights is at 24% limit. Smile Dental at 42%.</span>
              </div>
            </div>
          </div>

          <div className="grid-cols-12">
            {/* Pricing Adjuster Panel */}
            <form onSubmit={handleSaveBilling} className="col-span-8 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={18} style={{ color: 'var(--primary-color)' }} /> Subscription Tier Configuration
                </h3>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Save size={14} /> Save Tiers Config
                </button>
              </div>

              {saveSuccess === 'billing' && (
                <div style={{ padding: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Subscription boundaries and base costs synchronized globally.
                </div>
              )}

              {/* Tiers Settings grids */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Growth */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '14px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '10px' }}>Growth Tier (Small SME)</h4>
                  <div className="grid-cols-12">
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Base Price ($/mo)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.growthPrice} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, growthPrice: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Monthly Chat Cap</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.growthChats} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, growthChats: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Monthly Voice Mins Cap</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.growthVoice} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, growthVoice: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Web Generation Cap</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.growthWebsites ?? 2} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, growthWebsites: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                  </div>
                </div>

                {/* Scale */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '14px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', marginBottom: '10px' }}>Scale Tier (Mid-size Firm)</h4>
                  <div className="grid-cols-12">
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Base Price ($/mo)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.scalePrice} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, scalePrice: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Monthly Chat Cap</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.scaleChats} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, scaleChats: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Monthly Voice Mins Cap</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.scaleVoice} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, scaleVoice: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Web Generation Cap</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.scaleWebsites ?? 5} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, scaleWebsites: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                  </div>
                </div>

                {/* Enterprise */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '14px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger-color)', marginBottom: '10px' }}>Enterprise Tier (Large Corporate)</h4>
                  <div className="grid-cols-12">
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Base Price ($/mo)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.enterprisePrice} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, enterprisePrice: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Monthly Chat Cap</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.enterpriseChats} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, enterpriseChats: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Monthly Voice Mins Cap</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.enterpriseVoice} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, enterpriseVoice: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="col-span-3 form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Web Generation Cap</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={plansSettings.enterpriseWebsites ?? 999} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, enterpriseWebsites: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Overage & Alerts panel */}
            <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Call Center Costing & Rates Card */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                  Call Costing & Rates Configuration
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Chat Overage Fee ($/chat)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-input" 
                        value={plansSettings.overageChatRate} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, overageChatRate: parseFloat(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Voice Overage Fee ($/min)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-input" 
                        value={plansSettings.overageVoiceRate} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, overageVoiceRate: parseFloat(e.target.value) || 0 })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Inbound Call Rate ($/min)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-input" 
                        value={plansSettings.inboundCallRate ?? 0.10} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, inboundCallRate: parseFloat(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Outbound Call Rate ($/min)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-input" 
                        value={plansSettings.outboundCallRate ?? 0.20} 
                        onChange={(e) => setPlansSettings({ ...plansSettings, outboundCallRate: parseFloat(e.target.value) || 0 })} 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>TTS Synthesis ($/1k char)</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="form-input" 
                      value={plansSettings.voiceSynthesisRate ?? 0.02} 
                      onChange={(e) => setPlansSettings({ ...plansSettings, voiceSynthesisRate: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span>Overages are calculated at the end of billing cycles and billed automatically via Stripe Connect.</span>
                  </div>
                </div>
              </div>

              {/* Tenants near limit list */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Billing Limit Warnings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ padding: '10px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      <span>Smile Dental Clinic</span>
                      <span style={{ color: '#f59e0b' }}>42.1% Limit</span>
                    </div>
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', margin: '4px 0' }}>
                      <div style={{ height: '100%', width: '42.1%', background: '#f59e0b' }}></div>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>842 / 2000 chats used</span>
                      <span>215 / 500 voice mins used</span>
                    </div>
                  </div>

                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      <span>Apex Heights</span>
                      <span style={{ color: 'var(--text-muted)' }}>24.8% Limit</span>
                    </div>
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', margin: '4px 0' }}>
                      <div style={{ height: '100%', width: '24.8%', background: 'var(--primary-color)' }}></div>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>1240 / 5000 chats used</span>
                      <span>380 / 1000 voice mins used</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'infrastructure' && (
        /* Infrastructure Gauges + Coolify Configuration & Setup Guides */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: Docker Containers health metrics (The existing ones) */}
          <div className="grid-cols-12">
            
            {/* Key Infrastructure Parameters */}
            <div className="col-span-8 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={16} style={{ color: 'var(--primary-color)' }} /> Microservices & Nodes (Coolify/Docker)
                </h3>
                <button 
                  onClick={() => setInfraGuideOpen(!infraGuideOpen)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <BookOpen size={12} /> {infraGuideOpen ? 'Hide Setup Tutorial' : 'VPS Setup Guide'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem' }}>🐳</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Docker Swarm Nodes</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>12 containers running under Traefik router reverse proxy</div>
                    </div>
                  </div>
                  <span className="badge badge-success">Operational (100% health)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem' }}>🗄️</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>PostgreSQL vector database</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Handling 184,000 vector chunks (Smile / Apex catalogs)</div>
                    </div>
                  </div>
                  <span className="badge badge-success">Online (0.8ms query latency)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚡</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Redis Caches (Session Storage)</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>99.8% memory hit rate • 0.2MB usage</div>
                    </div>
                  </div>
                  <span className="badge badge-success">Active</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem' }}>📦</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>MinIO Object Store (S3-Compatible)</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ingesting PDF/TXT documents. Using 1.2 TB / 5.0 TB limits.</div>
                    </div>
                  </div>
                  <span className="badge badge-success">Healthy</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎙️</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Voice AI Server Gateway</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {integrations.dograhUrl ? `Live connection on ${integrations.dograhUrl}` : 'Running mock voice synthesis gateway'}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${integrations.dograhUrl ? 'badge-success' : 'badge-warning'}`}>
                    {integrations.dograhUrl ? 'Online' : 'Simulation'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚙️</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Workflow Automation Engine</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {integrations.n8nUrl ? `Visual designer linked on ${integrations.n8nUrl}` : 'Running simulated workflow automation'}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${integrations.n8nUrl ? 'badge-success' : 'badge-warning'}`}>
                    {integrations.n8nUrl ? 'Online' : 'Simulation'}
                  </span>
                </div>
              </div>
            </div>

            {/* Infrastructure Health Status info card */}
            <div className="col-span-4 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>System Health Ledger</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GLOBAL SERVER CPU LOAD</span>
                  <h4 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0', fontFamily: 'Space Grotesk, sans-serif' }}>24.2%</h4>
                  <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '24.2%', background: 'var(--primary-color)' }}></div>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>RAM USAGE RATE</span>
                  <h4 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0', fontFamily: 'Space Grotesk, sans-serif' }}>8.4 GB / 32 GB</h4>
                  <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '26%', background: 'var(--accent-color)' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success-color)', flexShrink: 0 }} />
                  <span>All routes resolving under SSL. Global Traefik routing tables synced. No network leakage detected.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Guide dropdown panel */}
          {infraGuideOpen && (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px', background: 'rgba(10,13,22,0.6)', border: '1px solid var(--primary-color)44' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', marginBottom: '14px' }}>
                <Terminal size={18} /> VPS Self-Hosted Setup Guide (using Coolify)
              </h3>

              <div style={{ fontSize: '0.8rem', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '14px', color: 'var(--text-secondary)' }}>
                <p>
                  Coolify is an open-source, self-hosted Heroku/Netlify alternative. It manages your Docker containers, databases, Traefik reverse proxy, SSL generation, and environment variables on your own VPS.
                </p>

                <div>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Step 1: Install Coolify on VPS</h4>
                  <p>Order a clean VPS (Ubuntu 22.04 or Debian 12, minimum 4GB RAM). Connect via SSH and execute the installer:</p>
                  <pre style={{ background: '#070a12', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)', fontFamily: 'monospace', overflowX: 'auto', fontSize: '0.75rem', color: '#818cf8', margin: '6px 0' }}>
                    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
                  </pre>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Once completed, visit <strong>http://your_vps_ip:8000</strong> to configure your admin username and password.
                  </span>
                </div>

                <div>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Step 2: Deploy Required Services</h4>
                  <p>In the Coolify dashboard, select <strong>"Create New Resource" &rarr; "Service"</strong> and deploy the following marketplace items:</p>
                  <ul style={{ paddingLeft: '20px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>Dify AI Platform:</strong> Deploy Dify (includes API, Webapp, Sandbox, VectorDB, Redis). Map custom domain (e.g. <code>https://dify.myagency.com</code>).</li>
                    <li><strong>Chatwoot Live Chat:</strong> Deploy Chatwoot. Setup PostgreSQL DB. Map domain (e.g. <code>https://chatwoot.myagency.com</code>).</li>
                    <li><strong>Workflow Automation:</strong> Deploy the workflow engine. Add environment variable <code>ENCRYPTION_KEY</code>. Map domain (e.g. <code>https://workflows.myagency.com</code>).</li>
                    <li><strong>Calendar Scheduler:</strong> Deploy postgres and NextJS app container, configure booking endpoints. Map domain (e.g. <code>https://scheduler.myagency.com</code>).</li>
                    <li><strong>Twenty CRM:</strong> Deploy Twenty CRM container. Setup database credentials. Map domain (e.g. <code>https://twenty.myagency.com</code>).</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Step 3: Connect Services in Integration Settings</h4>
                  <p>Once deployed, copy the individual service API tokens (e.g. Dify app tokens, Workflow Automator api key, Chatwoot widget snippet tokens) and input them in the <strong>Coolify Integration Manager</strong> below. The frontend dashboard will instantly swap from mockup simulations to connecting and loading your real endpoints.</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Integrations Settings Form */}
          <form onSubmit={handleSaveIntegrations} className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} style={{ color: 'var(--accent-color)' }} /> Coolify Integration Manager (VPS Service Mapping)
              </h3>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Save size={14} /> Save Integration Mapping
              </button>
            </div>

            {saveSuccess === 'integrations' && (
              <div style={{ padding: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
                <CheckCircle2 size={14} /> VPS microservice endpoints stored in localStorage. Dynamic layout views updated!
              </div>
            )}

            <div className="grid-cols-12" style={{ gap: '20px' }}>
              
              {/* Dify CRM Mapping */}
              <div className="col-span-6 glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🤖</span> Dify AI Engine (Chat & Knowledge API)
                </h4>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Dify Self-Hosted URL</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.difyUrl} 
                    onChange={(e) => setIntegrations({ ...integrations, difyUrl: e.target.value })} 
                    placeholder="https://dify.yourdomain.com"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Dify Global API Token</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={12} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type="password" 
                      className="form-input" 
                      style={{ paddingLeft: '28px' }}
                      value={integrations.difyApiKey} 
                      onChange={(e) => setIntegrations({ ...integrations, difyApiKey: e.target.value })} 
                      placeholder="app-xxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>
                </div>
              </div>

              {/* Chatwoot Mapping */}
              <div className="col-span-6 glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💬</span> Chatwoot Live Chat & Inbox
                </h4>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Chatwoot Console URL</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.chatwootUrl} 
                    onChange={(e) => setIntegrations({ ...integrations, chatwootUrl: e.target.value })} 
                    placeholder="https://chatwoot.yourdomain.com"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Website Channel Inbox Token</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={12} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type="password" 
                      className="form-input" 
                      style={{ paddingLeft: '28px' }}
                      value={integrations.chatwootInboxToken} 
                      onChange={(e) => setIntegrations({ ...integrations, chatwootInboxToken: e.target.value })} 
                      placeholder="token-xxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>
                </div>
              </div>

              {/* Workflow Automation Mapping */}
              <div className="col-span-4 glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚙️</span> Workflow Automation
                </h4>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Workflow Webhook base URL</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.n8nUrl} 
                    onChange={(e) => setIntegrations({ ...integrations, n8nUrl: e.target.value })} 
                    placeholder="https://workflows.yourdomain.com"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Engine API Key</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={integrations.n8nApiKey} 
                    onChange={(e) => setIntegrations({ ...integrations, n8nApiKey: e.target.value })} 
                    placeholder="api_key_xxxxxxxxxxxxxxxx"
                  />
                </div>
              </div>

              {/* Calendar Scheduler Mapping */}
              <div className="col-span-4 glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📅</span> Calendar Scheduling Engine
                </h4>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Booking Link / Page Slug</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.calUrl} 
                    onChange={(e) => setIntegrations({ ...integrations, calUrl: e.target.value })} 
                    placeholder="https://scheduler.yourdomain.com/team/reception"
                  />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Used to generate dynamically loaded calendar frames for patients/customers during live agent chats.
                </div>
              </div>

              {/* Twenty CRM Mapping */}
              <div className="col-span-4 glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏢</span> Twenty CRM API Integrations
                </h4>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Twenty CRM Endpoint</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.twentyUrl} 
                    onChange={(e) => setIntegrations({ ...integrations, twentyUrl: e.target.value })} 
                    placeholder="https://twenty.yourdomain.com"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Twenty API Key</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={integrations.twentyApiKey} 
                    onChange={(e) => setIntegrations({ ...integrations, twentyApiKey: e.target.value })} 
                    placeholder="twenty_api_key_xxxxxxxx"
                  />
                </div>
              </div>

              {/* SIP Gateway Mapping */}
              <div className="col-span-4 glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎙️</span> Voice AI Gateway (SIP)
                </h4>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Voice Server URL</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.dograhUrl} 
                    onChange={(e) => setIntegrations({ ...integrations, dograhUrl: e.target.value })} 
                    placeholder="http://localhost:3010"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Voice API / JWT Key</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={integrations.dograhApiKey} 
                    onChange={(e) => setIntegrations({ ...integrations, dograhApiKey: e.target.value })} 
                    placeholder="auth_xxxxxxxx"
                  />
                </div>
              </div>

              {/* Twilio Carrier Integration */}
              <div className="col-span-4 glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📞</span> Twilio Voice Integration
                </h4>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Twilio Account SID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.twilioAccountSid} 
                    onChange={(e) => setIntegrations({ ...integrations, twilioAccountSid: e.target.value })} 
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Twilio Auth Token</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={integrations.twilioAuthToken} 
                    onChange={(e) => setIntegrations({ ...integrations, twilioAuthToken: e.target.value })} 
                    placeholder="auth_token_xxxxxxxxxxxxxxxxxx"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Linked Twilio Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.twilioPhoneNumber} 
                    onChange={(e) => setIntegrations({ ...integrations, twilioPhoneNumber: e.target.value })} 
                    placeholder="+15550192834"
                  />
                </div>
              </div>

              {/* OpenAI API Key Integration */}
              <div className="col-span-12 glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(99, 102, 241, 0.2)', background: 'rgba(99, 102, 241, 0.02)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🧠</span> OpenAI API Integration (AI Services & Website Builder Engine)
                </h4>
                <div className="grid-cols-12" style={{ gap: '16px' }}>
                  <div className="col-span-8 form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>OpenAI API Key (Required for AI generation & background microservices)</label>
                    <div style={{ position: 'relative' }}>
                      <Key size={12} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                      <input 
                        type="password" 
                        className="form-input" 
                        style={{ paddingLeft: '28px' }}
                        value={integrations.openaiApiKey || ''} 
                        onChange={(e) => setIntegrations({ ...integrations, openaiApiKey: e.target.value })} 
                        placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                    </div>
                  </div>
                  <div className="col-span-4" style={{ display: 'flex', alignItems: 'flex-end', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Used globally to generate custom business layouts, index vector catalogs, and orchestrate client chatbot agents.
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      )}

      {activeTab === 'marketplace' && (
        /* Templates Marketplace */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {installedTemplate && (
            <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>Successfully installed template: <strong>{installedTemplate}</strong> into selected Tenant Workspace!</span>
            </div>
          )}

          <div className="grid-cols-12">
            {marketplaceTemplates.map((tpl, i) => (
              <div key={i} className="col-span-4 glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.6rem' }}>{tpl.sector}</span>
                    <span style={{ fontSize: '1.1rem' }}>🛍️</span>
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '6px' }}>{tpl.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {tpl.desc}
                  </p>
                </div>
                
                <button
                  onClick={() => handleInstall(tpl.name)}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.75rem', padding: '6px', marginTop: '16px', background: 'rgba(255,255,255,0.02)' }}
                >
                  One-Click Install
                </button>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};
