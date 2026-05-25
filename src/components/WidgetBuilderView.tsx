import React, { useState, useEffect, useRef } from 'react';
import { 
  Code, Eye, RefreshCw, Send, Check, Copy, PhoneCall, 
  Volume2, Mic, PhoneOff, Globe, Sparkles, Terminal, CheckCircle2, 
  Trash2, Layers, Settings, Laptop, ArrowRight, AlertCircle
} from 'lucide-react';
import { Tenant, Agent, ChatMessage } from '../types';

interface WidgetBuilderViewProps {
  tenant: Tenant;
  agents: Agent[];
  onAddAppointment: (newApp: any) => void;
  conversations: any[];
  onAddMessage: (convId: string, text: string, sender: 'customer' | 'ai' | 'human', slots?: string[]) => void;
  mode?: 'widget' | 'website';
  websiteEditsLimit: number;
  websiteEditsUsed: number;
  onIncrementWebsiteEdits: () => void;
  onAddContact: (newContactData: { name: string; email: string; phone: string; company: string }) => void;
}

export const WidgetBuilderView: React.FC<WidgetBuilderViewProps> = ({
  tenant,
  agents,
  onAddAppointment,
  conversations,
  onAddMessage,
  mode = 'website',
  websiteEditsLimit,
  websiteEditsUsed,
  onIncrementWebsiteEdits,
  onAddContact
}) => {
  // Config tab toggler synced with props mode
  const [configTab, setConfigTab] = useState<'website' | 'widget'>(mode);

  useEffect(() => {
    setConfigTab(mode);
  }, [mode]);

  // Widget customizer states
  const [widgetTitle, setWidgetTitle] = useState(`${tenant.name} AI Assistant`);
  const [greeting, setGreeting] = useState("Hello! How can I help you today?");
  const [widgetColor, setWidgetColor] = useState(tenant.primaryColor);
  const [position, setPosition] = useState<'right' | 'left'>('right');
  const [widgetMode, setWidgetMode] = useState<'chat' | 'voice' | 'hybrid'>('hybrid');
  
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Selected agent for widget and voice simulator
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || '');

  // Auto-select first matching agent or first agent on agents list updates
  useEffect(() => {
    if (agents.length > 0) {
      const defaultAgent = agents.find(a => a.department === 'Reception' || a.department === 'Sales') || agents[0];
      setSelectedAgentId(defaultAgent.id);
    }
  }, [agents]);

  const activeAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  // AI Website Builder states
  const [businessName, setBusinessName] = useState(tenant.name);
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [services, setServices] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [theme, setTheme] = useState('sleek-clinic'); // 'neo-glass' | 'sleek-clinic' | 'luxury-estate' | 'tech-minimalist' | 'warm-creative'
  const [isWebsiteGenerated, setIsWebsiteGenerated] = useState(false);

  // DNS / Domain routing state
  const [domainType, setDomainType] = useState<'subdomain' | 'custom'>(() => {
    return (localStorage.getItem(`tenant_domain_type_${tenant.id}`) as 'subdomain' | 'custom') || 'subdomain';
  });
  const [customDomain, setCustomDomain] = useState(() => {
    return localStorage.getItem(`tenant_custom_domain_${tenant.id}`) || '';
  });

  // Lead capture states
  const [requirePreChatLeadCapture, setRequirePreChatLeadCapture] = useState(() => {
    return localStorage.getItem(`widget_prechat_leadcapture_${tenant.id}`) === 'true';
  });
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);

  useEffect(() => {
    localStorage.setItem(`widget_prechat_leadcapture_${tenant.id}`, String(requirePreChatLeadCapture));
  }, [requirePreChatLeadCapture, tenant.id]);

  useEffect(() => {
    setHasSubmittedLead(false);
    setLeadName('');
    setLeadEmail('');
    setLeadPhone('');
  }, [tenant.id, requirePreChatLeadCapture]);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadEmail.trim() || !leadPhone.trim()) return;

    onAddContact({
      name: leadName.trim(),
      email: leadEmail.trim(),
      phone: leadPhone.trim(),
      company: 'Web Live Chat'
    });

    setHasSubmittedLead(true);
    
    // Add introductory message from AI
    onAddMessage(activeConvId, `Thank you, ${leadName.split(' ')[0]}! Your contact details are stored in our CRM. ${greeting}`, 'ai');
  };

  useEffect(() => {
    localStorage.setItem(`tenant_domain_type_${tenant.id}`, domainType);
    localStorage.setItem(`tenant_custom_domain_${tenant.id}`, customDomain);
  }, [domainType, customDomain, tenant.id]);

  // AI generation simulator states
  const [isGenerating, setIsGenerating] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Derive conversation messages from the global props to enable real-time sync with Unified Inbox
  const activeConvId = tenant.id === 't-1' ? 'conv-1' : tenant.id === 't-2' ? 'conv-2' : 'conv-3';
  const activeConversation = conversations.find(c => c.id === activeConvId);
  const chatMessages: ChatMessage[] = activeConversation ? activeConversation.messages : [];

  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  // Voice call simulator states
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connected');
  const [callTranscript, setCallTranscript] = useState<string[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcripts
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [callTranscript]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Load configuration from localStorage on tenant switch
  useEffect(() => {
    const savedConfig = localStorage.getItem(`tenant_website_config_${tenant.id}`);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setBusinessName(parsed.businessName || tenant.name);
        setSlogan(parsed.slogan || '');
        setDescription(parsed.description || '');
        setServices(parsed.services || '');
        setPhone(parsed.phone || '');
        setEmail(parsed.email || '');
        setTheme(parsed.theme || 'sleek-clinic');
        setIsWebsiteGenerated(parsed.isWebsiteGenerated || false);
      } catch (e) {}
    } else {
      // Load defaults
      setBusinessName(tenant.name);
      if (tenant.id === 't-1') {
        setSlogan("Gentle Care, Beautiful Smiles");
        setDescription("At Smile Dental Clinic, we provide state-of-the-art dental care for patients of all ages. From general checkups to cosmetic teeth whitening and cleanings, our professional team is dedicated to your oral health.");
        setServices("Teeth Whitening, Dental Cleanings, Teeth Aligners, Cosmetic Dentistry, Emergency Oral Care");
        setPhone("+1 (555) 019-2834");
        setEmail("hello@smiledentalclinic.com");
        setTheme("sleek-clinic");
      } else if (tenant.id === 't-2') {
        setSlogan("Elevated Living - Premium Luxury Estates");
        setDescription("Apex Heights connects you with the finest luxury properties in the metropolitan area. Specializing in high-end penthouse units, model suite viewings, and personalized real estate consultations.");
        setServices("Private Penthouse Tours, Real Estate Consultations, Portfolio Management, Luxury Market Evaluation");
        setPhone("+1 (555) 489-1122");
        setEmail("listings@apexheights.co");
        setTheme("luxury-estate");
      } else {
        setSlogan("Scalable Infrastructure - Enterprise Dev Support");
        setDescription("ByteTech Software Solutions builds secure, Docker-containerized cloud microservices. Our vector databases and technical API nodes process millions of sync transactions daily.");
        setServices("API Integration Sync, Developer Support Consult, System Architecture Audit, Cloud Node Maintenance");
        setPhone("+1 (555) 762-9900");
        setEmail("dev-support@bytetech.io");
        setTheme("tech-minimalist");
      }
      setIsWebsiteGenerated(false);
    }
  }, [tenant.id]);

  // Sync widget customizations to active tenant defaults
  useEffect(() => {
    setWidgetTitle(`${tenant.name} AI Assistant`);
    setWidgetColor(tenant.primaryColor);
    
    let defaultGreeting = `Hello! I am ${activeAgent?.name || 'Sarah'}, your AI assistant for ${tenant.name}. How can I assist you today?`;
    if (tenant.id === 't-1') {
      defaultGreeting = `Hi! I am ${activeAgent?.name || 'Sarah'}, the AI receptionist for ${tenant.name}. I can help answer FAQs, check availability, and book a consulting session. What would you like to schedule?`;
    } else if (tenant.id === 't-2') {
      defaultGreeting = `Hi! I am ${activeAgent?.name || 'Marcus'}, the AI coordinator for ${tenant.name}. I can capture your requirements and schedule a tour or call. What are you looking for?`;
    }
    
    setGreeting(defaultGreeting);
  }, [tenant.id, activeAgent, tenant.name, tenant.primaryColor]);

  const handleStartVoiceCall = () => {
    setIsCalling(true);
    setCallStatus('connecting');
    setCallTranscript(['System: Initializing secure SIP voice connection...']);

    setTimeout(() => {
      setCallStatus('connected');
      setCallTranscript(prev => [
        ...prev,
        `AI (${activeAgent?.name || 'Sarah'}): Welcome to ${businessName}. This is your AI digital assistant. How can I help you today?`
      ]);
    }, 1200);
  };

  const handleSimulateSpeechOption = (phrase: string, response: string, bookSlot?: string) => {
    setCallTranscript(prev => [...prev, `Customer: "${phrase}"`]);
    
    // Simulate AI thinking and replying
    setTimeout(() => {
      setCallTranscript(prev => [...prev, `AI (${activeAgent?.name || 'Sarah'}): "${response}"`]);

      if (bookSlot) {
        // Book appointment
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 1); // tomorrow
        appointmentDate.setHours(14, 30, 0, 0); // 2:30 PM

        const mockApp = {
          id: `app-voice-widget-${Date.now()}`,
          contactId: 'c-101', // John Doe
          agentId: activeAgent?.id || 'a-1',
          dateTime: appointmentDate.toISOString(),
          duration: 30,
          location: tenant.id === 't-1' ? 'Suite 200, Main Clinic' : tenant.id === 't-2' ? 'Penthouse A, Apex Heights' : 'ByteTech Conference Room',
          type: bookSlot,
          status: 'scheduled'
        };
        onAddAppointment(mockApp as any);

        setTimeout(() => {
          setCallTranscript(prev => [
            ...prev, 
            `System Alert: Slot Booked [${bookSlot} tomorrow at 2:30 PM]`
          ]);
        }, 800);
      }
    }, 1200);
  };

  const handleConfirmSlot = (slot: string) => {
    onAddMessage(activeConvId, `Confirm: ${slot}`, 'customer');
    setIsTyping(true);

    setTimeout(() => {
      const chosenHour = slot.includes('2:30') ? 14 : slot.includes('4:00') ? 16 : slot.includes('10:00') ? 10 : slot.includes('3:00') ? 15 : slot.includes('11:00') ? 11 : 16;
      const chosenMin = slot.includes('30') ? 30 : 0;
      
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 1); // tomorrow
      appointmentDate.setHours(chosenHour, chosenMin, 0, 0);

      const mockApp = {
        id: `app-widget-${Date.now()}`,
        contactId: 'c-101', // John Doe
        agentId: activeAgent?.id || 'a-1',
        dateTime: appointmentDate.toISOString(),
        duration: 30,
        location: tenant.id === 't-1' ? 'Suite 200, Main Clinic' : tenant.id === 't-2' ? 'Penthouse A, Apex Heights' : 'ByteTech Conference Room',
        type: slot.split('(')[0].trim() || 'General Consultation',
        status: 'scheduled'
      };

      onAddAppointment(mockApp as any);

      const reply = `Appointment successfully scheduled! I have booked your slot for ${slot} tomorrow. Your Calendar Scheduler has been updated. You can verify it under the Scheduler tab in your dashboard!`;
      
      onAddMessage(activeConvId, reply, 'ai');
      setIsTyping(false);
    }, 1200);
  };

  const scriptTag = `<script 
  src="https://cdn.airaos.com/widget.js" 
  data-tenant-id="${tenant.id}" 
  data-title="${widgetTitle}" 
  data-color="${widgetColor}" 
  data-position="${position}" 
  data-mode="${widgetMode}" 
  defer>
</script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;

    const userText = chatInput;
    onAddMessage(activeConvId, userText, 'customer');
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      let slots: string[] | undefined = undefined;
      const lower = userText.toLowerCase();
      const isBookingKeyword = lower.includes('book') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('reserve');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toLocaleDateString([], { month: 'short', day: 'numeric' });

      if (tenant.id === 't-1') {
        // Dental
        if (isBookingKeyword) {
          reply = 'I can help with that. Please choose an available Dentist checkup slot below:';
          slots = [`2:30 PM (Tomorrow, ${dateStr} - Teeth Cleaning)`, `4:00 PM (Tomorrow, ${dateStr} - Dentist Whitening)`];
        } else if (lower.includes('hour') || lower.includes('open')) {
          reply = 'Smile Dental is open Mon-Fri from 9AM to 6PM. We are closed on weekends!';
        } else if (lower.includes('cleaning') || lower.includes('cost')) {
          reply = 'Teeth cleaning is $120. Whitenings are $450. Can I book this for you?';
          slots = [`2:30 PM (Tomorrow, ${dateStr} - Teeth Cleaning)`];
        } else {
          reply = `Hi! I am ${activeAgent?.name || 'Sarah'}, the AI receptionist. I can help book dentist visits and answer FAQ. What would you like to schedule?`;
        }
      } else if (tenant.id === 't-2') {
        // Real Estate
        if (isBookingKeyword) {
          reply = 'Our penthouse showings are available tomorrow. Select a tour window:';
          slots = [`10:00 AM (Tomorrow, ${dateStr} - Penthouse Tour)`, `3:00 PM (Tomorrow, ${dateStr} - Real Estate Consult)`];
        } else if (lower.includes('price')) {
          reply = 'Our pricing starts at $850,000. Send me your email and I will email the pricing sheet!';
          slots = [`3:00 PM (Tomorrow, ${dateStr} - Real Estate Consult)`];
        } else {
          reply = `Hi! ${activeAgent?.name || 'Marcus'} the AI coordinator here. I book penthouse model tours. What price budget are you shopping for?`;
        }
      } else {
        if (isBookingKeyword) {
          reply = 'Please select a technical developer support slot:';
          slots = [`11:00 AM (Tomorrow, ${dateStr} - Dev Support Sync)`, `4:30 PM (Tomorrow, ${dateStr} - Operational Sync)`];
        } else {
          reply = `I am looking up the technical user guides to solve your error. What is your transaction ID?`;
          slots = [`11:00 AM (Tomorrow, ${dateStr} - Dev Support Sync)`];
        }
      }

      onAddMessage(activeConvId, reply, 'ai', slots);
      setIsTyping(false);
    }, 1200);
  };

  const handleGenerateWebsite = () => {
    if (websiteEditsUsed >= websiteEditsLimit) return;
    setIsGenerating(true);
    setTerminalLogs([]);
    
    // Retrieve global OpenAI Key to simulate actual API connection
    let integrationsData: any = {};
    try {
      const stored = localStorage.getItem('coolify_integrations');
      if (stored) integrationsData = JSON.parse(stored);
    } catch(e) {}
    const hasGlobalKey = !!integrationsData.openaiApiKey;
    const apiKeyPrompt = hasGlobalKey 
      ? `[API] sk-proj-...${integrationsData.openaiApiKey.substring(Math.max(0, integrationsData.openaiApiKey.length - 6))} authenticated.`
      : `[API] No custom OpenAI API Key found. Utilizing shared platform developer gateway...`;

    const logs = [
      `[SYSTEM] Connecting to server-side AI website builder engine...`,
      apiKeyPrompt,
      `[AI AGENT] Fetching vector context index from knowledge bases...`,
      `[AI AGENT] Running generative layout planner on gpt-4o model...`,
      `[AI AGENT] Creating customized marketing copy and service cards...`,
      `[THEME ENGINE] Compiling CSS stylesheets for selected style: "${theme.toUpperCase()}"...`,
      `[THEME ENGINE] Building responsive section anchors (#home, #services, #about, #contact)...`,
      `[WIDGET INJECTOR] Embedding dynamic AiraOS live-chat and voice widget...`,
      `[ROUTER] Mapping Traefik reverse-proxy domain: https://${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.airaos.com...`,
      `[ROUTER] Registering LetsEncrypt SSL security certification...`,
      `[SUCCESS] AI Web Node deployed successfully! Site is now LIVE and responsive.`
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < logs.length) {
        setTerminalLogs(prev => [...prev, logs[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsGenerating(false);
          setIsWebsiteGenerated(true);
          onIncrementWebsiteEdits(); // Call the parent callback to increment
          // Save to localStorage
          const config = {
            businessName,
            slogan,
            description,
            services,
            phone,
            email,
            theme,
            isWebsiteGenerated: true
          };
          localStorage.setItem(`tenant_website_config_${tenant.id}`, JSON.stringify(config));
        }, 800);
      }
    }, 600);
  };

  const handleResetWebsite = () => {
    setIsWebsiteGenerated(false);
    localStorage.removeItem(`tenant_website_config_${tenant.id}`);
  };

  // Render mock business site based on active inputs and theme selection
  const renderMockupWebsite = () => {
    let themeBg = '#0b1329';
    let themeText = '#f8fafc';
    let themeTextSec = '#94a3b8';
    let themeAccent = widgetColor;
    let themeCardBg = 'rgba(255, 255, 255, 0.02)';
    let themeCardBorder = 'rgba(255, 255, 255, 0.05)';
    let themeHeaderBg = 'rgba(10, 15, 30, 0.7)';
    let fontStyle = 'Inter, sans-serif';

    if (theme === 'sleek-clinic') {
      themeBg = '#0b1329';
      themeAccent = '#0ea5e9';
      themeCardBg = 'rgba(14, 165, 233, 0.03)';
      themeCardBorder = 'rgba(14, 165, 233, 0.15)';
      themeHeaderBg = 'rgba(11, 19, 41, 0.85)';
    } else if (theme === 'luxury-estate') {
      themeBg = '#0c0a09';
      themeAccent = '#f59e0b';
      themeCardBg = 'rgba(245, 158, 11, 0.02)';
      themeCardBorder = 'rgba(245, 158, 11, 0.12)';
      themeHeaderBg = 'rgba(12, 10, 9, 0.9)';
      fontStyle = 'Space Grotesk, sans-serif';
    } else if (theme === 'tech-minimalist') {
      themeBg = '#050505';
      themeAccent = '#10b981';
      themeCardBg = 'rgba(16, 185, 129, 0.01)';
      themeCardBorder = 'rgba(16, 185, 129, 0.1)';
      themeHeaderBg = 'rgba(5, 5, 5, 0.95)';
      fontStyle = 'monospace';
    } else if (theme === 'warm-creative') {
      themeBg = '#180e0f';
      themeAccent = '#f43f5e';
      themeCardBg = 'rgba(244, 63, 94, 0.02)';
      themeCardBorder = 'rgba(244, 63, 94, 0.15)';
      themeHeaderBg = 'rgba(24, 14, 15, 0.85)';
      fontStyle = 'Outfit, sans-serif';
    } else { // neo-glass
      themeBg = '#0a0f1d';
      themeAccent = '#6366f1';
      themeCardBg = 'rgba(255, 255, 255, 0.02)';
      themeCardBorder = 'rgba(255, 255, 255, 0.06)';
      themeHeaderBg = 'rgba(10, 15, 29, 0.75)';
      fontStyle = 'Inter, sans-serif';
    }

    const servicesArr = services.split(',').map(s => s.trim()).filter(Boolean);

    return (
      <div style={{
        background: themeBg,
        color: themeText,
        fontFamily: fontStyle,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Header Navigation */}
        <header style={{
          padding: '12px 24px',
          background: themeHeaderBg,
          borderBottom: `1px solid ${themeCardBorder}`,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>{tenant.logo}</span>
            <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: themeAccent }}>{businessName}</span>
          </div>
          <nav style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: themeTextSec }}>
            <span style={{ color: themeText, cursor: 'default' }}>Home</span>
            <span style={{ cursor: 'default' }}>Services</span>
            <span style={{ cursor: 'default' }}>About</span>
            <span style={{ cursor: 'default' }}>Contact</span>
          </nav>
        </header>

        {/* Hero Section */}
        <section style={{
          padding: '40px 24px 30px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ 
            fontSize: '0.65rem', 
            textTransform: 'uppercase', 
            fontWeight: 'bold', 
            color: themeAccent, 
            letterSpacing: '0.1em',
            padding: '2px 8px',
            background: `${themeAccent}15`,
            borderRadius: '20px',
            border: `1px solid ${themeAccent}33`
          }}>
            AI Web Agent Deployed
          </span>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            lineHeight: '1.25',
            color: themeText,
            margin: 0
          }}>
            {slogan || "AI Driven Customer Relations"}
          </h1>
          <p style={{ 
            fontSize: '0.75rem', 
            color: themeTextSec, 
            lineHeight: '1.4',
            margin: 0 
          }}>
            {description || "Enhancing modern customer journeys with advanced AI employees, vector knowledge bases, and real-time scheduling."}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button 
              onClick={() => setWidgetOpen(true)}
              className="btn" 
              style={{ 
                background: themeAccent, 
                color: 'white', 
                border: 'none', 
                fontSize: '0.75rem', 
                padding: '6px 14px',
                fontWeight: 'bold',
                boxShadow: `0 0 10px ${themeAccent}44`
              }}
            >
              💬 Chat With Us
            </button>
          </div>
        </section>

        {/* Services Section */}
        <section style={{
          padding: '24px',
          borderTop: `1px solid ${themeCardBorder}`,
          background: 'rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px', color: themeText, margin: '0 0 16px 0' }}>
            Our Featured Services
          </h3>
          <div className="grid-cols-12" style={{ gap: '12px' }}>
            {servicesArr.length > 0 ? (
              servicesArr.map((svc, sIdx) => (
                <div 
                  key={sIdx} 
                  className="col-span-6" 
                  style={{
                    padding: '12px',
                    background: themeCardBg,
                    border: `1px solid ${themeCardBorder}`,
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '0.9rem', color: themeAccent }}>✦</span>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: themeText, margin: 0 }}>{svc}</h4>
                  <p style={{ fontSize: '0.65rem', color: themeTextSec, lineHeight: '1.3', margin: 0 }}>
                    Fully supported by {tenant.name} AI digital employees.
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-12" style={{ textAlign: 'center', fontSize: '0.7rem', color: themeTextSec }}>
                No services added.
              </div>
            )}
          </div>
        </section>

        {/* Contact Info Footer */}
        <footer style={{
          padding: '20px 24px',
          borderTop: `1px solid ${themeCardBorder}`,
          marginTop: 'auto',
          background: themeHeaderBg,
          fontSize: '0.7rem',
          color: themeTextSec,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div className="grid-cols-12" style={{ gap: '16px' }}>
            <div className="col-span-6" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', color: themeText }}>Contact Support</span>
              {email && <span>📧 {email}</span>}
              {phone && <span>📞 {phone}</span>}
            </div>
            <div className="col-span-6" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', color: themeText }}>Office Location</span>
              <span>100 AI Plaza, Tech Hub</span>
              <span>Open: Mon - Fri (9AM - 6PM)</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', borderTop: `1px solid ${themeCardBorder}`, paddingTop: '10px', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            © 2026 {businessName}. Powered by AiraOS Web Engine.
          </div>
        </footer>
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <div className="view-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 className="view-title">
            {configTab === 'website' ? 'AI Website Builder & DNS' : 'Chatbot Widget Builder'}
          </h2>
          <p className="view-subtitle">
            {configTab === 'website' 
              ? 'Generate business websites automatically using AI and configure custom DNS domain routing.' 
              : 'Customize, preview, and copy the embed script for your text and voice chatbot widget.'}
          </p>
        </div>
      </div>

      <div className="grid-cols-12" style={{ height: 'calc(100vh - 170px)' }}>
        
        {/* Left column: Configurations & Code */}
        <div className="col-span-5 glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', height: '100%' }}>
          
          {configTab === 'website' ? (
            /* Tab 1: AI Website Builder Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Sparkles size={16} style={{ color: 'var(--primary-color)' }} /> Page Generator
                </h3>
                {isWebsiteGenerated && (
                  <button 
                    onClick={handleResetWebsite}
                    className="btn"
                    style={{ fontSize: '0.65rem', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={12} /> Clear Page
                  </button>
                )}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Business Name</label>
                <input type="text" className="form-input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} disabled={isGenerating} />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Slogan / Headline</label>
                <input type="text" className="form-input" value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="e.g. Gentle Care, Beautiful Smiles" disabled={isGenerating} />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Business Description</label>
                <textarea 
                  className="form-input" 
                  style={{ height: '70px', resize: 'none', fontSize: '0.75rem', fontFamily: 'inherit' }} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Summarize your company services and profile..."
                  disabled={isGenerating}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Services List (Comma-separated)</label>
                <input type="text" className="form-input" value={services} onChange={(e) => setServices(e.target.value)} placeholder="e.g. Tooth Whitening, Cleaning, Braces" disabled={isGenerating} />
              </div>

              <div className="grid-cols-12" style={{ gap: '10px' }}>
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label">Contact Phone</label>
                  <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" disabled={isGenerating} />
                </div>
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label">Contact Email</label>
                  <input type="text" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@business.com" disabled={isGenerating} />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Website Style & Theme</label>
                <select className="form-input" value={theme} onChange={(e) => setTheme(e.target.value)} disabled={isGenerating}>
                  <option value="sleek-clinic">Sleek Clinic (Sky Blue / Slate)</option>
                  <option value="luxury-estate">Luxury Estate (Amber Gold / Obsidian)</option>
                  <option value="tech-minimalist">Tech Minimalist (Neon Green / Deep Matrix)</option>
                  <option value="warm-creative">Warm Creative (Coral Rose / Deep Chocolate)</option>
                  <option value="neo-glass">Neo-Glass Dark (Classic Violet / Translucent)</option>
                </select>
              </div>

              {websiteEditsUsed >= websiteEditsLimit && (
                <div style={{ 
                  padding: '12px', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid var(--danger-color)', 
                  borderRadius: '6px', 
                  color: '#fca5a5', 
                  fontSize: '0.75rem', 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '6px',
                  marginTop: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                    <AlertCircle size={14} style={{ color: 'var(--danger-color)' }} /> Website Edit Limit Reached
                  </div>
                  <div>Website edit limit reached for this billing cycle ({websiteEditsUsed}/{websiteEditsLimit}). Upgrade your plan or contact admin.</div>
                </div>
              )}

              <button
                onClick={handleGenerateWebsite}
                disabled={isGenerating || websiteEditsUsed >= websiteEditsLimit}
                className="btn btn-primary"
                style={{ 
                  marginTop: '6px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  background: (websiteEditsUsed >= websiteEditsLimit) ? '#475569' : 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)',
                  border: 'none',
                  boxShadow: (websiteEditsUsed >= websiteEditsLimit) ? 'none' : 'var(--shadow-glow)',
                  cursor: (websiteEditsUsed >= websiteEditsLimit) ? 'not-allowed' : 'pointer',
                  opacity: (websiteEditsUsed >= websiteEditsLimit) ? 0.6 : 1
                }}
              >
                <Sparkles size={16} /> 
                {isGenerating ? 'AI Architect Generating...' : isWebsiteGenerated ? 'Re-Generate AI Website' : 'Generate AI Website'}
              </button>

              {/* Terminal progress simulation */}
              {(isGenerating || terminalLogs.length > 0) && (
                <div 
                  className="glass-card" 
                  style={{ 
                    background: '#04060b', 
                    border: '1px solid var(--border-glass)', 
                    borderRadius: '6px', 
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    color: '#10b981',
                    maxHeight: '130px',
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>
                    <Terminal size={12} /> AI COMPILE TERMINAL
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {terminalLogs.map((log, lIdx) => (
                      <div key={lIdx} style={{ color: log.startsWith('[SUCCESS]') ? '#6ee7b7' : log.startsWith('[SYSTEM]') ? '#a78bfa' : '#34d399' }}>
                        {log}
                      </div>
                    ))}
                    {isGenerating && (
                      <div style={{ display: 'flex', gap: '2px', color: 'var(--text-muted)' }}>
                        <span>▋</span>
                      </div>
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                </div>
              )}
              {/* DNS & Custom Domain Config */}
              <div style={{ height: '1px', background: 'var(--border-glass)', margin: '8px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={14} /> DNS & Domain Routing
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="domainType" 
                      value="subdomain" 
                      checked={domainType === 'subdomain'} 
                      onChange={() => setDomainType('subdomain')} 
                    />
                    Host on platform subdomain ({tenant.domain})
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="domainType" 
                      value="custom" 
                      checked={domainType === 'custom'} 
                      onChange={() => setDomainType('custom')} 
                    />
                    Point to custom domain / URL
                  </label>
                </div>

                {domainType === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '6px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.68rem' }}>Custom Domain URL</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                        value={customDomain} 
                        onChange={(e) => setCustomDomain(e.target.value)} 
                        placeholder="e.g. www.mybusiness.com" 
                      />
                    </div>
                    
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                      Configure the following DNS records in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):
                    </div>

                    <table style={{ width: '100%', fontSize: '0.62rem', borderCollapse: 'collapse', border: '1px solid var(--border-glass)' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                          <th style={{ padding: '4px 6px' }}>Type</th>
                          <th style={{ padding: '4px 6px' }}>Host</th>
                          <th style={{ padding: '4px 6px' }}>Target Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: '4px 6px', fontWeight: 'bold' }}>A</td>
                          <td style={{ padding: '4px 6px' }}>@</td>
                          <td style={{ padding: '4px 6px', color: 'var(--primary-color)' }}>165.227.81.40</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 6px', fontWeight: 'bold' }}>CNAME</td>
                          <td style={{ padding: '4px 6px' }}>www</td>
                          <td style={{ padding: '4px 6px', color: 'var(--primary-color)' }}>{tenant.domain}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button 
                        type="button"
                        onClick={() => {
                          const btn = document.getElementById('dns-verify-btn');
                          if (btn) {
                            btn.innerText = 'Checking propagation...';
                            setTimeout(() => {
                              btn.innerText = '✅ DNS Verified & SSL Active';
                            }, 1500);
                          }
                        }}
                        id="dns-verify-btn"
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.65rem', padding: '4px 10px' }}
                      >
                        Verify DNS propagation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Widget Personalization */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Widget Customizations</h3>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Widget Title</label>
                <input type="text" className="form-input" value={widgetTitle} onChange={(e) => setWidgetTitle(e.target.value)} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                <input 
                  type="checkbox" 
                  id="require-lead-capture"
                  checked={requirePreChatLeadCapture} 
                  onChange={(e) => setRequirePreChatLeadCapture(e.target.checked)} 
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="require-lead-capture" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer', margin: 0 }}>
                  Require Pre-Chat Lead Capture Form
                </label>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Default AI Welcome Greeting</label>
                <input type="text" className="form-input" value={greeting} onChange={(e) => { setGreeting(e.target.value); onAddMessage(activeConvId, e.target.value, 'ai'); }} />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Active AI Employee for Widget</label>
                <select 
                  className="form-input" 
                  value={selectedAgentId} 
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid-cols-12" style={{ gap: '10px' }}>
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label">Theme Color Override</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={widgetColor} onChange={(e) => setWidgetColor(e.target.value)} style={{ border: 'none', width: '38px', height: '38px', cursor: 'pointer', background: 'none' }} />
                    <input type="text" className="form-input" value={widgetColor} onChange={(e) => setWidgetColor(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem' }} />
                  </div>
                </div>

                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label">Screen Position</label>
                  <select className="form-input" value={position} onChange={(e) => setPosition(e.target.value as any)}>
                    <option value="right">Bottom Right</option>
                    <option value="left">Bottom Left</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Interaction Channels</label>
                <select className="form-input" value={widgetMode} onChange={(e) => setWidgetMode(e.target.value as any)}>
                  <option value="chat">Chat channel only</option>
                  <option value="voice">Voice channel only</option>
                  <option value="hybrid">Hybrid (Chat + Voice capability)</option>
                </select>
              </div>

              <div style={{ height: '1px', background: 'var(--border-glass)', margin: '4px 0' }} />

              {/* Copyable HTML Code Block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>Integration Script Code</label>
                  <button 
                    onClick={handleCopyCode} 
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copied ? <Check size={12} style={{ color: 'var(--success-color)' }} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy snippet'}
                  </button>
                </div>
                <pre 
                  style={{ 
                    margin: 0,
                    padding: '12px', 
                    background: 'rgba(0,0,0,0.3)', 
                    border: '1px solid var(--border-glass)', 
                    borderRadius: '6px', 
                    fontFamily: 'monospace', 
                    fontSize: '0.7rem', 
                    color: '#67e8f9',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto',
                    lineHeight: '1.4',
                    maxHeight: '100px'
                  }}
                >
                  {scriptTag}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Right column: Live Web Mockup Preview */}
        <div className="col-span-7 glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#090d16' }}>
          
          {/* Mock Browser Header Bar */}
          <div style={{ padding: '10px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-glass)', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '12px', fontFamily: 'monospace' }}>
                {domainType === 'custom' && customDomain ? `https://${customDomain}` : `https://${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.airaos.com`}
              </span>
            </div>
            
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Laptop size={12} /> Live Responsive Sandbox
            </div>
          </div>

          {/* Web Preview Content */}
          <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
            
            {isWebsiteGenerated ? (
              /* Render The Custom Generated Business Site */
              renderMockupWebsite()
            ) : (
              /* High fidelity placeholder state prompting site builder usage */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '40px', textAlign: 'center' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '16px', 
                  background: 'rgba(99, 102, 241, 0.08)', 
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  marginBottom: '16px',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.1)'
                }}>
                  🌐
                </div>
                
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  No Website Found on Subdomain
                </h3>
                
                <p style={{ maxWidth: '400px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '24px' }}>
                  This client tenant does not have a live business site yet. Use the **AI Website Builder** tab to generate a custom, premium home page embedded with your conversational AI receptionist in seconds.
                </p>

                <button 
                  onClick={() => setConfigTab('website')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '8px 16px', cursor: 'pointer' }}
                >
                  Configure AI Site Builder <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Simulated Live Widget Button */}
            {!widgetOpen && (
              <button
                onClick={() => setWidgetOpen(true)}
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  right: position === 'right' ? '24px' : 'auto',
                  left: position === 'left' ? '24px' : 'auto',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: widgetColor,
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  color: 'white',
                  transition: 'all 0.2s ease',
                  zIndex: 200,
                  borderWidth: '1px',
                  borderColor: 'rgba(255,255,255,0.1)'
                }}
              >
                💬
              </button>
            )}

            {/* Simulated Live Widget Window */}
            {widgetOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  right: position === 'right' ? '24px' : 'auto',
                  left: position === 'left' ? '24px' : 'auto',
                  width: '320px',
                  height: '420px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 'var(--radius-md)',
                  zIndex: 200,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  overflow: 'hidden'
                }}
              >
                {/* Header */}
                <div style={{ padding: '14px 16px', background: widgetColor, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🤖</span>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0 }}>{widgetTitle}</h4>
                      <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>AI assistant online</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {(widgetMode === 'hybrid' || widgetMode === 'voice') && !isCalling && (
                      <button 
                        onClick={handleStartVoiceCall}
                        className="pulse-glow"
                        style={{ 
                          background: 'rgba(255,255,255,0.18)', 
                          border: '1px solid rgba(255,255,255,0.25)', 
                          color: 'white', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.6rem',
                          fontWeight: 'bold',
                          boxShadow: '0 0 8px rgba(255,255,255,0.1)'
                        }}
                        title={`Call ${activeAgent?.name || 'Sarah'}`}
                      >
                        <PhoneCall size={10} /> Call {activeAgent?.name || 'Sarah'}
                      </button>
                    )}
                    <button onClick={() => { setWidgetOpen(false); setIsCalling(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      ✕
                    </button>
                  </div>
                </div>

                {isCalling ? (
                  /* Voice Call Interface screen */
                  <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'radial-gradient(circle at center, #111827 0%, #030712 100%)' }}>
                    <div style={{ textAlign: 'center' }}>
                      {/* Pulsing visualizer avatar */}
                      <div className="pulse-glow" style={{ width: '60px', height: '60px', borderRadius: '50%', background: widgetColor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '10px 0', border: '2px solid rgba(255,255,255,0.1)' }}>
                        <Volume2 size={24} style={{ color: 'white' }} />
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}>Active Voice Stream</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-color)', display: 'inline-block' }}></span>
                        {callStatus === 'connecting' ? 'Connecting SIP Gateway...' : 'Connected (Vector KB Locked)'}
                      </div>

                      {/* Sound Wave Animation Visualizer */}
                      {callStatus === 'connected' && (
                        <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', gap: '4px', height: '24px', marginTop: '14px', alignItems: 'center' }}>
                          {[1, 2, 3, 4, 5].map(barId => (
                            <div 
                              key={barId}
                              style={{ 
                                width: '3px', 
                                height: '100%', 
                                background: widgetColor, 
                                borderRadius: '2px',
                                animation: 'soundWave 0.8s infinite ease-in-out',
                                animationDelay: `${barId * 0.15}s`
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Speech Transcription Viewer */}
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '10px', overflowY: 'auto', margin: '14px 0', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {callTranscript.map((log, idx) => (
                        <div key={idx} style={{ 
                          color: log.startsWith('Customer:') ? 'var(--text-primary)' : log.startsWith('System') ? '#ef4444' : '#67e8f9',
                          lineHeight: '1.3',
                          textAlign: 'left'
                        }}>
                          {log}
                        </div>
                      ))}
                      <div ref={transcriptEndRef} />
                    </div>

                    {/* Quick speech triggers simulation controls */}
                    {callStatus === 'connected' && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 'bold', textAlign: 'left' }}>SIMULATE SPEAKING OUT LOUD:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {tenant.id === 't-1' ? (
                            <>
                              <button 
                                onClick={() => handleSimulateSpeechOption('I need to book a dentist visit.', 'Certainly! I have a slot tomorrow at 2:30 PM. I will book that for you.', 'Teeth Cleaning')}
                                className="btn" style={{ padding: '4px', fontSize: '0.65rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                              >
                                🗣️ "I need to book a dentist visit."
                              </button>
                              <button 
                                onClick={() => handleSimulateSpeechOption('What are your opening hours?', `Smile Dental is open Monday through Friday from 9AM to 6PM.`)}
                                className="btn" style={{ padding: '4px', fontSize: '0.65rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                              >
                                🗣️ "What are your opening hours?"
                              </button>
                            </>
                          ) : tenant.id === 't-2' ? (
                            <>
                              <button 
                                onClick={() => handleSimulateSpeechOption('I want to schedule a penthouse tour.', 'Great! We have showing slots tomorrow at 10:00 AM. Let me reserve that for you.', 'Penthouse Tour')}
                                className="btn" style={{ padding: '4px', fontSize: '0.65rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                              >
                                🗣️ "I want to schedule a penthouse tour."
                              </button>
                              <button 
                                onClick={() => handleSimulateSpeechOption('How much are the penthouse units?', 'Pricing starts at $850,000 for penthouse units with rooftop decks.')}
                                className="btn" style={{ padding: '4px', fontSize: '0.65rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                              >
                                🗣️ "How much are the penthouse units?"
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleSimulateSpeechOption('I need developer technical support.', 'Sure. I have mapped a sync tomorrow at 11:00 AM. I will create a schedule booking.', 'Dev Support Sync')}
                                className="btn" style={{ padding: '4px', fontSize: '0.65rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                              >
                                🗣️ "I need developer technical support."
                              </button>
                              <button 
                                onClick={() => handleSimulateSpeechOption('What is your developer platform setup?', 'We deploy isolated Docker containers on Ubuntu VPS nodes managed by Coolify.')}
                                className="btn" style={{ padding: '4px', fontSize: '0.65rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                              >
                                🗣️ "What is your developer setup?"
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => setIsCalling(false)} 
                      className="btn" 
                      style={{ width: '100%', background: '#ef4444', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', padding: '6px', cursor: 'pointer' }}
                    >
                      <PhoneOff size={14} /> End AI Voice Call
                    </button>
                  </div>
                ) : (
                  /* Chat interface screen */
                  <>
                    {requirePreChatLeadCapture && !hasSubmittedLead ? (
                      /* Lead Capture Form */
                      <form onSubmit={handleLeadSubmit} style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-glass)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '1.5rem' }}>📋</span>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: '4px 0 2px' }}>Welcome!</h4>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0 }}>Please introduce yourself to start chatting.</p>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.65rem' }}>Full Name *</label>
                          <input type="text" className="form-input" style={{ fontSize: '0.75rem', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', color: 'white' }} value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="John Doe" required />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.65rem' }}>Email Address *</label>
                          <input type="email" className="form-input" style={{ fontSize: '0.75rem', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', color: 'white' }} value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="john@example.com" required />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.65rem' }}>Phone Number *</label>
                          <input type="tel" className="form-input" style={{ fontSize: '0.75rem', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', color: 'white' }} value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} placeholder="+1 (555) 019-2834" required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ background: widgetColor, border: 'none', color: 'white', fontWeight: 'bold', fontSize: '0.75rem', padding: '8px', cursor: 'pointer', marginTop: '4px' }}>
                          Start Conversation
                        </button>
                      </form>
                    ) : (
                      <>
                        {/* Messages Panel */}
                        <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {chatMessages.map((m, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: m.sender === 'customer' ? 'flex-end' : 'flex-start' }}>
                              <div
                                style={{
                                  maxWidth: '85%',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  lineHeight: '1.4',
                                  background: m.sender === 'customer' ? widgetColor : 'var(--bg-tertiary)',
                                  color: m.sender === 'customer' ? 'white' : 'var(--text-primary)',
                                  border: m.sender === 'customer' ? 'none' : '1px solid var(--border-glass)',
                                  borderBottomRightRadius: m.sender === 'customer' ? '2px' : '8px',
                                  borderBottomLeftRadius: m.sender === 'customer' ? '8px' : '2px',
                                  textAlign: 'left'
                                }}
                              >
                                <div>{m.text}</div>
                                {/* Interactive Booking Slots Buttons */}
                                {m.slots && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                                    {m.slots.map((slot: string, sIdx: number) => (
                                      <button
                                        key={sIdx}
                                        onClick={() => handleConfirmSlot(slot)}
                                        style={{
                                          background: 'rgba(255, 255, 255, 0.05)',
                                          border: '1px solid var(--border-glass)',
                                          borderRadius: '4px',
                                          color: 'white',
                                          fontSize: '0.7rem',
                                          padding: '4px 8px',
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                          width: '100%',
                                          transition: 'background 0.15s ease'
                                        }}
                                      >
                                        📅 {slot}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {isTyping && (
                            <div style={{ display: 'flex', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              <span>AI typing...</span>
                            </div>
                          )}
                        </div>

                        {/* Widget input */}
                        <div style={{ padding: '10px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ask AI receptionist..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                            style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '20px' }}
                          />
                          <button 
                            onClick={handleSendChat}
                            className="btn btn-primary" 
                            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%', backgroundColor: widgetColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: 'pointer' }}
                          >
                            <Send size={12} style={{ color: 'white' }} />
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Web canvas backdrop grid */}
            {!isWebsiteGenerated && (
              <div 
                style={{ 
                  position: 'absolute', 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', 
                  backgroundSize: '20px 20px',
                  zIndex: 0
                }} 
              />
            )}

          </div>

        </div>

      </div>

      <style>{`
        @keyframes soundWave {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }
        .pulse-glow {
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
          animation: pulseGlow 1.6s infinite ease-in-out;
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
      `}</style>
    </div>
  );
};
