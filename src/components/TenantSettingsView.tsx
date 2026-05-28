import React, { useState } from 'react';
import { Settings, Clock, Globe, Shield, CheckCircle2, Sliders } from 'lucide-react';
import { Tenant } from '../types';

interface TenantSettingsViewProps {
  tenant: Tenant;
  onUpdateSettings: (updates: Partial<Tenant>) => void;
}

export const TenantSettingsView: React.FC<TenantSettingsViewProps> = ({
  tenant,
  onUpdateSettings
}) => {
  const [name, setName] = useState(tenant.name);
  const [timezone, setTimezone] = useState(tenant.settings?.timezone || 'Asia/Calcutta');
  const [defaultLeadValue, setDefaultLeadValue] = useState(tenant.settings?.defaultLeadValue || 450);
  const [domain, setDomain] = useState(tenant.domain || '');
  const [welcomeTemplate, setWelcomeTemplate] = useState(tenant.emailTemplates?.welcome || '');
  const [escalationTemplate, setEscalationTemplate] = useState(tenant.emailTemplates?.escalation || '');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      name,
      domain,
      settings: {
        ...(tenant.settings || {}),
        timezone,
        defaultLeadValue: Number(defaultLeadValue)
      },
      emailTemplates: {
        ...(tenant.emailTemplates || {}),
        welcome: welcomeTemplate,
        escalation: escalationTemplate
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="view-title">System Settings</h2>
          <p className="view-subtitle">Configure your workspace defaults, regional parameters, automation preferences, and notification triggers.</p>
        </div>
      </div>

      <div className="grid-cols-12" style={{ marginTop: '20px' }}>
        <form onSubmit={handleSubmit} className="col-span-8 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* General Workspace Profile */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--text-primary)' }}>
              <Shield size={16} style={{ color: 'var(--primary-color)' }} /> Workspace Profile
            </h3>
            <div className="grid-cols-12" style={{ gap: '16px' }}>
              <div className="col-span-6 form-group">
                <label className="form-label">Business Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>
              <div className="col-span-6 form-group">
                <label className="form-label">Plan Tier</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={`${tenant.plan} Subscription`} 
                  disabled 
                  style={{ background: 'rgba(255,255,255,0.01)', color: 'var(--text-muted)' }}
                />
              </div>
            </div>
            <div className="grid-cols-12" style={{ gap: '16px', marginTop: '16px' }}>
              <div className="col-span-6 form-group">
                <label className="form-label">Default Lead Revenue Value ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={defaultLeadValue} 
                  onChange={(e) => setDefaultLeadValue(Number(e.target.value))} 
                  required
                  min="0"
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Auto-allocated revenue value assigned to new CRM opportunities.
                </span>
              </div>
              <div className="col-span-6 form-group">
                <label className="form-label">Website Domain / URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={domain} 
                  onChange={(e) => setDomain(e.target.value)} 
                  placeholder="e.g. smile-dentals.gatidesk.in"
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Your website domain. Displayed on the dashboard overview page.
                </span>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)' }} />

          {/* Regional Settings */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--text-primary)' }}>
              <Clock size={16} style={{ color: 'var(--accent-color)' }} /> Regional & Localization
            </h3>
            <div className="form-group" style={{ maxWidth: '300px' }}>
              <label className="form-label">Timezone</label>
              <select 
                className="form-input" 
                value={timezone} 
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Asia/Calcutta">Asia/Calcutta (GMT+05:30)</option>
                <option value="UTC">UTC / Greenwich Mean Time</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                <option value="America/Denver">America/Denver (MST/MDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
              </select>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)' }} />

          {/* Automation & Notification Templates */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--text-primary)' }}>
              <Sliders size={16} style={{ color: 'var(--warning-color)' }} /> Notification System Templates
            </h3>
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Default Customer Welcome Email Template</label>
              <textarea 
                className="form-input" 
                rows={3} 
                value={welcomeTemplate} 
                onChange={(e) => setWelcomeTemplate(e.target.value)}
                placeholder="Hello {contact_name}, welcome to our clinic!"
                style={{ resize: 'vertical' }}
              />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Supports dynamic tags: <code>{`{contact_name}`}</code>, <code>{`{tenant_name}`}</code>.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Support Escalation Alert Template</label>
              <textarea 
                className="form-input" 
                rows={3} 
                value={escalationTemplate} 
                onChange={(e) => setEscalationTemplate(e.target.value)}
                placeholder="Alert: Conversation with {contact_name} has been escalated."
                style={{ resize: 'vertical' }}
              />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Triggered automatically when conversations are flagged for human handoff.
              </span>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
            {saved && (
              <span style={{ color: 'var(--success-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Workspace settings saved!
              </span>
            )}
            <button type="submit" className="btn btn-primary">Save Settings</button>
          </div>

        </form>

        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>System Diagnostics</h3>
            <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Telephony Gateway: <strong style={{ color: '#10b981' }}>Active (Twilio/SIP)</strong></li>
              <li>Visual Workflows: <strong style={{ color: '#10b981' }}>Engaged</strong></li>
              <li>SSL Certificate: <strong style={{ color: '#10b981' }}>Valid</strong></li>
              <li>Workspace Node: <strong style={{ color: 'var(--primary-color)' }}>healthy-app-pod</strong></li>
              <li>API Version: <code>v1.0-production</code></li>
            </ul>
          </div>

          <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>Enterprise Cloud OS</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
              GatiDesk operates as a fully sandboxed, highly compliant digital communication operating system. Your system parameters are backed up continuously to encrypted storage blocks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
