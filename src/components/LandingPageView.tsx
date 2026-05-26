import React, { useState } from 'react';
import { 
  Sparkles, MessageSquare, Calendar, Users, GitBranch, PhoneCall, 
  ArrowRight, CheckCircle2, Lock, UserPlus, Info, HelpCircle, Server, Globe, Cpu,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

interface LandingPageViewProps {
  onLoginSuccess: (role: 'tenant' | 'superadmin', tenantId?: string, email?: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onLoginSuccess }) => {
  const { login, signup } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [showCredsDrawer, setShowCredsDrawer] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Multi-step Onboarding State
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingFirstName, setOnboardingFirstName] = useState('');
  const [onboardingLastName, setOnboardingLastName] = useState('');
  const [onboardingPhone, setOnboardingPhone] = useState('');
  const [onboardingEmail, setOnboardingEmail] = useState('');
  const [onboardingPassword, setOnboardingPassword] = useState('');
  const [onboardingConfirmPassword, setOnboardingConfirmPassword] = useState('');
  const [onboardingCompany, setOnboardingCompany] = useState('');
  const [onboardingIndustry, setOnboardingIndustry] = useState('Medical / Healthcare');
  const [onboardingEmployees, setOnboardingEmployees] = useState('');
  const [onboardingName, setOnboardingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');

  // FAQ Accordion State
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [activePersonaIdx, setActivePersonaIdx] = useState(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(prev => prev === idx ? null : idx);
  };

  const testProfiles = [
    {
      role: 'tenant' as const,
      name: 'Admin Multi-Workspace',
      desc: 'Access Smile Dentals, KP Real Estates, and ABC Coaching from one account.',
      email: 'admin@airaos.com',
      password: 'password123',
      color: '#ef4444',
      badge: 'Owner',
      tenantId: undefined
    },
    {
      role: 'tenant' as const,
      name: 'Smile Dental Clinic',
      desc: 'Manage receptionist AI (Sarah) booking dental checkups, cleaning services, answering FAQs, and syncing calendar slots.',
      email: 'dental@airaos.com',
      password: 'smile123',
      color: '#6366f1',
      badge: 'Growth Plan',
      tenantId: 't-1'
    },
    {
      role: 'tenant' as const,
      name: 'Apex Heights Real Estate',
      desc: 'Manage property sales AI (Marcus) qualifying buyer budgets, booking tours, recording CRM leads, and sending pricing sheets.',
      email: 'sales@airaos.com',
      password: 'apex123',
      color: '#f59e0b',
      badge: 'Scale Plan',
      tenantId: 't-2'
    },
    {
      role: 'tenant' as const,
      name: 'ByteTech Software Solutions',
      desc: 'Manage technical customer support AI handling developer questions, troubleshooting bugs, and raising escalation alerts.',
      email: 'tech@airaos.com',
      password: 'byte123',
      color: '#10b981',
      badge: 'Enterprise Plan',
      tenantId: 't-3'
    }
  ];

  const agentPersonas = [
    {
      name: 'Sarah – AI Dental Receptionist',
      role: 'Smile Dental Clinic',
      prompt: 'Act as a friendly, warm receptionist for Smile Dental. Answer dental co-pay questions, quote cleaning costs ($120), and guide patients to select open scheduler slots.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      tools: ['Availability Check', 'Calendar Booking', 'CRM Lead Sync'],
      stats: { chats: '842 / mo', resolution: '84.6%', voiceMins: '215 min' }
    },
    {
      name: 'Marcus – AI Property Advisor',
      role: 'Apex Heights Real Estate',
      prompt: 'Act as a high-performing real estate agent. Qualify buyer budgets for Apex Penthouses (units start at $850k), detail floor layout models, capture emails, and create deals in the CRM pipeline.',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      tools: ['CRM Deal Creator', 'Tour Scheduler', 'Interactive Brochure Dispatch'],
      stats: { chats: '1,240 / mo', resolution: '76.2%', voiceMins: '380 min' }
    },
    {
      name: 'Support Rep – Enterprise Assistant',
      role: 'ByteTech Software Solutions',
      prompt: 'Act as a Level-1 technical support engineer. Read documentation text chunks to resolve software setup errors, log diagnostic codes, and automatically trigger developer escalation workflows.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      tools: ['Vector KB Lookup', 'Escalation Alert Trigger', 'Ticket Router'],
      stats: { chats: '154 / mo', resolution: '91.0%', voiceMins: '42 min' }
    }
  ];

  const faqs = [
    {
      q: 'Do I need to install dependencies or setup databases?',
      a: 'AiraOS features a fully preconfigured client dashboard out-of-the-box. When deploying in production, platform operators can link their own self-hosted VPS microservice containers (Dify, Chatwoot, Workflow Automator, Calendar Scheduler, Twenty CRM) using the Super Admin Integrations Panel to direct live connections.'
    },
    {
      q: 'What is Coolify and how does it manage the infrastructure?',
      a: 'Coolify is an open-source self-hosted Heroku alternative. It installs on any standard Linux VPS (like DigitalOcean, Hetzner, or AWS Ubuntu 22.04 node) via a single SSH command and hosts your databases, reverse proxy routers, SSL certificates, and Docker stacks.'
    },
    {
      q: 'Can client tenants adjust their own AI models and prompts?',
      a: 'Yes! Every tenant gets isolated access to their own private dashboard workspace where they can tweak LLM layers, customize prompt behavior, hire new agents, customize widgets, and inspect CRM leads.'
    },
    {
      q: 'How do vector databases connect to the client portal?',
      a: 'AiraOS handles file indexing under the hood. When tenants upload PDF manuals or FAQ spreadsheets in the Knowledge Base center, the text is chunked, converted into vector representations, and query-matched to form contextual responses during customer chats.'
    }
  ];

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const session = await login(email, password);
      onLoginSuccess('tenant', session.activeTenantId || undefined, session.user.email);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password. Open the Reviewer Credentials drawer below to auto-fill.');
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError('');

    if (currentStep === 1) {
      if (!onboardingFirstName.trim() || !onboardingLastName.trim() || !onboardingPhone.trim() || !onboardingEmail.trim() || !onboardingPassword || !onboardingConfirmPassword) {
        setOnboardingError('Please fill out all profile and credential fields.');
        return;
      }
      if (onboardingPassword !== onboardingConfirmPassword) {
        setOnboardingError('Passwords do not match.');
        return;
      }
      setOnboardingName(`${onboardingFirstName.trim()} ${onboardingLastName.trim()}`);
      setCurrentStep(2);
    } else if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Step 4 Submit: complete onboarding registration
      setIsSubmitting(true);
      signup({
        companyName: onboardingCompany.trim(),
        ownerName: onboardingName,
        email: onboardingEmail.trim(),
        password: onboardingPassword
      }).then((session) => {
        setIsSubmitting(false);
        setAuthMode(null);
        onLoginSuccess('tenant', session.activeTenantId || undefined, session.user.email);
      }).catch((err: any) => {
        setIsSubmitting(false);
        setOnboardingError(err.message || 'Could not create workspace.');
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Let standard form submit handle it naturally to prevent partial submissions
    }
  };

  if (authMode) {
    /* ====================================================== */
    /* FULL SCREEN SPLIT SCREEN AUTH & STEPPED ONBOARDING PAGE */
    /* ====================================================== */
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#070a13',
        color: '#f3f4f6',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Left Column: Brand Marketing Banner */}
        <div style={{
          flex: '0 0 42%',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10 }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', color: 'white', fontSize: '1.05rem'
            }}>
              A
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '1.25rem', fontFamily: 'Space Grotesk, sans-serif' }}>AiraOS</span>
          </div>

          {/* Core Content */}
          <div style={{ zIndex: 10, margin: '60px 0' }}>
            {authMode === 'login' ? (
              <>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: '1.2', fontFamily: 'Space Grotesk, sans-serif', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '20px' }}>
                  Smarter customer relations. Faster than ever.
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '30px' }}>
                  A unified digital employee platform combining vector databases, CRM pipelines, and voice SIP campaigns.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    'Deploy pre-trained AI receptionists in minutes',
                    'Fully integrated Calendar Scheduler booking',
                    'Outbound automated dialer campaigns (SIP Gateway)',
                    'Manage contacts and drag deals in Kanbans',
                    'Interactive web chat widgets mapping vector RAG'
                  ].map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: '1.2', fontFamily: 'Space Grotesk, sans-serif', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '20px' }}>
                  10 minutes. Hours saved.
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '30px' }}>
                  AiraOS builds structured workspace templates for your team. Hire automated experts:
                </p>

                {/* Simulated Agents List from screenshot 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { color: '#6366f1', label: 'AI Receptionist Agent', desc: 'Schedules checkups and answers procedural clinical FAQs.' },
                    { color: '#f59e0b', label: 'AI Sales & Qualifier Agent', desc: 'Captures visitor emails and qualifies property buying budgets.' },
                    { color: '#10b981', label: 'AI Technical Support Agent', desc: 'Searches vector indexes to troubleshoot software errors.' },
                    { color: '#ef4444', label: 'SIP Outbound Dialer Node', desc: 'Dials outbound followups and schedules callbacks.' },
                    { color: '#c084fc', label: 'Workflow Automator coordinator', desc: 'Maps triggers to webhooks and synchronizes custom scripts.' }
                  ].map((agent, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: agent.color, flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#f8fafc', display: 'block' }}>{agent.label}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{agent.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#475569', zIndex: 10 }}>
            © 2026 AiraOS Inc. Secure Docker/SSL Cloud Console.
          </div>

          {/* Glow blob */}
          <div style={{ position: 'absolute', bottom: '-20%', left: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(45px)', pointerEvents: 'none' }} />
        </div>

        {/* Right Column: Active Card Display */}
        <div style={{
          flex: '1',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          position: 'relative'
        }}>
          {/* Close button to return to marketing */}
          <button 
            onClick={() => { setAuthMode(null); setCurrentStep(1); }}
            style={{ position: 'absolute', top: '30px', right: '40px', background: 'none', border: 'none', color: '#64748b', fontSize: '1.25rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕ Close
          </button>

          {/* Card Container */}
          <div style={{ 
            width: authMode === 'signup' ? '500px' : '440px', 
            background: 'white', 
            borderRadius: '16px', 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            padding: '36px',
            color: '#1e293b'
          }}>
            {authMode === 'login' ? (
              /* ================= SIGN IN VIEW ================= */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Stepper Tabs */}
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <button 
                    onClick={() => setAuthMode('login')} 
                    style={{ flex: 1, padding: '8px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'white', color: '#1e293b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => { setAuthMode('signup'); setCurrentStep(1); }} 
                    style={{ flex: 1, padding: '8px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent', color: '#64748b' }}
                  >
                    Sign Up
                  </button>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Welcome back</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', margin: '4px 0 0 0' }}>Sign in to your AiraOS dashboard</p>
                </div>

                {loginError && (
                  <div style={{ padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#475569' }}>Email Address *</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '10px 14px' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com" 
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#475569' }}>Password *</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '10px 14px' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      required 
                    />
                  </div>

                  <button type="submit" className="btn" style={{ width: '100%', padding: '11px', background: '#10b981', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>
                    Sign In <ArrowRight size={14} />
                  </button>
                </form>

                {/* Reviewer logins drawer */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '10px' }}>
                  <button
                    onClick={() => setShowCredsDrawer(!showCredsDrawer)}
                    className="btn"
                    style={{ width: '100%', fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#475569', borderRadius: '6px' }}
                  >
                    <Info size={14} style={{ color: '#6366f1' }} />
                    {showCredsDrawer ? 'Hide Reviewer Logins' : 'Show Reviewer Credentials'}
                  </button>

                  {showCredsDrawer && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', background: '#f8fafc', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      {testProfiles.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setEmail(p.email);
                            setPassword(p.password);
                            setShowCredsDrawer(false);
                          }}
                          className="btn"
                          style={{ width: '100%', padding: '8px', fontSize: '0.7rem', textAlign: 'left', background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', color: '#1e293b' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <strong style={{ color: p.color }}>{p.name}</strong>
                            <span style={{ fontSize: '0.55rem', color: '#64748b' }}>Autofill</span>
                          </div>
                          <div style={{ color: '#475569' }}>User: {p.email} | Pass: {p.password}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '10px' }}>
                  <span>Don't have an account? </span>
                  <button 
                    onClick={() => { setAuthMode('signup'); setCurrentStep(1); }}
                    style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                  >
                    Sign up free
                  </button>
                </div>
              </div>
            ) : (
              /* ================= STEP-BY-STEP SIGN UP / ONBOARDING VIEW ================= */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Progressive Segment Bars matching 4 steps */}
                <div style={{ display: 'flex', gap: '6px', height: '4px' }}>
                  {[1, 2, 3, 4].map((stepNum) => (
                    <div 
                      key={stepNum} 
                      style={{ 
                        flex: 1, 
                        height: '100%', 
                        background: stepNum <= currentStep ? '#10b981' : '#e2e8f0',
                        borderRadius: '2px',
                        transition: 'background-color 0.3s ease'
                      }} 
                    />
                  ))}
                </div>

                {/* Stepper Header agent tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', alignSelf: 'flex-start' }}>
                  <span style={{ fontSize: '1rem' }}>🤖</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4f46e5' }}>AiraOS Onboarding Agent</span>
                </div>

                {/* Stepper Form steps */}
                {isSubmitting ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '14px' }}>
                    <Cpu size={32} className="node-running" style={{ color: '#10b981' }} />
                    <strong style={{ fontSize: '0.85rem', color: '#475569', fontFamily: 'monospace' }}>
                      Assembling workspace containers... provisioning nodes... launching dashboard...
                    </strong>
                  </div>
                ) : (
                  <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {currentStep === 1 && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#1e293b' }}>
                          Create your profile & credentials
                        </label>
                        
                        {onboardingError && (
                          <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '0.75rem', margin: '4px 0' }}>
                            {onboardingError}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#475569' }}>First Name *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '10px 12px', fontSize: '0.8rem' }}
                              value={onboardingFirstName}
                              onChange={(e) => setOnboardingFirstName(e.target.value)}
                              placeholder="John"
                              required 
                            />
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#475569' }}>Last Name *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '10px 12px', fontSize: '0.8rem' }}
                              value={onboardingLastName}
                              onChange={(e) => setOnboardingLastName(e.target.value)}
                              placeholder="Doe"
                              required 
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.75rem', color: '#475569' }}>Phone Number *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '10px 12px', fontSize: '0.8rem' }}
                            value={onboardingPhone}
                            onChange={(e) => setOnboardingPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            required 
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.75rem', color: '#475569' }}>Email Address *</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '10px 12px', fontSize: '0.8rem' }}
                            value={onboardingEmail}
                            onChange={(e) => setOnboardingEmail(e.target.value)}
                            placeholder="you@company.com"
                            required 
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#475569' }}>Password *</label>
                            <input 
                              type="password" 
                              className="form-input" 
                              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '10px 12px', fontSize: '0.8rem' }}
                              value={onboardingPassword}
                              onChange={(e) => setOnboardingPassword(e.target.value)}
                              placeholder="••••••••"
                              required 
                            />
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#475569' }}>Confirm Password *</label>
                            <input 
                              type="password" 
                              className="form-input" 
                              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '10px 12px', fontSize: '0.8rem' }}
                              value={onboardingConfirmPassword}
                              onChange={(e) => setOnboardingConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              required 
                            />
                          </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '8px 20px', background: '#10b981', border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', marginTop: '10px' }}>
                          Next →
                        </button>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Question 1 of 4 • Press Enter</span>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#1e293b' }}>
                          What is your company name?
                        </label>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '12px 14px', fontSize: '0.85rem' }}
                          value={onboardingCompany}
                          onChange={(e) => setOnboardingCompany(e.target.value)}
                          placeholder="e.g. Acme Corporation"
                          autoFocus
                          required 
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button 
                            type="button" 
                            onClick={() => setCurrentStep(1)} 
                            style={{ 
                              padding: '8px 16px', 
                              fontSize: '0.8rem', 
                              background: '#f1f5f9', 
                              color: '#475569', 
                              border: '1px solid #cbd5e1', 
                              borderRadius: '6px', 
                              cursor: 'pointer', 
                              fontWeight: 'bold',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#e2e8f0';
                              e.currentTarget.style.color = '#1e293b';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f1f5f9';
                              e.currentTarget.style.color = '#475569';
                            }}
                          >
                            Back
                          </button>
                          <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', background: '#10b981', border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}>Next →</button>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Question 2 of 4</span>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#1e293b' }}>
                          Select your industry / sector
                        </label>
                        <select 
                          className="form-input"
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '10px 14px', fontSize: '0.85rem', height: '42px' }}
                          value={onboardingIndustry}
                          onChange={(e) => setOnboardingIndustry(e.target.value)}
                          autoFocus
                        >
                          <option value="Medical / Healthcare">Medical / Healthcare</option>
                          <option value="Real Estate">Real Estate</option>
                          <option value="Finance & Insurance">Finance & Insurance</option>
                          <option value="Legal Services">Legal Services</option>
                          <option value="Hospitality & Booking">Hospitality & Booking</option>
                          <option value="Technology & APIs">Technology & APIs</option>
                        </select>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button 
                            type="button" 
                            onClick={() => setCurrentStep(2)} 
                            style={{ 
                              padding: '8px 16px', 
                              fontSize: '0.8rem', 
                              background: '#f1f5f9', 
                              color: '#475569', 
                              border: '1px solid #cbd5e1', 
                              borderRadius: '6px', 
                              cursor: 'pointer', 
                              fontWeight: 'bold',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#e2e8f0';
                              e.currentTarget.style.color = '#1e293b';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f1f5f9';
                              e.currentTarget.style.color = '#475569';
                            }}
                          >
                            Back
                          </button>
                          <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', background: '#10b981', border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}>Next →</button>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Question 3 of 4</span>
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#1e293b' }}>
                          How many employees do you have?
                        </label>
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '12px 14px', fontSize: '0.85rem' }}
                          value={onboardingEmployees}
                          onChange={(e) => setOnboardingEmployees(e.target.value)}
                          placeholder="e.g. 50"
                          autoFocus
                          required 
                        />

                        {/* Answers Summary box matching screenshot 3 */}
                        <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', color: '#475569', fontSize: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span>🏢 Company:</span>
                            <strong style={{ color: '#1e293b' }}>{onboardingCompany}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span>⚙️ Industry:</span>
                            <strong style={{ color: '#1e293b' }}>{onboardingIndustry}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span>👤 Name:</span>
                            <strong style={{ color: '#1e293b' }}>{onboardingName}</strong>
                          </div>
                          {onboardingPhone && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <span>📞 Phone:</span>
                              <strong style={{ color: '#1e293b' }}>{onboardingPhone}</strong>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span>📧 Email:</span>
                            <strong style={{ color: '#1e293b' }}>{onboardingEmail}</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button 
                            type="button" 
                            onClick={() => setCurrentStep(3)} 
                            style={{ 
                              padding: '8px 16px', 
                              fontSize: '0.8rem', 
                              background: '#f1f5f9', 
                              color: '#475569', 
                              border: '1px solid #cbd5e1', 
                              borderRadius: '6px', 
                              cursor: 'pointer', 
                              fontWeight: 'bold',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#e2e8f0';
                              e.currentTarget.style.color = '#1e293b';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f1f5f9';
                              e.currentTarget.style.color = '#475569';
                            }}
                          >
                            Back
                          </button>
                          <button type="submit" className="btn" style={{ padding: '8px 20px', background: '#10b981', border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>
                            Continue to Tools →
                          </button>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Question 4 of 4</span>
                      </div>
                    )}
                  </form>
                )}
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '10px' }}>
                  <span>Already have an account? </span>
                  <button 
                    onClick={() => { setAuthMode('login'); }}
                    style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                  >
                    Log In
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================== */
  /* STANDARD LANDING PAGE VIEW (HOMEPAGE) */
  /* ========================================================== */
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#070a13', 
      color: '#f3f4f6', 
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflowY: 'auto'
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', top: '0', left: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Container */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Navbar */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '24px 0', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '38px', height: '38px', borderRadius: '10px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', color: 'white', fontWeight: '800'
            }}>
              A
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '0.05em', fontFamily: 'Space Grotesk, sans-serif' }}>
              AiraOS
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button 
              onClick={() => setAuthMode('login')} 
              className="btn btn-secondary" 
              style={{ fontSize: '0.85rem', padding: '8px 18px', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setAuthMode('signup'); setCurrentStep(1); }} 
              className="btn btn-primary" 
              style={{ fontSize: '0.85rem', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <UserPlus size={14} /> Get Started
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{ textAlign: 'center', padding: '60px 0 80px 0', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            border: '1px solid rgba(99, 102, 241, 0.2)', 
            padding: '6px 14px', 
            borderRadius: '20px', 
            fontSize: '0.75rem', 
            color: '#a5b4fc',
            marginBottom: '24px',
            fontWeight: '600'
          }}>
            <Sparkles size={12} /> The Digital Employee Platform for Modern SMEs
          </div>
          
          <h2 style={{ 
            fontSize: '3.6rem', 
            fontWeight: '800', 
            lineHeight: '1.15', 
            letterSpacing: '-0.02em', 
            fontFamily: 'Space Grotesk, sans-serif',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '24px'
          }}>
            Deploy AI Employees to Automate Your Business operations
          </h2>
          
          <p style={{ fontSize: '1.15rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '36px' }}>
            Not just simple chat widgets. Hire fully autonomous receptionist, sales advisor, and customer support representatives. Integrates natively with calendar scheduling, CRM databases, vector knowledge bases, and automation workflows.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button 
              onClick={() => setAuthMode('login')} 
              className="btn btn-primary"
              style={{ padding: '12px 32px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              Sign In to Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Feature Grid / Core Capabilities */}
        <section style={{ padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '700', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.01em' }}>
              Everything Your Business Needs In One Client Portal
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '8px', maxWidth: '580px', margin: '8px auto 0 auto' }}>
              Your clients login to their workspace and manage AI employees, vector documentation, pipeline stages, calendar bookings, and visual workflows.
            </p>
          </div>

          <div className="grid-cols-12" style={{ gap: '20px' }}>
            <div className="col-span-4 glass-card hover-glow" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '16px' }}>
                🧠
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>AI Reasoning Brain</h4>
              <p style={{ fontSize: '0.8rem', lineHeight: '1.5', color: '#94a3b8' }}>
                Tune background instructions, configure model layers (temperature, tokens), select engines, and test playground responses.
              </p>
            </div>

            <div className="col-span-4 glass-card hover-glow" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '16px' }}>
                💬
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>Unified Customer Inbox</h4>
              <p style={{ fontSize: '0.8rem', lineHeight: '1.5', color: '#94a3b8' }}>
                Monitor active chat sessions across SMS, WhatsApp, and Web. Switch autopilot to manual mode to reply live to clients.
              </p>
            </div>

            <div className="col-span-4 glass-card hover-glow" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '16px' }}>
                🔄
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>Automation Workflows</h4>
              <p style={{ fontSize: '0.8rem', lineHeight: '1.5', color: '#94a3b8' }}>
                Design multi-node automation trees. Automatically fire webhook alerts, sync customer lists, and trigger alerts.
              </p>
            </div>

            <div className="col-span-4 glass-card hover-glow" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '16px' }}>
                📅
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>Calendar Scheduler</h4>
              <p style={{ fontSize: '0.8rem', lineHeight: '1.5', color: '#94a3b8' }}>
                Let AI employees check calendar availability slots, reserve dentist cleanings or penthouses, and schedule outlook meetings.
              </p>
            </div>

            <div className="col-span-4 glass-card hover-glow" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(167,139,250,0.1)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '16px' }}>
                🏢
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>Sales Pipeline CRM</h4>
              <p style={{ fontSize: '0.8rem', lineHeight: '1.5', color: '#94a3b8' }}>
                Record qualified deals, drag-and-drop kanban cards, store visitor profiles, and monitor contract metrics.
              </p>
            </div>

            <div className="col-span-4 glass-card hover-glow" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '16px' }}>
                📞
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>Voice AI Simulator</h4>
              <p style={{ fontSize: '0.8rem', lineHeight: '1.5', color: '#94a3b8' }}>
                Provide automated SIP calling. Perform real-time speech-to-text transcriptions and playback AI audio waves.
              </p>
            </div>
          </div>
        </section>

        {/* AI Agent Personas Showcase */}
        <section style={{ padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '700', fontFamily: 'Space Grotesk, sans-serif' }}>
              Meet Pre-Configured Digital Employees
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '6px' }}>
              Deploy specialized AI workforce roles equipped with distinct triggers and personalities.
            </p>
          </div>

          <div className="grid-cols-12" style={{ gap: '24px' }}>
            <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agentPersonas.map((persona, i) => {
                const isActive = activePersonaIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => setActivePersonaIdx(i)}
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '16px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: isActive ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)',
                      borderColor: isActive ? 'var(--primary-color)' : 'rgba(255,255,255,0.03)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderRadius: '8px',
                      color: isActive ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img src={persona.avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{persona.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{persona.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="col-span-8 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{agentPersonas[activePersonaIdx].name}</h4>
                <span className="badge badge-primary">{agentPersonas[activePersonaIdx].role}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>SYSTEM BACKGROUND PROMPT</span>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.03)' }}>
                  "{agentPersonas[activePersonaIdx].prompt}"
                </p>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>ASSIGNED CHANNELS & TOOLS</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {agentPersonas[activePersonaIdx].tools.map((t, idx) => (
                      <span key={idx} style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '4px', color: '#a5b4fc' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ width: '240px', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '20px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>PERFORMANCE KPIs</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Load:</span>
                      <strong style={{ color: 'white' }}>{agentPersonas[activePersonaIdx].stats.chats}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Auto-Resolution:</span>
                      <strong style={{ color: 'var(--success-color)' }}>{agentPersonas[activePersonaIdx].stats.resolution}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Voice Traffic:</span>
                      <strong style={{ color: 'white' }}>{agentPersonas[activePersonaIdx].stats.voiceMins}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Accordion FAQ Section */}
        <section style={{ padding: '60px 0 100px 0', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '700', fontFamily: 'Space Grotesk, sans-serif' }}>
              Frequently Asked Questions
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '6px' }}>
              Get answers about platform security, integrations, VPS hosting, and setup parameters.
            </p>
          </div>

          <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, i) => {
              const isOpen = openFaqIdx === i;
              return (
                <div 
                  key={i} 
                  className="glass-card" 
                  style={{ 
                    padding: '16px 20px', 
                    cursor: 'pointer',
                    borderColor: isOpen ? 'var(--primary-color)' : 'rgba(255,255,255,0.03)'
                  }}
                  onClick={() => toggleFaq(i)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <HelpCircle size={16} style={{ color: 'var(--primary-color)', flexShrink: 0 }} /> {faq.q}
                    </h4>
                    {isOpen ? <ChevronDown size={16} style={{ transform: 'rotate(180deg)' }} /> : <ChevronDown size={16} />}
                  </div>
                  
                  {isOpen && (
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '12px', lineHeight: '1.5', paddingLeft: '24px', borderLeft: '1px solid var(--border-glass)' }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <footer style={{ 
        borderTop: '1px solid rgba(255,255,255,0.05)', 
        padding: '30px 0', 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        color: '#64748b',
        backgroundColor: '#05070c'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>© 2026 AiraOS Inc. All rights reserved.</span>
          <span style={{ display: 'flex', gap: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Server size={12} /> VPS Docker Deployed</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={12} /> SSL Certified</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
