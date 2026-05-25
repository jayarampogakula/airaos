import React, { useState } from 'react';
import { CreditCard, ShieldCheck, CheckCircle2, Wallet, Landmark, ArrowRight, Laptop } from 'lucide-react';

export const PhonePeSimulator: React.FC = () => {
  const hash = window.location.hash;
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(queryString);

  const transactionId = params.get('transactionId') || `TX-${Date.now()}`;
  const tenantId = params.get('tenantId') || 't-1';
  const amount = params.get('amount') || '49';
  const type = params.get('type') || 'plan_upgrade';
  const planName = params.get('planName') || 'Scale';
  const creditsCount = params.get('creditsCount') || '0';

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // Forward to backend callback to execute updates
      window.location.href = `/api/phonepe/callback?transactionId=${transactionId}&tenantId=${tenantId}&amount=${amount}&type=${type}&planName=${encodeURIComponent(planName)}&creditsCount=${creditsCount}`;
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0c0f1d',
      color: '#f3f4f6',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(17, 24, 39, 0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Header Branding */}
        <div style={{
          background: 'linear-gradient(135deg, #5f22d9 0%, #3e129c 100%)',
          padding: '24px 20px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '0.05em', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: 0 }}>
            PhonePe <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px' }}>SANDBOX</span>
          </h2>
          <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px', color: '#e0d4fc' }}>Secure Developer Checkout Gateway</p>
        </div>

        {/* Transaction Summary */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Transaction ID:</span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{transactionId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Item Type:</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>
              {type === 'plan_upgrade' ? `Plan Upgrade: ${planName}` : `Purchase ${creditsCount} Extra Credits`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Amount Payable:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#60a5fa' }}>₹{amount} INR</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Payment Method</span>
          
          <div 
            onClick={() => setPaymentMethod('upi')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '10px',
              border: `1px solid ${paymentMethod === 'upi' ? '#7c3aed' : 'rgba(255,255,255,0.05)'}`,
              background: paymentMethod === 'upi' ? 'rgba(124, 58, 237, 0.05)' : 'rgba(255,255,255,0.01)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Wallet size={18} style={{ color: '#7c3aed' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>UPI Payment (GPay, PhonePe)</span>
                <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Pay using virtual payment address</span>
              </div>
            </div>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {paymentMethod === 'upi' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }}></div>}
            </div>
          </div>

          <div 
            onClick={() => setPaymentMethod('card')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '10px',
              border: `1px solid ${paymentMethod === 'card' ? '#7c3aed' : 'rgba(255,255,255,0.05)'}`,
              background: paymentMethod === 'card' ? 'rgba(124, 58, 237, 0.05)' : 'rgba(255,255,255,0.01)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CreditCard size={18} style={{ color: '#7c3aed' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Credit or Debit Card</span>
                <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Visa, MasterCard, RuPay, Maestro</span>
              </div>
            </div>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {paymentMethod === 'card' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }}></div>}
            </div>
          </div>

          <div 
            onClick={() => setPaymentMethod('netbanking')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '10px',
              border: `1px solid ${paymentMethod === 'netbanking' ? '#7c3aed' : 'rgba(255,255,255,0.05)'}`,
              background: paymentMethod === 'netbanking' ? 'rgba(124, 58, 237, 0.05)' : 'rgba(255,255,255,0.01)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Landmark size={18} style={{ color: '#7c3aed' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Netbanking</span>
                <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>All Indian banks supported</span>
              </div>
            </div>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {paymentMethod === 'netbanking' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }}></div>}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div style={{ padding: '0 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleSimulatePayment}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '14px',
              background: '#5f22d9',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(95, 34, 217, 0.3)'
            }}
          >
            {isProcessing ? 'Verifying payment status...' : `Proceed to Pay ₹${amount}`}
            {!isProcessing && <ArrowRight size={16} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.65rem', color: '#6b7280' }}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} /> Secure PCI-DSS Compliant Encryption
          </div>
        </div>
      </div>
    </div>
  );
};
