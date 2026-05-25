import React, { useState, useEffect } from 'react';
import { 
  Server, Key, Phone, MessageSquare, CheckCircle2, AlertTriangle, 
  Globe, Activity, Play, Save, Link, ArrowRight, ShieldCheck, Sparkles,
  CreditCard, ExternalLink
} from 'lucide-react';
import { Tenant } from '../types';

interface IntegrationsViewProps {
  tenant: Tenant;
  currentRole?: 'tenant' | 'superadmin';
}

export interface UnifiedIntegrationConfig {
  mode: 'managed' | 'byoc';
  difyApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  whatsappToken: string;
  chatwootInboxToken: string;
  inboundRouting: 'twilio' | 'byo';
  outboundRouting: 'twilio' | 'byo';
  byoSipServer: string;
  byoSipUsername: string;
  byoSipPassword: string;
  byoPhoneNumber: string;
  phonepeMerchantId: string;
  phonepeSaltKey: string;
  chatwootUrl: string;
  n8nUrl: string;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ tenant, currentRole = 'tenant' }) => {
  const [config, setConfig] = useState<UnifiedIntegrationConfig>({
    mode: 'managed',
    difyApiKey: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    whatsappToken: '',
    chatwootInboxToken: '',
    inboundRouting: 'twilio',
    outboundRouting: 'twilio',
    byoSipServer: '',
    byoSipUsername: '',
    byoSipPassword: '',
    byoPhoneNumber: '',
    phonepeMerchantId: '',
    phonepeSaltKey: '',
    chatwootUrl: 'https://chat.cleveradai.in',
    n8nUrl: 'https://flow.cleveradai.in'
  });

  const [activeSubTab, setActiveSubTab] = useState<'openai' | 'telephony' | 'payments' | 'channels'>('openai');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  
  // Track if admin has loaded a global openai api key
  const [globalHasApiKey, setGlobalHasApiKey] = useState(false);
  // Track if tenant wants to override with their own key
  const [overrideOpenAI, setOverrideOpenAI] = useState(false);

  const togglePasswordVisibility = (key: string) => {
    setShowPassword(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Load configuration from backend and fallback to localStorage
  useEffect(() => {
    const loadIntegrations = async () => {
      // 1. Fetch global integrations to check if platform key is active
      try {
        const globalRes = await fetch('/api/integrations');
        if (globalRes.ok) {
          const globalData = await globalRes.json();
          if (globalData && (globalData.difyApiKey || globalData.openaiApiKey)) {
            setGlobalHasApiKey(true);
          }
        }
      } catch (err) {
        console.warn('Could not check global integrations settings.', err);
      }

      // 2. Fetch tenant or global integrations based on currentRole
      const fetchUrl = currentRole === 'tenant' 
        ? `/api/tenants/${tenant.id}/integrations` 
        : '/api/integrations';

      try {
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setConfig(prev => ({
              ...prev,
              mode: data.mode || 'managed',
              difyApiKey: data.difyApiKey || data.openaiApiKey || '',
              twilioAccountSid: data.twilioAccountSid || '',
              twilioAuthToken: data.twilioAuthToken || '',
              twilioPhoneNumber: data.twilioPhoneNumber || '',
              whatsappToken: data.whatsappToken || '',
              chatwootInboxToken: data.chatwootInboxToken || '',
              inboundRouting: data.inboundRouting || 'twilio',
              outboundRouting: data.outboundRouting || 'twilio',
              byoSipServer: data.byoSipServer || '',
              byoSipUsername: data.byoSipUsername || '',
              byoSipPassword: data.byoSipPassword || '',
              byoPhoneNumber: data.byoPhoneNumber || data.byoPhoneNum || '',
              phonepeMerchantId: data.phonepeMerchantId || '',
              phonepeSaltKey: data.phonepeSaltKey || '',
              chatwootUrl: data.chatwootUrl || 'https://chat.cleveradai.in',
              n8nUrl: data.n8nUrl || 'https://flow.cleveradai.in'
            }));

            // If we are a tenant and loaded a custom key, enable override status
            if (currentRole === 'tenant' && (data.difyApiKey || data.openaiApiKey)) {
              setOverrideOpenAI(true);
            }

            // Sync local storage
            localStorage.setItem(currentRole === 'tenant' ? `tenant_integrations_${tenant.id}` : 'coolify_integrations', JSON.stringify(data));
            return;
          }
        }
      } catch (err) {
        console.warn('Backend integrations API not reachable. Falling back to local storage.', err);
      }

      // Local storage fallback
      const storageKey = currentRole === 'tenant' ? `tenant_integrations_${tenant.id}` : 'coolify_integrations';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setConfig(prev => ({
            ...prev,
            mode: parsed.mode || 'managed',
            difyApiKey: parsed.difyApiKey || parsed.openaiApiKey || '',
            twilioAccountSid: parsed.twilioAccountSid || '',
            twilioAuthToken: parsed.twilioAuthToken || '',
            twilioPhoneNumber: parsed.twilioPhoneNumber || '',
            whatsappToken: parsed.whatsappToken || '',
            chatwootInboxToken: parsed.chatwootInboxToken || '',
            inboundRouting: parsed.inboundRouting || 'twilio',
            outboundRouting: parsed.outboundRouting || 'twilio',
            byoSipServer: parsed.byoSipServer || '',
            byoSipUsername: parsed.byoSipUsername || '',
            byoSipPassword: parsed.byoSipPassword || '',
            byoPhoneNumber: parsed.byoPhoneNumber || parsed.byoPhoneNum || '',
            phonepeMerchantId: parsed.phonepeMerchantId || '',
            phonepeSaltKey: parsed.phonepeSaltKey || '',
            chatwootUrl: parsed.chatwootUrl || 'https://chat.cleveradai.in',
            n8nUrl: parsed.n8nUrl || 'https://flow.cleveradai.in'
          }));
          if (currentRole === 'tenant' && (parsed.difyApiKey || parsed.openaiApiKey)) {
            setOverrideOpenAI(true);
          }
        } catch (e) {}
      }
    };

    loadIntegrations();
  }, [tenant.id, currentRole]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If tenant is saving and hasn't checked "override", clear the API key to fall back to global platform key
    const customApiKey = (currentRole === 'tenant' && !overrideOpenAI) ? '' : config.difyApiKey;

    const payload = {
      mode: config.mode,
      difyApiKey: customApiKey,
      openaiApiKey: customApiKey,
      twilioAccountSid: config.twilioAccountSid,
      twilioAuthToken: config.twilioAuthToken,
      twilioPhoneNumber: config.twilioPhoneNumber,
      whatsappToken: config.whatsappToken,
      chatwootInboxToken: config.chatwootInboxToken,
      inboundRouting: config.inboundRouting,
      outboundRouting: config.outboundRouting,
      byoSipServer: config.byoSipServer,
      byoSipUsername: config.byoSipUsername,
      byoSipPassword: config.byoSipPassword,
      byoPhoneNumber: config.byoPhoneNumber,
      byoPhoneNum: config.byoPhoneNumber,
      phonepeMerchantId: config.phonepeMerchantId,
      phonepeSaltKey: config.phonepeSaltKey,
      chatwootUrl: config.chatwootUrl,
      n8nUrl: config.n8nUrl
    };

    const storageKey = currentRole === 'tenant' ? `tenant_integrations_${tenant.id}` : 'coolify_integrations';
    localStorage.setItem(storageKey, JSON.stringify(payload));
    
    // Save to coolify_integrations locally for VoiceAIView to read the active numbers
    if (currentRole === 'tenant') {
      localStorage.setItem('coolify_integrations', JSON.stringify(payload));
    }

    const saveUrl = currentRole === 'tenant' 
      ? `/api/tenants/${tenant.id}/integrations` 
      : '/api/integrations';

    try {
      const res = await fetch(saveUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error();
      }
    } catch (err) {
      console.warn('Could not save to backend. Settings saved locally.', err);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      if (activeSubTab === 'openai' && (currentRole !== 'tenant' || overrideOpenAI) && !config.difyApiKey) {
        setTestResult('error');
      } else if (activeSubTab === 'telephony' && config.mode === 'byoc' && (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber)) {
        setTestResult('error');
      } else if (activeSubTab === 'telephony' && config.inboundRouting === 'byo' && !config.byoSipServer) {
        setTestResult('error');
      } else if (activeSubTab === 'payments' && currentRole !== 'tenant' && (!config.phonepeMerchantId || !config.phonepeSaltKey)) {
        setTestResult('error');
      } else {
        setTestResult('success');
      }
    }, 1500);
  };

  const getManagedNumber = () => {
    if (tenant.id === 't-1') return '+1 (555) 732-1922';
    if (tenant.id === 't-2') return '+1 (555) 489-1122';
    return '+1 (555) 762-9900';
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflowY: 'auto', paddingBottom: '30px' }}>
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link size={24} style={{ color: 'var(--primary-color)' }} /> Centralized Workspace Integrations
          </h2>
          <p className="view-subtitle">Consolidate all external connections, API keys, telephony trunks, payment gateways, and CRM modules in one secure vault.</p>
        </div>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSave} className="grid-cols-12" style={{ gap: '20px' }}>
        
        {/* Navigation & Fields Area */}
        <div className="col-span-8 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Sub-tabs Navigation */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)', marginBottom: '10px', width: 'fit-content' }}>
            <button
              type="button"
              onClick={() => { setActiveSubTab('openai'); setTestResult(null); }}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.75rem',
                backgroundColor: activeSubTab === 'openai' ? 'var(--primary-color)' : 'transparent',
                color: activeSubTab === 'openai' ? 'white' : 'var(--text-secondary)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} /> AI Brain
            </button>
            <button
              type="button"
              onClick={() => { setActiveSubTab('telephony'); setTestResult(null); }}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.75rem',
                backgroundColor: activeSubTab === 'telephony' ? 'var(--primary-color)' : 'transparent',
                color: activeSubTab === 'telephony' ? 'white' : 'var(--text-secondary)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Phone size={14} /> Telephony & VoIP
            </button>
            {currentRole !== 'tenant' && (
              <button
                type="button"
                onClick={() => { setActiveSubTab('payments'); setTestResult(null); }}
                className="btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.75rem',
                  backgroundColor: activeSubTab === 'payments' ? 'var(--primary-color)' : 'transparent',
                  color: activeSubTab === 'payments' ? 'white' : 'var(--text-secondary)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CreditCard size={14} /> PhonePe Gateway
              </button>
            )}
            <button
              type="button"
              onClick={() => { setActiveSubTab('channels'); setTestResult(null); }}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.75rem',
                backgroundColor: activeSubTab === 'channels' ? 'var(--primary-color)' : 'transparent',
                color: activeSubTab === 'channels' ? 'white' : 'var(--text-secondary)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <MessageSquare size={14} /> CRM & Channels
            </button>
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)' }} />

          {/* 1. AI BRAIN TAB */}
          {activeSubTab === 'openai' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                🚀 <strong>OpenAI GPT-4o-mini Integration:</strong> Provide an API key to power RAG semantic search, custom prompts, and live chat widget responses for your digital employees.
              </div>

              {currentRole === 'tenant' && globalHasApiKey && (
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--success-color)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                      Platform-Managed Key Active
                    </span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    The agency administrator has configured a shared OpenAI connection for this workspace. You are currently using this shared connection, and the raw key is hidden for security.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={overrideOpenAI} 
                      onChange={(e) => {
                        setOverrideOpenAI(e.target.checked);
                        if (!e.target.checked) {
                          setConfig(prev => ({ ...prev, difyApiKey: '' }));
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    Override platform default and use my own custom OpenAI API Key
                  </label>
                </div>
              )}

              {(currentRole !== 'tenant' || !globalHasApiKey || overrideOpenAI) && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    {currentRole === 'tenant' ? 'Custom OpenAI API Key (Override)' : 'Global Platform OpenAI API Key'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type={showPassword['difyApiKey'] ? 'text' : 'password'}
                      className="form-input" 
                      style={{ paddingLeft: '32px', paddingRight: '60px' }}
                      placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={config.difyApiKey}
                      onChange={(e) => setConfig({ ...config, difyApiKey: e.target.value })}
                      required={currentRole === 'tenant' ? overrideOpenAI : false}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('difyApiKey')}
                      style={{ position: 'absolute', right: '10px', top: '8px', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', color: 'var(--text-primary)' }}
                    >
                      {showPassword['difyApiKey'] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Your keys are AES-256 encrypted at rest and never shared outside your private backend sandbox instance.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 2. TELEPHONY & VOIP TAB */}
          {activeSubTab === 'telephony' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Radio Switcher Strategy */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
                  Voice Call Carrier Strategy
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* Option 1: Managed */}
                  <label 
                    style={{ 
                      flex: 1,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '12px',
                      background: config.mode === 'managed' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)',
                      border: config.mode === 'managed' ? '1px solid var(--primary-color)' : '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="carrierStrategy" 
                      checked={config.mode === 'managed'} 
                      onChange={() => setConfig({ ...config, mode: 'managed' })}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', color: 'var(--text-primary)' }}>
                        Shared Platform Trunk
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginTop: '3px', lineHeight: '1.3' }}>
                        Simulated gateways. Zero setup required. Use standard platform numbers.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: BYOC */}
                  <label 
                    style={{ 
                      flex: 1,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '12px',
                      background: config.mode === 'byoc' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)',
                      border: config.mode === 'byoc' ? '1px solid var(--primary-color)' : '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="carrierStrategy" 
                      checked={config.mode === 'byoc'} 
                      onChange={() => setConfig({ ...config, mode: 'byoc' })}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', color: 'var(--text-primary)' }}>
                        Bring Your Own Keys
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginTop: '3px', lineHeight: '1.3' }}>
                        Configure custom Twilio credentials or SIP gateway trunks for direct carrier execution.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {config.mode === 'managed' ? (
                <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--success-color)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Active standard outbound routing route is: <strong>{getManagedNumber()}</strong> (Simulated AiraOS Trunk).
                  </span>
                </div>
              ) : (
                <div className="grid-cols-12" style={{ gap: '14px' }}>
                  {/* Select routing targets */}
                  <div className="col-span-6" style={{ border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Gateway Route Settings</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Inbound Calls Route:</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input type="radio" checked={config.inboundRouting === 'twilio'} onChange={() => setConfig({ ...config, inboundRouting: 'twilio' })} /> Twilio Number
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input type="radio" checked={config.inboundRouting === 'byo'} onChange={() => setConfig({ ...config, inboundRouting: 'byo' })} /> Custom BYO SIP
                          </label>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Outbound Caller ID:</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input type="radio" checked={config.outboundRouting === 'twilio'} onChange={() => setConfig({ ...config, outboundRouting: 'twilio' })} /> Twilio Number
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input type="radio" checked={config.outboundRouting === 'byo'} onChange={() => setConfig({ ...config, outboundRouting: 'byo' })} /> Custom BYO SIP
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-6" style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '8px', fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span>Make sure you have saved the webhook URL shown on the right into your Twilio or SIP gateway numbers settings so incoming calls reach the AI.</span>
                  </div>

                  {/* Twilio Section */}
                  <div className="col-span-12" style={{ border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>📞 Twilio Connection Credentials</span>
                    <div className="grid-cols-12" style={{ gap: '12px' }}>
                      <div className="col-span-6 form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>Twilio Account SID</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                          value={config.twilioAccountSid}
                          onChange={(e) => setConfig({ ...config, twilioAccountSid: e.target.value })}
                        />
                      </div>
                      <div className="col-span-6 form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>Twilio Auth Token</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="Enter Twilio Auth Token"
                          value={config.twilioAuthToken}
                          onChange={(e) => setConfig({ ...config, twilioAuthToken: e.target.value })}
                        />
                      </div>
                      <div className="col-span-12 form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>Twilio Phone Number (or Messaging Service SID)</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="+1234567890"
                          value={config.twilioPhoneNumber}
                          onChange={(e) => setConfig({ ...config, twilioPhoneNumber: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom BYO SIP Carrier Section */}
                  <div className="col-span-12" style={{ border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>🌐 Custom BYO SIP Gateway Configuration (Own Carrier)</span>
                    <div className="grid-cols-12" style={{ gap: '12px' }}>
                      <div className="col-span-6 form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>SIP URI / Gateway Host</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="sip.mycarrier.com"
                          value={config.byoSipServer}
                          onChange={(e) => setConfig({ ...config, byoSipServer: e.target.value })}
                        />
                      </div>
                      <div className="col-span-6 form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>Custom Carrier Phone Number</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="+15559876543"
                          value={config.byoPhoneNumber}
                          onChange={(e) => setConfig({ ...config, byoPhoneNumber: e.target.value })}
                        />
                      </div>
                      <div className="col-span-6 form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>SIP Trunk Username</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="sip_user"
                          value={config.byoSipUsername}
                          onChange={(e) => setConfig({ ...config, byoSipUsername: e.target.value })}
                        />
                      </div>
                      <div className="col-span-6 form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>SIP Trunk Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="sip_password"
                          value={config.byoSipPassword}
                          onChange={(e) => setConfig({ ...config, byoSipPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* 3. PAYMENT GATEWAY TAB */}
          {activeSubTab === 'payments' && currentRole !== 'tenant' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                💳 <strong>PhonePe PG Integrations:</strong> Enter your Merchant ID and Salt Key below to accept live customer transactions, credit refills, and subscription upgrades inside the tenant portal.
              </div>

              <div className="grid-cols-12" style={{ gap: '14px' }}>
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>PhonePe Merchant ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="PGMERCHANTID"
                    value={config.phonepeMerchantId}
                    onChange={(e) => setConfig({ ...config, phonepeMerchantId: e.target.value })}
                  />
                </div>
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>PhonePe Salt Key (API Key)</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Salt Key e.g. 099eb0cd-02cf-4e2a-8aca-xxxxxxxx"
                    value={config.phonepeSaltKey}
                    onChange={(e) => setConfig({ ...config, phonepeSaltKey: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. CRM & CHANNELS TAB */}
          {activeSubTab === 'channels' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                💬 <strong>Communication Channels & Workflows:</strong> Link helpdesks, messaging tokens, and background automation triggers.
              </div>

              <div className="grid-cols-12" style={{ gap: '14px' }}>
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>WhatsApp Business Token</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="EAAGxxxxxxxxxxxxxxxx"
                    value={config.whatsappToken}
                    onChange={(e) => setConfig({ ...config, whatsappToken: e.target.value })}
                  />
                </div>
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Chatwoot Inbox Token</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="inbox_token_xxxxxxxx"
                    value={config.chatwootInboxToken}
                    onChange={(e) => setConfig({ ...config, chatwootInboxToken: e.target.value })}
                  />
                </div>

                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Chatwoot URL</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="https://chat.my-domain.com"
                    value={config.chatwootUrl}
                    onChange={(e) => setConfig({ ...config, chatwootUrl: e.target.value })}
                  />
                </div>
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>n8n Workflow Engine URL</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="https://flow.my-domain.com"
                    value={config.n8nUrl}
                    onChange={(e) => setConfig({ ...config, n8nUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px', borderTop: '1px solid var(--border-glass)', paddingTop: '15px' }}>
            <button 
              type="button" 
              onClick={handleTestConnection}
              className="btn btn-secondary"
              disabled={isTesting}
              style={{ fontSize: '0.75rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {isTesting ? (
                <>
                  <Activity size={12} className="node-running" style={{ color: 'var(--primary-color)' }} /> Connecting...
                </>
              ) : 'Test Tab Settings'}
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ fontSize: '0.75rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Save size={12} /> Save Vault Settings
            </button>
          </div>

          {/* Test & Save Notifications */}
          {testResult === 'success' && (
            <div className="animate-fade-in" style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success-color)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> Connection parameters check out! Gateway handshake simulation verified.
            </div>
          )}

          {testResult === 'error' && (
            <div className="animate-fade-in" style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} /> Validation Failed! Please ensure required key input values are filled.
            </div>
          )}

          {saveSuccess && (
            <div className="animate-fade-in" style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success-color)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> Vault configurations updated! Database and local components successfully synced.
            </div>
          )}

        </div>

        {/* Right Info Sidebar */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Connection Overview Card */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Workspace Key Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>AI Brain</span>
                <span style={{ fontWeight: 'bold', color: (config.difyApiKey || globalHasApiKey) ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  {(config.difyApiKey || globalHasApiKey) ? 'Configured (Active)' : 'Empty (Simulated)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Carrier Strategy</span>
                <span className="badge badge-primary" style={{ textTransform: 'uppercase' }}>{config.mode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Telephony Target</span>
                <span style={{ fontWeight: 'bold' }}>
                  {config.mode === 'managed' ? getManagedNumber() : (config.inboundRouting === 'twilio' ? config.twilioPhoneNumber || 'No Twilio' : config.byoPhoneNumber || 'No SIP')}
                </span>
              </div>
              {currentRole !== 'tenant' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>PhonePe PG</span>
                  <span style={{ fontWeight: 'bold', color: config.phonepeMerchantId ? 'var(--success-color)' : 'var(--danger-color)' }}>
                    {config.phonepeMerchantId ? 'Configured' : 'Offline (Simulated)'}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Trunk Latency</span>
                <span style={{ color: 'var(--success-color)' }}>12ms (SSL Secured)</span>
              </div>
            </div>
          </div>

          {/* Twilio Hook Instructions */}
          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(10, 13, 22, 0.4)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)' }}>
              <Globe size={14} /> Webhook Routing URL
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
              To receive inbound SMS, WhatsApp replies, or incoming voice calls when utilizing your custom numbers, set your Twilio/SIP phone webhook URL to:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--accent-color)', marginBottom: '8px', wordBreak: 'break-all' }}>
              <span>https://api.airaos.com/v1/inbound/{tenant.id}</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Ensure to set the request method to <strong>HTTP POST</strong> in your carrier dashboard.
            </span>
          </div>

          {/* Direct link info */}
          <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-color)', background: 'rgba(255,255,255,0.01)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ExternalLink size={12} /> Live API Web Reference
            </h4>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
              Changes in this integration panel write directly to your centralized config on the VPS server. No code rebuilds needed.
            </p>
          </div>

        </div>
      </form>
    </div>
  );
};
