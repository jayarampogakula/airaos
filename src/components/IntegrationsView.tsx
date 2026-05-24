import React, { useState, useEffect } from 'react';
import { 
  Server, Key, Phone, MessageSquare, CheckCircle2, AlertTriangle, 
  Globe, Activity, Play, Save, Link, ArrowRight, ShieldCheck, Sparkles 
} from 'lucide-react';
import { Tenant } from '../types';

interface IntegrationsViewProps {
  tenant: Tenant;
}

export interface TenantIntegrationConfig {
  mode: 'managed' | 'byoc';
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  whatsappToken: string;
  chatwootInboxToken: string;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ tenant }) => {
  const [config, setConfig] = useState<TenantIntegrationConfig>(() => {
    const stored = localStorage.getItem(`tenant_integrations_${tenant.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          mode: parsed.mode || 'managed',
          twilioAccountSid: parsed.twilioAccountSid || '',
          twilioAuthToken: parsed.twilioAuthToken || '',
          twilioPhoneNumber: parsed.twilioPhoneNumber || '',
          whatsappToken: parsed.whatsappToken || '',
          chatwootInboxToken: parsed.chatwootInboxToken || ''
        };
      } catch (e) {}
    }
    return {
      mode: 'managed',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
      whatsappToken: '',
      chatwootInboxToken: ''
    };
  });

  const [platformRates, setPlatformRates] = useState({
    inboundCallRate: 0.10,
    outboundCallRate: 0.20,
    smsRate: 0.05
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load platform-wide managed billing settings if available
  useEffect(() => {
    const stored = localStorage.getItem('platform_billing_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPlatformRates({
          inboundCallRate: parsed.inboundCallRate ?? 0.10,
          outboundCallRate: parsed.outboundCallRate ?? 0.20,
          smsRate: parsed.overageChatRate ?? 0.05
        });
      } catch (e) {}
    }
  }, []);

  // Update config when tenant changes
  useEffect(() => {
    const stored = localStorage.getItem(`tenant_integrations_${tenant.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConfig({
          mode: parsed.mode || 'managed',
          twilioAccountSid: parsed.twilioAccountSid || '',
          twilioAuthToken: parsed.twilioAuthToken || '',
          twilioPhoneNumber: parsed.twilioPhoneNumber || '',
          whatsappToken: parsed.whatsappToken || '',
          chatwootInboxToken: parsed.chatwootInboxToken || ''
        });
        setTestResult(null);
        return;
      } catch (e) {}
    }
    setConfig({
      mode: 'managed',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
      whatsappToken: '',
      chatwootInboxToken: ''
    });
    setTestResult(null);
  }, [tenant.id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`tenant_integrations_${tenant.id}`, JSON.stringify(config));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      if (config.mode === 'byoc' && (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber)) {
        setTestResult('error');
      } else {
        setTestResult('success');
      }
    }, 1800);
  };

  // Pre-allocated managed numbers for simulation
  const getManagedNumber = () => {
    if (tenant.id === 't-1') return '+1 (555) 019-2834';
    if (tenant.id === 't-2') return '+1 (555) 489-1122';
    return '+1 (555) 762-9900';
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link size={24} style={{ color: 'var(--primary-color)' }} /> Communication Integrations
          </h2>
          <p className="view-subtitle">Connect your own carrier accounts or utilize high-speed platform-managed pipelines for WhatsApp and SMS routing.</p>
        </div>
      </div>

      <div className="grid-cols-12" style={{ gap: '20px' }}>
        {/* Toggle Panel & Form */}
        <div className="col-span-8 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Radio Switcher */}
          <div>
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>
              Connection Channel Strategy
            </label>
            <div style={{ display: 'flex', gap: '14px' }}>
              {/* Option 1: Managed */}
              <label 
                style={{ 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  background: config.mode === 'managed' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)',
                  border: config.mode === 'managed' ? '1px solid var(--primary-color)' : '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input 
                  type="radio" 
                  name="integrationMode" 
                  checked={config.mode === 'managed'} 
                  onChange={() => setConfig({ ...config, mode: 'managed' })}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', color: 'var(--text-primary)' }}>
                    Platform Managed (Quick-Start)
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px', lineHeight: '1.3' }}>
                    Route calls and texts through pre-configured AiraOS Twilio carriers. Zero API credentials needed.
                  </span>
                </div>
              </label>

              {/* Option 2: BYOC */}
              <label 
                style={{ 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  background: config.mode === 'byoc' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)',
                  border: config.mode === 'byoc' ? '1px solid var(--primary-color)' : '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input 
                  type="radio" 
                  name="integrationMode" 
                  checked={config.mode === 'byoc'} 
                  onChange={() => setConfig({ ...config, mode: 'byoc' })}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', color: 'var(--text-primary)' }}>
                    Bring Your Own Carrier (BYOC)
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px', lineHeight: '1.3' }}>
                    Connect your own Twilio and WhatsApp Business account. Pay Twilio directly and keep full phone ownership.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)' }} />

          {/* Conditional Forms */}
          {config.mode === 'managed' ? (
            /* Managed Mode Details */
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div 
                style={{ 
                  padding: '14px', 
                  background: 'rgba(16, 185, 129, 0.05)', 
                  border: '1px solid rgba(16, 185, 129, 0.15)', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <ShieldCheck size={18} style={{ color: 'var(--success-color)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Your workspace is actively configured on platform-managed lines. No further configuration is required.
                </span>
              </div>

              <div className="grid-cols-12" style={{ gap: '16px' }}>
                {/* Allocated Number */}
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Allocated Platform Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ paddingLeft: '32px', cursor: 'not-allowed', color: 'var(--text-primary)' }}
                      value={getManagedNumber()}
                      disabled 
                    />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Standard number assigned to your workspace. Supports two-way WhatsApp & SMS.
                  </span>
                </div>

                {/* Routing Status */}
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Carrier Route Status</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: '1px solid var(--border-glass)', borderRadius: '4px', background: 'rgba(255,255,255,0.01)', height: '38px' }}>
                    <span style={{ height: '8px', width: '8px', background: 'var(--success-color)', borderRadius: '50%' }}></span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Active (AiraOS Shared Trunk)</span>
                  </div>
                </div>
              </div>

              {/* Billing Rates */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '16px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💲</span> Platform Carrier Pricing (Deducted from Overage Balances)
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div>
                    <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      ${platformRates.inboundCallRate.toFixed(2)}/min
                    </span>
                    <span>Inbound Calls</span>
                  </div>
                  <div style={{ height: '30px', width: '1px', background: 'var(--border-glass)' }}></div>
                  <div>
                    <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      ${platformRates.outboundCallRate.toFixed(2)}/min
                    </span>
                    <span>Outbound Calls</span>
                  </div>
                  <div style={{ height: '30px', width: '1px', background: 'var(--border-glass)' }}></div>
                  <div>
                    <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      ${platformRates.smsRate.toFixed(2)}/msg
                    </span>
                    <span>WhatsApp / SMS Messages</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* BYOC Form Inputs */
            <form onSubmit={handleSave} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div 
                style={{ 
                  padding: '12px', 
                  background: 'rgba(245, 158, 11, 0.05)', 
                  border: '1px solid rgba(245, 158, 11, 0.15)', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Connecting your own keys overrides the default platform-managed routing. Be sure to configure Webhooks in your Twilio Console pointing to the API.
                </span>
              </div>

              <div className="grid-cols-12" style={{ gap: '16px' }}>
                {/* Twilio Account SID */}
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Twilio Account SID</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={12} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ paddingLeft: '32px' }}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={config.twilioAccountSid}
                      onChange={(e) => setConfig({ ...config, twilioAccountSid: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Twilio Auth Token */}
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Twilio Auth Token</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={12} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type="password" 
                      className="form-input" 
                      style={{ paddingLeft: '32px' }}
                      placeholder="Enter Twilio Auth Token"
                      value={config.twilioAuthToken}
                      onChange={(e) => setConfig({ ...config, twilioAuthToken: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Twilio Phone Number (or Messaging SID)</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={12} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ paddingLeft: '32px' }}
                      placeholder="+1234567890"
                      value={config.twilioPhoneNumber}
                      onChange={(e) => setConfig({ ...config, twilioPhoneNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp Token */}
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>WhatsApp Business Token (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <MessageSquare size={12} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type="password" 
                      className="form-input" 
                      style={{ paddingLeft: '32px' }}
                      placeholder="EAAGxxxxxxxxxxxxxxxxx"
                      value={config.whatsappToken}
                      onChange={(e) => setConfig({ ...config, whatsappToken: e.target.value })}
                    />
                  </div>
                </div>

                {/* Chatwoot Inbox Token */}
                <div className="col-span-12 form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Custom Chatwoot Inbox Token (Optional override)</label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={12} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ paddingLeft: '32px' }}
                      placeholder="inbox_token_xxxxxxxx"
                      value={config.chatwootInboxToken}
                      onChange={(e) => setConfig({ ...config, chatwootInboxToken: e.target.value })}
                    />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Provide a custom token if you wish to bypass the platform's default shared Chatwoot routing pool entirely.
                  </span>
                </div>
              </div>

              {/* Action Buttons inside Form */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={handleTestConnection}
                  className="btn btn-secondary"
                  disabled={isTesting}
                  style={{ fontSize: '0.75rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {isTesting ? (
                    <>
                      <Activity size={12} className="node-running" style={{ color: 'var(--primary-color)' }} /> Testing...
                    </>
                  ) : 'Test API Connection'}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Save size={12} /> Save BYOC Configuration
                </button>
              </div>
            </form>
          )}

          {/* Test & Save Status Notifications */}
          {testResult === 'success' && (
            <div className="animate-fade-in" style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success-color)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> Connection successful! Twilio SID verified and Webhook endpoint validated.
            </div>
          )}

          {testResult === 'error' && (
            <div className="animate-fade-in" style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} /> Connection failed! Check that Account SID, Auth Token, and Phone Number are typed correctly and active.
            </div>
          )}

          {saveSuccess && (
            <div className="animate-fade-in" style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success-color)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> Integration settings saved successfully. Gateway tables updated.
            </div>
          )}

        </div>

        {/* Info panel on the right */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Integration Status Card */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Connection Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Selected Mode</span>
                <span className="badge badge-primary" style={{ textTransform: 'uppercase' }}>{config.mode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Number</span>
                <span style={{ fontWeight: 'bold' }}>{config.mode === 'managed' ? getManagedNumber() : config.twilioPhoneNumber || 'Not Configured'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>API Calls Latency</span>
                <span style={{ color: 'var(--success-color)' }}>12ms (Good)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>SSL Encryption</span>
                <span style={{ color: 'var(--success-color)' }}>TLS v1.3</span>
              </div>
            </div>
          </div>

          {/* Webhook Guide card */}
          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(10, 13, 22, 0.4)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)' }}>
              <Globe size={14} /> Twilio Webhook Guide
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
              To receive inbound SMS and WhatsApp replies when running in **BYOC mode**, copy this Webhook endpoint and save it in your Twilio Console:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--accent-color)', marginBottom: '8px' }}>
              <span>https://api.airaos.com/v1/inbound/{tenant.id}</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Ensure to set the Webhook trigger to <strong>HTTP POST</strong>.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
