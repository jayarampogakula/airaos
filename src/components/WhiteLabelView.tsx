import React, { useState } from 'react';
import { Settings, Shield, Globe, Image, Palette, CheckCircle2, ChevronRight } from 'lucide-react';
import { Tenant } from '../types';

interface WhiteLabelViewProps {
  tenant: Tenant;
  onUpdateBranding: (tenantId: string, updates: Partial<Tenant>) => void;
}

export const WhiteLabelView: React.FC<WhiteLabelViewProps> = ({
  tenant,
  onUpdateBranding
}) => {
  const [domain, setDomain] = useState(tenant.domain);
  const [logo, setLogo] = useState(tenant.logo);
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(tenant.secondaryColor);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBranding(tenant.id, {
      domain,
      logo,
      primaryColor,
      secondaryColor
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (tenant.plan !== 'Enterprise') {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="view-header">
          <div>
            <h2 className="view-title">White Label Branding</h2>
            <p className="view-subtitle">Rebrand GatiDesk console domain, layout styles, and customer touchpoints with your own agency identity.</p>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '600px',
          margin: '40px auto'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)'
          }}>
            🔒
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
            Enterprise Whitelabel Domain Locked
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0, lineHeight: '1.5' }}>
            White labeling, CNAME domain mapping, custom accent colors, and custom brand logos are premium features reserved for **Enterprise Plan** members.
          </p>
          <button 
            onClick={() => {
              alert("Please navigate to the Settings > Billing tab to upgrade to the Enterprise Plan!");
            }}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              color: 'white',
              fontWeight: 'bold',
              padding: '10px 24px',
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Upgrade to Enterprise Plan <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="view-title">White Label Branding</h2>
          <p className="view-subtitle">Rebrand GatiDesk console domain, layout styles, and customer touchpoints with your own agency identity.</p>
        </div>
      </div>

      <div className="grid-cols-12">
        {/* Configurations Form */}
        <form onSubmit={handleSave} className="col-span-7 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Globe size={16} style={{ color: 'var(--primary-color)' }} /> Domain Mapping
            </h3>
            <div className="form-group">
              <label className="form-label">Branded Console Domain</label>
              <div style={{ display: 'flex' }}>
                <span style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  https://
                </span>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ borderRadius: '0 4px 4px 0' }} 
                  value={domain} 
                  onChange={(e) => setDomain(e.target.value)} 
                />
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Map a CNAME record in your DNS settings pointing your domain to GatiDesk routers.
              </span>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)' }} />

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Image size={16} style={{ color: 'var(--accent-color)' }} /> Logo & Symbols
            </h3>
            <div className="form-group" style={{ maxWidth: '200px' }}>
              <label className="form-label">Brand Symbol (Emoji / Icon)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 🦷 or 🏢" 
                value={logo} 
                onChange={(e) => setLogo(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)' }} />

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Palette size={16} style={{ color: 'var(--warning-color)' }} /> Color Palette System
            </h3>

            <div className="grid-cols-12">
              <div className="col-span-6 form-group">
                <label className="form-label">Primary Brand Accent</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)} 
                    style={{ border: 'none', width: '38px', height: '38px', cursor: 'pointer', background: 'none' }} 
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)} 
                    style={{ padding: '6px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div className="col-span-6 form-group">
                <label className="form-label">Dashboard Canvas Dark theme</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={secondaryColor} 
                    onChange={(e) => setSecondaryColor(e.target.value)} 
                    style={{ border: 'none', width: '38px', height: '38px', cursor: 'pointer', background: 'none' }} 
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={secondaryColor} 
                    onChange={(e) => setSecondaryColor(e.target.value)} 
                    style={{ padding: '6px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            {saved && (
              <span style={{ color: 'var(--success-color)', fontSize: '0.8rem', alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Style settings synced!
              </span>
            )}
            <button type="submit" className="btn btn-primary">Save Agency Branding</button>
          </div>

        </form>

        {/* Right Column: Live Mockup Console */}
        <div className="col-span-5 glass-panel" style={{ padding: '24px', background: '#090d16', display: 'flex', flexDirection: 'column', height: '400px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '18px' }}>Branding Layout Preview</h3>
          
          <div 
            style={{ 
              flex: 1, 
              border: '1px solid var(--border-glass)', 
              borderRadius: '8px', 
              background: secondaryColor,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Top Preview Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>{logo}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{tenant.name}</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{domain}</span>
            </div>

            {/* Middle Mock Dashboard Item */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ height: '12px', width: '80px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Simulated Glow */}
                <div style={{ height: '42px', width: '90px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '6px' }}>
                  <div style={{ height: '6px', width: '30px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginBottom: '4px' }}></div>
                  <div style={{ height: '10px', width: '50px', background: primaryColor, borderRadius: '2px' }}></div>
                </div>
                <div style={{ height: '42px', width: '90px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '6px' }}>
                  <div style={{ height: '6px', width: '30px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginBottom: '4px' }}></div>
                  <div style={{ height: '10px', width: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></div>
                </div>
              </div>
            </div>

            {/* Bottom Button Preview */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ padding: '6px 12px', fontSize: '0.7rem', backgroundColor: primaryColor, color: 'white' }}>
                Primary Action Button
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
