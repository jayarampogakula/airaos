import React, { useState } from 'react';
import { ShieldCheck, Sparkles, MessageSquare, Phone, Globe, Layers, ArrowUpRight, Plus, History, Check, Shield } from 'lucide-react';
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
  platformBillingSettings?: any;
}

export const BillingUpgradeView: React.FC<BillingUpgradeViewProps> = ({ tenant, usageLimits, platformBillingSettings }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const activePlan = tenant.plan || 'Growth';
  const extraCredits = tenant.credits || 0;
  const billingHistory = tenant.billingHistory || [];

  const settings = platformBillingSettings || {
    growthPrice: 2499,
    growthChats: 5000,
    growthVoice: 300,
    growthWebsites: 2,
    scalePrice: 6999,
    scaleChats: 25000,
    scaleVoice: 2000,
    scaleWebsites: 5,
    enterprisePrice: 19999,
    enterpriseChats: 999999,
    enterpriseVoice: 999999,
    enterpriseWebsites: 999,
    currency: '₹',
    chatAddonPrice: 250,
    voiceAddonPrice: 400
  };

  const currency = settings.currency || '₹';

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

  // Checklist configuration mapping
  const planDetails = [
    {
      name: 'Growth',
      price: settings.growthPrice,
      color: '#6366f1',
      includes: [
        'AI Receptionist',
        'CRM & Pipeline',
        'Website Builder',
        'Unified Inbox',
        'Appointment Scheduler',
        'Voice AI',
        'Automation Workflows'
      ],
      usage: [
        `${(settings.growthChats).toLocaleString()} AI Conversations`,
        `${settings.growthVoice} Voice Minutes`
      ]
    },
    {
      name: 'Scale',
      price: settings.scalePrice,
      color: '#f59e0b',
      includes: [
        '5 AI Employees',
        'CrewAI Orchestrator',
        'Multi-channel Inbox',
        'Voice Campaigns',
        'Outbound Dialer',
        'CRM',
        'Website Builder'
      ],
      usage: [
        `${(settings.scaleChats).toLocaleString()} AI Conversations`,
        `${settings.scaleVoice} Voice Minutes`
      ]
    },
    {
      name: 'Enterprise',
      price: settings.enterprisePrice,
      color: '#ef4444',
      isEnterprise: true,
      includes: [
        'Unlimited AI Employees',
        'White Label',
        'Dedicated Infrastructure',
        'Custom Integrations',
        'SLA Support'
      ],
      usage: [
        'Fair Use Limit'
      ]
    }
  ];

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
        <div className="col-span-6" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
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
                    <strong>{usageLimits.conversationsUsed}</strong> / {usageLimits.conversationsLimit >= 999999 ? 'Unlimited' : usageLimits.conversationsLimit} used
                  </span>
                </div>
                {usageLimits.conversationsLimit < 999999 && (
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${getPercent(usageLimits.conversationsUsed, usageLimits.conversationsLimit)}%`,
                      height: '100%',
                      background: 'var(--primary-color)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                )}
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
                    <strong>{usageLimits.voiceUsed}</strong> / {usageLimits.voiceLimit >= 999999 ? 'Unlimited' : usageLimits.voiceLimit} Mins
                  </span>
                </div>
                {usageLimits.voiceLimit < 999999 && (
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${getPercent(usageLimits.voiceUsed, usageLimits.voiceLimit)}%`,
                      height: '100%',
                      background: 'var(--accent-color)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                )}
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
                  <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{currency}{settings.chatAddonPrice ?? 250}</span>
                  <button
                    onClick={() => handleCheckout(settings.chatAddonPrice ?? 250, 'buy_credits', undefined, 500)}
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
                  <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{currency}{settings.voiceAddonPrice ?? 400}</span>
                  <button
                    onClick={() => handleCheckout(settings.voiceAddonPrice ?? 400, 'buy_credits', undefined, 100)}
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

          {/* What is Unlimited Callout */}
          <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Shield size={18} style={{ color: '#10b981' }} />
              <h4 style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Uncapped Workspace Assets</h4>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
              CRM Contacts, Deal Pipelines, Subtasks, transcribing Notes, Vector Knowledge Documents, and access Teams are completely unlimited on all plans.
            </p>
          </div>

        </div>

        {/* Right Column: Active Plan Status & Upgrade Options */}
        <div className="col-span-6" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: '0 0 -5px 0', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Subscription Packages</h4>

          {planDetails.map((plan) => {
            const isActive = activePlan.toLowerCase() === plan.name.toLowerCase();
            return (
              <div 
                key={plan.name}
                className="glass-panel" 
                style={{ 
                  padding: '20px', 
                  border: isActive ? `1px solid ${plan.color}` : '1px solid var(--border-glass)',
                  background: isActive ? 'rgba(255,255,255,0.01)' : 'transparent',
                  position: 'relative'
                }}
              >
                {isActive && (
                  <span style={{ 
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    fontSize: '0.65rem', 
                    textTransform: 'uppercase', 
                    color: plan.color, 
                    fontWeight: 'bold', 
                    border: `1px solid ${plan.color}33`, 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    background: `${plan.color}11` 
                  }}>
                    ✓ Active Plan
                  </span>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {plan.name} Plan
                  </h3>
                  <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'white', display: 'block', marginTop: '4px' }}>
                    {currency}{plan.price.toLocaleString()}{plan.isEnterprise ? '+' : ''}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}> / month</span>
                  </span>
                </div>

                <div className="grid-cols-12" style={{ gap: '14px', marginBottom: '16px' }}>
                  <div className="col-span-6">
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Includes:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {plan.includes.map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          <Check size={10} style={{ color: '#10b981', flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-6">
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Usage Included:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {plan.usage.map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          <Check size={10} style={{ color: '#10b981', flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {!isActive && (
                  <button
                    onClick={() => handleCheckout(plan.price, 'plan_upgrade', plan.name)}
                    disabled={!!loading}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '6px 16px', background: plan.color, border: 'none', color: plan.name === 'Scale' ? 'black' : 'white', fontWeight: 'bold' }}
                  >
                    {loading === plan.name ? 'Redirecting...' : activePlan === 'Enterprise' ? 'Downgrade' : plan.name === 'Growth' ? 'Downgrade' : 'Upgrade'}
                  </button>
                )}
              </div>
            );
          })}

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
                  <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{currency}{tx.amount}</td>
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
