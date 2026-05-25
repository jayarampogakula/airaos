import React, { useState } from 'react';
import { ShieldCheck, Sparkles, MessageSquare, Phone, Globe, Layers, ArrowUpRight, Plus, History, Check } from 'lucide-react';
import { Tenant } from '../types';

interface BillingUpgradeViewProps {
  tenant: Tenant;
  usageLimits: {
    conversationsUsed: number;
    conversationsLimit: number;
    voiceUsed: number;
    voiceLimit: number;
    websitesUsed?: number;
    websitesLimit?: number;
  };
}

export const BillingUpgradeView: React.FC<BillingUpgradeViewProps> = ({ tenant, usageLimits }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const activePlan = tenant.plan || 'Growth';
  const extraCredits = tenant.credits || 0;
  const billingHistory = tenant.billingHistory || [];

  const handleCheckout = async (amount: number, type: 'plan_upgrade' | 'buy_credits', planName?: string, creditsCount?: number) => {
    setLoading(type === 'plan_upgrade' ? planName || 'upgrade' : `credits-${creditsCount}`);
    try {
      const response = await fetch('/api/phonepe/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          amount,
          type,
          planName,
          creditsCount
        })
      });

      if (!response.ok) throw new Error('Failed to initiate checkout');
      const data = await response.json();

      if (data.success && data.redirectUrl) {
        // Redirect user to payment gateway (or simulator)
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      console.error(err);
      alert('Payment initialization failed. Please verify configurations and try again.');
    } finally {
      setLoading(null);
    }
  };

  const getPercent = (used: number, limit: number) => {
    if (!limit) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={24} style={{ color: 'var(--primary-color)' }} /> Billing & Resource Quota
          </h2>
          <p className="view-subtitle">Manage your subscription, buy extra conversation credits, and review previous transactions.</p>
        </div>
      </div>

      <div className="grid-cols-12" style={{ gap: '20px' }}>
        {/* Left Column: Resource Quota & Buy Extra Credits */}
        <div className="col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quota Progress */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--success-color)' }} /> Active Usage Quotas
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Chats quota */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                    <MessageSquare size={14} style={{ color: 'var(--primary-color)' }} /> Text AI Chat Messages
                  </span>
                  <span>
                    <strong>{usageLimits.conversationsUsed}</strong> / {usageLimits.conversationsLimit} used
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${getPercent(usageLimits.conversationsUsed, usageLimits.conversationsLimit)}%`,
                    height: '100%',
                    background: 'var(--primary-color)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                {extraCredits > 0 && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--success-color)', marginTop: '4px' }}>
                    * Includes +{extraCredits} extra purchased chat credits.
                  </div>
                )}
              </div>

              {/* Voice Mins Quota */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                    <Phone size={14} style={{ color: 'var(--accent-color)' }} /> Voice AI Call Minutes
                  </span>
                  <span>
                    <strong>{usageLimits.voiceUsed}</strong> / {usageLimits.voiceLimit} Mins
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${getPercent(usageLimits.voiceUsed, usageLimits.voiceLimit)}%`,
                    height: '100%',
                    background: 'var(--accent-color)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              {/* Website Generation Quota */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                    <Globe size={14} style={{ color: 'var(--warning-color)' }} /> AI Generated Websites
                  </span>
                  <span>
                    <strong>{usageLimits.websitesUsed || 0}</strong> / {usageLimits.websitesLimit || 2} Deployed
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${getPercent(usageLimits.websitesUsed || 0, usageLimits.websitesLimit || 2)}%`,
                    height: '100%',
                    background: 'var(--warning-color)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

            </div>
          </div>

          {/* Add-on credits buying */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} style={{ color: 'var(--primary-color)' }} /> Buy Extra Credits (PhonePe)
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>Add pay-as-you-go capacity directly onto your active account using direct UPI checkout.</p>

            <div className="grid-cols-12" style={{ gap: '12px' }}>
              
              {/* Chat credits card */}
              <div className="col-span-6 glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--primary-color)', textTransform: 'uppercase' }}>Chat Add-on</span>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>500 Messages</h4>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Instantly pushes 500 extra LLM chat messages to your active month quota limits.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹250 INR</span>
                  <button
                    onClick={() => handleCheckout(250, 'buy_credits', undefined, 500)}
                    disabled={!!loading}
                    className="btn btn-primary"
                    style={{ fontSize: '0.7rem', padding: '6px 12px' }}
                  >
                    {loading === 'credits-500' ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>

              {/* Calling credits card */}
              <div className="col-span-6 glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--accent-color)', textTransform: 'uppercase' }}>Voice Add-on</span>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>100 Mins Call</h4>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Adds 100 outbound/inbound voice assistant phone calling minutes immediately.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹400 INR</span>
                  <button
                    onClick={() => handleCheckout(400, 'buy_credits', undefined, 100)}
                    disabled={!!loading}
                    className="btn btn-primary"
                    style={{ fontSize: '0.7rem', padding: '6px 12px' }}
                  >
                    {loading === 'credits-100' ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Active Plan Status & Upgrade Options */}
        <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Active plan status */}
          <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            {/* Background glowing circle */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'var(--primary-glow)',
              filter: 'blur(30px)'
            }}></div>

            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: 'bold', border: '1px solid var(--primary-color)33', padding: '2px 8px', borderRadius: '12px', background: 'var(--primary-glow)' }}>
              Active Plan
            </span>
            
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '8px 0 2px 0' }}>
              {activePlan} Tier
            </h3>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Auto-renewing subscription via corporate billing.
            </p>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Need more capabilities? Upgrade to Scale or Enterprise plan below.
            </div>
          </div>

          {/* Upgrades List */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Subscription Tiers</h4>
            
            {/* Growth Tier */}
            <div style={{
              padding: '12px 14px',
              background: activePlan === 'Growth' ? 'rgba(99,102,241,0.03)' : 'transparent',
              border: `1px solid ${activePlan === 'Growth' ? 'var(--primary-color)' : 'var(--border-glass)'}`,
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Growth Plan {activePlan === 'Growth' && <span style={{ color: 'var(--success-color)', fontSize: '0.65rem' }}>✓ Active</span>}
                </h5>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>2K Chats • 500 Voice Mins • 2 Sites</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>₹3,900/mo</span>
                {activePlan !== 'Growth' && (
                  <button
                    onClick={() => handleCheckout(3900, 'plan_upgrade', 'Growth')}
                    disabled={!!loading}
                    style={{ fontSize: '0.65rem', padding: '2px 8px', border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer', marginTop: '4px' }}
                  >
                    Downgrade
                  </button>
                )}
              </div>
            </div>

            {/* Scale Tier */}
            <div style={{
              padding: '12px 14px',
              background: activePlan === 'Scale' ? 'rgba(99,102,241,0.03)' : 'transparent',
              border: `1px solid ${activePlan === 'Scale' ? 'var(--primary-color)' : 'var(--border-glass)'}`,
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Scale Plan {activePlan === 'Scale' && <span style={{ color: 'var(--success-color)', fontSize: '0.65rem' }}>✓ Active</span>}
                </h5>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>10K Chats • 2K Voice Mins • 5 Sites</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>₹7,900/mo</span>
                {activePlan !== 'Scale' && (
                  <button
                    onClick={() => handleCheckout(7900, 'plan_upgrade', 'Scale')}
                    disabled={!!loading}
                    className="btn btn-primary"
                    style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', marginTop: '4px' }}
                  >
                    {loading === 'Scale' ? 'Redirecting...' : activePlan === 'Growth' ? 'Upgrade' : 'Downgrade'}
                  </button>
                )}
              </div>
            </div>

            {/* Enterprise Tier */}
            <div style={{
              padding: '12px 14px',
              background: activePlan === 'Enterprise' ? 'rgba(99,102,241,0.03)' : 'transparent',
              border: `1px solid ${activePlan === 'Enterprise' ? 'var(--primary-color)' : 'var(--border-glass)'}`,
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Enterprise {activePlan === 'Enterprise' && <span style={{ color: 'var(--success-color)', fontSize: '0.65rem' }}>✓ Active</span>}
                </h5>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Unlimited Chats • 10K Mins • Unlimited Sites</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>₹23,900/mo</span>
                {activePlan !== 'Enterprise' && (
                  <button
                    onClick={() => handleCheckout(23900, 'plan_upgrade', 'Enterprise')}
                    disabled={!!loading}
                    className="btn btn-primary"
                    style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', marginTop: '4px' }}
                  >
                    {loading === 'Enterprise' ? 'Redirecting...' : 'Upgrade'}
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Transaction History Section */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} style={{ color: 'var(--text-secondary)' }} /> Billing Transaction Ledger
        </h3>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice/TX ID</th>
                <th>Transaction Date</th>
                <th>Payment Category</th>
                <th>Description</th>
                <th>Charged Value</th>
                <th>Invoice Status</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((tx: any, tIdx: number) => (
                <tr key={tIdx}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{tx.id}</td>
                  <td>{tx.date}</td>
                  <td style={{ fontWeight: 'bold' }}>{tx.type}</td>
                  <td>{tx.description}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{tx.amount} INR</td>
                  <td>
                    <span className="badge badge-success">{tx.status || 'Completed'}</span>
                  </td>
                </tr>
              ))}
              {billingHistory.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>
                    No transactions captured on account balance yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
