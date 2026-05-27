import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, PhoneOff, Mic, Send, RefreshCw, Volume2, Shield, 
  Settings, Play, Phone, Calendar, Plus, Trash2, CheckCircle2, 
  AlertTriangle, Layers, Info, Check, MessageSquare 
} from 'lucide-react';
import { Agent, Contact, Appointment, ChatMessage } from '../types';
import { useAuth } from '../auth/AuthProvider';

interface VoiceAIViewProps {
  agents: Agent[];
  contacts: Contact[];
  onAddAppointment: (newApp: Appointment) => void;
  onAddVoiceConversation?: (contactName: string, phone: string, scriptGoal: string, transcript: ChatMessage[], feedback?: string, email?: string) => void;
  tenantId: string;
  tenantName: string;
  onSwitchTab?: (tab: string) => void;
}

interface OutboundTask {
  id: string;
  name: string;
  phone: string;
  goal: string;
  status: 'scheduled' | 'pending_callback' | 'completed' | 'failed';
  callbackTime?: string;
  feedback?: string;
  crmSynced: boolean;
}

export const VoiceAIView: React.FC<VoiceAIViewProps> = ({
  agents,
  contacts,
  onAddAppointment,
  onAddVoiceConversation,
  tenantId,
  tenantName,
  onSwitchTab
}) => {
  const { apiFetch } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'inbound' | 'outbound' | 'settings'>('inbound');
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || '');

  // Conversational Lead capture state
  const [voiceRequireLeadCapture, setVoiceRequireLeadCapture] = useState(() => {
    return localStorage.getItem(`voice_require_leadcapture_${tenantId}`) === 'true';
  });
  const [leadCaptureStep, setLeadCaptureStep] = useState<number>(0);
  const [capturedName, setCapturedName] = useState('');
  const [capturedEmail, setCapturedEmail] = useState('');
  const [capturedPhone, setCapturedPhone] = useState('');

  // Auto-sync toggle on tenant swap
  useEffect(() => {
    setVoiceRequireLeadCapture(localStorage.getItem(`voice_require_leadcapture_${tenantId}`) === 'true');
    setLeadCaptureStep(0);
    setCapturedName('');
    setCapturedEmail('');
    setCapturedPhone('');
  }, [tenantId]);
  
  // Twilio Integration State
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioNum, setTwilioNum] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load Voice Settings from localStorage
  const [inboundRouting, setInboundRouting] = useState<'twilio' | 'byo'>('twilio');
  const [outboundRouting, setOutboundRouting] = useState<'twilio' | 'byo'>('twilio');
  
  // Custom BYO SIP Config state
  const [byoSipServer, setByoSipServer] = useState('');
  const [byoSipUsername, setByoSipUsername] = useState('');
  const [byoSipPassword, setByoSipPassword] = useState('');
  const [byoPhoneNum, setByoPhoneNum] = useState('');

  // Voice Profile Configuration State
  const [companyName, setCompanyName] = useState('');
  const [companyServices, setCompanyServices] = useState('');
  const [companyPricing, setCompanyPricing] = useState('');
  const [companyHours, setCompanyHours] = useState('');
  const [companyFAQs, setCompanyFAQs] = useState('');

  interface SavedCall {
    id: string;
    direction: 'inbound' | 'outbound';
    contactName: string;
    phone: string;
    goal: string;
    timestamp: string;
    status: string;
    transcript: CallTurn[];
  }

  // Saved calls history
  const [savedCalls, setSavedCalls] = useState<SavedCall[]>([]);
  const [selectedCallForModal, setSelectedCallForModal] = useState<SavedCall | null>(null);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  // Load Config on Mount & Tenant Switch
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiFetch(`/api/tenants/${tenantId}/integrations`);
        if (res.ok) {
          const parsed = await res.json();
          if (parsed.twilioAccountSid) setTwilioSid(parsed.twilioAccountSid);
          if (parsed.twilioAuthToken) setTwilioToken(parsed.twilioAuthToken);
          if (parsed.twilioPhoneNumber) setTwilioNum(parsed.twilioPhoneNumber);
          
          if (parsed.inboundRouting) setInboundRouting(parsed.inboundRouting);
          if (parsed.outboundRouting) setOutboundRouting(parsed.outboundRouting);
          
          if (parsed.byoSipServer) setByoSipServer(parsed.byoSipServer);
          if (parsed.byoSipUsername) setByoSipUsername(parsed.byoSipUsername);
          if (parsed.byoSipPassword) setByoSipPassword(parsed.byoSipPassword);
          if (parsed.byoPhoneNumber) setByoPhoneNum(parsed.byoPhoneNumber);
        }
      } catch (err) {
        console.error('Failed to load credentials from backend', err);
      }
    };
    fetchSettings();

      // 2. Load voice_company_profile partitioned by tenantId
      const profileKey = `voice_profile_${tenantId}`;
      const profileStored = localStorage.getItem(profileKey);
      if (profileStored) {
        const parsed = JSON.parse(profileStored);
        setCompanyName(parsed.companyName || '');
        setCompanyServices(parsed.companyServices || '');
        setCompanyPricing(parsed.companyPricing || '');
        setCompanyHours(parsed.companyHours || '');
        setCompanyFAQs(parsed.companyFAQs || '');
      } else {
        // Initialize with default template depending on tenant
        if (tenantId === 't-1') {
          setCompanyName('Smile Dental Clinic');
          setCompanyServices('Teeth cleaning, cavity fillings, teeth whitening, root canals, and emergency orthodontic consultations.');
          setCompanyPricing('Basic checkups: $80. Teeth cleaning: $120. Whitening packages: $450. Fillings starting at $180.');
          setCompanyHours('Monday to Friday: 9:00 AM - 6:00 PM. Saturdays: 9:00 AM - 2:00 PM. Closed on Sundays.');
          setCompanyFAQs('We accept blue cross, delta dental, and principal insurance. Free parking is available behind our building.');
        } else if (tenantId === 't-2') {
          setCompanyName('Apex Heights Realty');
          setCompanyServices('Private penthouse showing tours, residential purchasing advice, real estate market valuations, and luxury home listings.');
          setCompanyPricing('Luxury suites start at $850,000. Rent-to-own properties start at $4,500/month. Valuations are free.');
          setCompanyHours('Daily showings from 8:00 AM to 8:00 PM. Please schedule weekend viewings 48 hours in advance.');
          setCompanyFAQs('Minimum 15% down payment required. Every unit includes 2 designated basement spots and sky lounge access.');
        } else {
          setCompanyName('ByteTech IT Solutions');
          setCompanyServices('Custom software development, cloud migration, automated workflows, CRM setups, and helpdesk support.');
          setCompanyPricing('Hourly consultation rate is $150. Fixed-scope projects require 30% upfront. SLA retainer begins at $299/mo.');
          setCompanyHours('Helpdesk hours: Monday to Friday, 8:00 AM to 7:00 PM. 24/7 critical server paging available.');
          setCompanyFAQs('Standard ticket response time is under 1 hour. All customized integrations include 3 months bug-free warranty.');
        }
      }

      // 3. Load call history
      const historyStored = localStorage.getItem(`voice_history_${tenantId}`);
      if (historyStored) {
        setSavedCalls(JSON.parse(historyStored));
      } else {
        // Pre-populate some history for realism
        const seedHistory: SavedCall[] = [
          {
            id: 'call-seed-1',
            direction: 'outbound',
            contactName: 'Alice Smith',
            phone: '+1 (555) 982-1200',
            goal: 'Confirm Teeth Cleaning',
            timestamp: new Date(Date.now() - 3600000).toLocaleString(),
            status: 'completed',
            transcript: [
              { sender: 'agent', text: `Hello Alice, I am Sarah calling from ${tenantName}. I am calling to confirm your teeth cleaning appointment. Does that still work?` },
              { sender: 'user', text: `Yes, that works! Go ahead and book it for me.` },
              { sender: 'agent', text: `Awesome! I have scheduled that appointment and synced it with the Calendar Scheduler. Thank you!` }
            ]
          }
        ];
        setSavedCalls(seedHistory);
        localStorage.setItem(`voice_history_${tenantId}`, JSON.stringify(seedHistory));
      }
  }, [tenantId, apiFetch]);

  const handleSaveVoiceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        twilioAccountSid: twilioSid,
        twilioAuthToken: twilioToken,
        twilioPhoneNumber: twilioNum,
        inboundRouting,
        outboundRouting,
        byoSipServer,
        byoSipUsername,
        byoSipPassword,
        byoPhoneNumber: byoPhoneNum
      };

      const res = await apiFetch(`/api/tenants/${tenantId}/integrations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }

      // Save Voice Profile
      const profileKey = `voice_profile_${tenantId}`;
      const profileObj = {
        companyName,
        companyServices,
        companyPricing,
        companyHours,
        companyFAQs
      };
      localStorage.setItem(profileKey, JSON.stringify(profileObj));
      localStorage.setItem(`voice_require_leadcapture_${tenantId}`, String(voiceRequireLeadCapture));
    } catch (e) {
      console.error('Failed to save settings to backend:', e);
    }
  };




  // Outbound Campaigns Tasks List
  const [outboundTasks, setOutboundTasks] = useState<OutboundTask[]>(() => {
    if (tenantId === 't-1') {
      return [
        { id: 'ot-1', name: 'John Doe', phone: '+1 (555) 019-2834', goal: 'Follow up on Dental Checkup', status: 'scheduled', crmSynced: true },
        { id: 'ot-2', name: 'Alice Smith', phone: '+1 (555) 982-1200', goal: 'Confirm Teeth Cleaning', status: 'completed', feedback: 'Confirmed Tuesday 10AM via voice.', crmSynced: true }
      ];
    } else if (tenantId === 't-2') {
      return [
        { id: 'ot-3', name: 'Sarah Jenkins', phone: '+1 (555) 489-1122', goal: 'Confirm Penthouse Tour', status: 'scheduled', crmSynced: true },
        { id: 'ot-4', name: 'Bob Johnson', phone: '+1 (555) 304-4500', goal: 'Reschedule viewing consultation', status: 'pending_callback', callbackTime: 'Scheduled: Call back in 2 days', feedback: 'Busy - requested call back on Monday.', crmSynced: true }
      ];
    }
    return [
      { id: 'ot-5', name: 'Michael Chen', phone: '+1 (555) 762-9900', goal: 'API Setup Consultation', status: 'scheduled', crmSynced: true }
    ];
  });

  // Outbound task creator form
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPhone, setNewTaskPhone] = useState('');
  const [newTaskGoal, setNewTaskGoal] = useState('Collect Callback Feedback');

  const handleCreateOutboundTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !newTaskPhone.trim()) return;

    const newTask: OutboundTask = {
      id: `ot-${Date.now()}`,
      name: newTaskName,
      phone: newTaskPhone,
      goal: newTaskGoal,
      status: 'scheduled',
      crmSynced: true
    };

    setOutboundTasks(prev => [...prev, newTask]);
    setNewTaskName('');
    setNewTaskPhone('');
  };

  // Inbound Call Simulation State
  const [inboundCallActive, setInboundCallActive] = useState(false);
  const [inboundCallStatus, setInboundCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
  const [inboundSpeechText, setInboundSpeechText] = useState('');
  
  interface CallTurn {
    sender: 'user' | 'agent';
    text: string;
    actionPerformed?: string;
  }
  const [inboundLogs, setInboundLogs] = useState<CallTurn[]>([]);
  const [isInboundProcessing, setIsInboundProcessing] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  // Inbound Trigger
  const triggerInboundCall = () => {
    setInboundCallStatus('ringing');
    setInboundCallActive(true);
    setInboundLogs([]);
    setLeadCaptureStep(voiceRequireLeadCapture ? 1 : 0);
    setCapturedName('');
    setCapturedEmail('');
    setCapturedPhone('');
  };

  const acceptInboundCall = () => {
    setInboundCallStatus('connected');
    if (voiceRequireLeadCapture) {
      let greeting = `Hello! Thank you for calling ${tenantName}. I am ${selectedAgent?.name || 'Sarah'}, your digital assistant. Before we proceed, could you please tell me your first and last name?`;
      setInboundLogs([{ sender: 'agent', text: greeting }]);
      setLeadCaptureStep(1);
    } else {
      let greeting = `Hello! Thank you for calling ${tenantName}. I am ${selectedAgent?.name || 'Sarah'}, your digital assistant. How can I help you today?`;
      setInboundLogs([{ sender: 'agent', text: greeting }]);
      setLeadCaptureStep(0);
    }
  };

  const handleInboundSpeak = () => {
    if (!inboundSpeechText.trim() || isInboundProcessing) return;

    const userMsg = inboundSpeechText;
    setInboundLogs(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInboundSpeechText('');
    setIsInboundProcessing(true);

    setTimeout(() => {
      let reply = '';
      let actionPerformed = '';

      if (leadCaptureStep === 1) {
        setCapturedName(userMsg);
        setLeadCaptureStep(2);
        reply = `Thank you, ${userMsg}. Could you please tell me your email address?`;
      } else if (leadCaptureStep === 2) {
        setCapturedEmail(userMsg);
        setLeadCaptureStep(3);
        reply = `Got it. And finally, what is your phone number?`;
      } else if (leadCaptureStep === 3) {
        setCapturedPhone(userMsg);
        setLeadCaptureStep(0);
        actionPerformed = `CRM Sync: Lead Captured (Name: ${capturedName || 'Inbound Caller'}, Email: ${capturedEmail}, Phone: ${userMsg})`;
        reply = `Perfect, thank you! I have saved your contact details. Now, how can I help you today?`;
      } else {
        const textLower = userMsg.toLowerCase();

        // Keywords match dynamically against user-configured Company Profile
        if (textLower.includes('cost') || textLower.includes('price') || textLower.includes('pricing') || textLower.includes('how much') || textLower.includes('rate') || textLower.includes('package')) {
          reply = `Here is our pricing information: ${companyPricing || 'Please contact our office for details.'} Would you like to schedule an appointment/tour?`;
        } else if (textLower.includes('hour') || textLower.includes('open') || textLower.includes('time') || textLower.includes('when') || textLower.includes('days') || textLower.includes('schedule')) {
          reply = `Our working hours are: ${companyHours || 'Please consult our website.'}`;
        } else if (textLower.includes('service') || textLower.includes('product') || textLower.includes('what do you do') || textLower.includes('offer') || textLower.includes('help with')) {
          reply = `We provide: ${companyServices || 'A variety of customized packages.'}`;
        } else if (textLower.includes('book') || textLower.includes('appointment') || textLower.includes('schedule') || textLower.includes('reserve') || textLower.includes('tour') || textLower.includes('viewing')) {
          actionPerformed = `Tool Trigger: Calendar Scheduler - Booking appointment for ${companyName || tenantName}`;
          
          const mockApp: Appointment = {
            id: `app-voice-ib-${Date.now()}`,
            contactId: 'c-101',
            agentId: selectedAgentId,
            dateTime: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T14:30:00',
            duration: 30,
            location: `${companyName || tenantName} Office`,
            type: 'Inbound Voice Consultation',
            status: 'scheduled'
          };
          onAddAppointment(mockApp);
          reply = `I have scheduled your appointment at ${companyName || tenantName} for tomorrow at 2:30 PM. I\'ve synced this slot to the Calendar Scheduler. Is there anything else I can help with?`;
        } else if (textLower.includes('faq') || textLower.includes('question') || textLower.includes('insurance') || textLower.includes('parking') || textLower.includes('policy')) {
          reply = `Regarding your inquiry: ${companyFAQs || 'Please speak with one of our coordinators.'}`;
        } else {
          reply = `I am the virtual assistant for ${companyName || tenantName}. I can answer questions about our services, pricing, work hours, or help you book an appointment. What would you like to know?`;
        }
      }

      setInboundLogs(prev => [...prev, { sender: 'agent', text: reply, actionPerformed }]);
      setIsInboundProcessing(false);
    }, 1500);
  };

  const endInboundCall = () => {
    setInboundCallStatus('ended');
    
    // Sync call transcript to Unified Inbox and local call history
    if (inboundLogs.length > 0) {
      const activeNumber = inboundRouting === 'twilio' ? (twilioNum || '+1 (555) 732-1922') : (byoPhoneNum || '+1 (555) 304-4500');
      
      const newCall: SavedCall = {
        id: `call-ib-${Date.now()}`,
        direction: 'inbound',
        contactName: capturedName || (tenantId === 't-1' ? 'Inbound Patient' : 'Inbound Buyer'),
        phone: capturedPhone || activeNumber,
        goal: tenantId === 't-1' ? 'Dental Operations Inquiry' : 'Penthouse Showing Info',
        timestamp: new Date().toLocaleString(),
        status: 'completed',
        transcript: [...inboundLogs]
      };

      setSavedCalls(prev => {
        const updated = [newCall, ...prev];
        localStorage.setItem(`voice_history_${tenantId}`, JSON.stringify(updated));
        return updated;
      });

      if (onAddVoiceConversation) {
        const messages: ChatMessage[] = inboundLogs.map((log, idx) => ({
          id: `m-voice-ib-${idx}-${Date.now()}`,
          sender: log.sender === 'user' ? 'customer' : 'ai',
          text: log.text,
          timestamp: new Date().toISOString()
        }));
        
        const bookedTurn = inboundLogs.find(l => l.actionPerformed);
        const callFeedback = bookedTurn 
          ? `Inbound customer completed action: ${bookedTurn.actionPerformed}` 
          : `Inbound Call Inquiry complete.`;
        onAddVoiceConversation(newCall.contactName, newCall.phone, newCall.goal, messages, callFeedback, capturedEmail);
      }
    }

    setTimeout(() => {
      setInboundCallStatus('idle');
      setInboundCallActive(false);
    }, 1500);
  };


  // Outbound Campaigns Call Simulator State
  const [activeOutboundTaskId, setActiveOutboundTaskId] = useState<string | null>(null);
  const [outboundCallActive, setOutboundCallActive] = useState(false);
  const [outboundCallStatus, setOutboundCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [outboundLogs, setOutboundLogs] = useState<CallTurn[]>([]);
  const [isOutboundProcessing, setIsOutboundProcessing] = useState(false);

  const activeOutboundTask = outboundTasks.find(t => t.id === activeOutboundTaskId);

  const startOutboundCall = (taskId: string) => {
    setActiveOutboundTaskId(taskId);
    setOutboundCallStatus('calling');
    setOutboundCallActive(true);
    setOutboundLogs([]);

    const task = outboundTasks.find(t => t.id === taskId);

    setTimeout(() => {
      setOutboundCallStatus('connected');
      let scriptIntro = '';
      if (tenantId === 't-1') {
        scriptIntro = `Hello, is this ${task?.name}? I am ${selectedAgent?.name || 'Sarah'} calling from ${companyName || tenantName}. I'm following up regarding your outbound goal: ${task?.goal}. Would you like to schedule that session now?`;
      } else {
        scriptIntro = `Hello ${task?.name}, I am ${selectedAgent?.name || 'Marcus'} calling from ${companyName || tenantName}. I am following up on your property inquiries for: ${task?.goal}. Are you available for a brief call, or would you like to schedule a tour?`;
      }
      setOutboundLogs([{ sender: 'agent', text: scriptIntro }]);
    }, 1800);
  };

  const handleOutboundSimulationAction = (choice: 'confirm' | 'callback_2d' | 'callback_3h' | 'not_interested') => {
    if (!activeOutboundTaskId || isOutboundProcessing) return;

    let customerPhrase = '';
    let agentReply = '';
    let statusUpdate: OutboundTask['status'] = 'scheduled';
    let feedback = '';
    let callbackTime = '';
    let crmUpdateLabel = '';

    if (choice === 'confirm') {
      customerPhrase = "Yes, that works! Go ahead and book it for me.";
      agentReply = "Awesome! I have scheduled that appointment and synced it with the Calendar Scheduler. You will receive a confirmation message shortly. Thank you!";
      statusUpdate = 'completed';
      feedback = "Confirmed session via AI outbound call.";
      crmUpdateLabel = "CRM Updated: Deal marked as WON / Appointment Booked.";
      
      // Book appointment
      const mockApp: Appointment = {
        id: `app-voice-ob-${Date.now()}`,
        contactId: 'c-101',
        agentId: selectedAgentId,
        dateTime: new Date(Date.now() + 172800000).toISOString().split('T')[0] + 'T10:00:00',
        duration: 30,
        location: `${companyName || tenantName} Suite A`,
        type: 'Outbound Campaign Booking (Voice)',
        status: 'scheduled'
      };
      onAddAppointment(mockApp);

    } else if (choice === 'callback_2d') {
      customerPhrase = "I am very busy right now, please call me back after 2 days.";
      agentReply = "I understand. I have rescheduled this follow-up call task in our calendar for exactly 2 days from now. Talk to you then!";
      statusUpdate = 'pending_callback';
      callbackTime = 'Rescheduled: Call back in 2 days';
      feedback = "Customer requested callback in 2 days.";
      crmUpdateLabel = "CRM Updated: Deal stage postponed; callback scheduled in 2 days.";

    } else if (choice === 'callback_3h') {
      customerPhrase = "I'm currently driving. Can you call me back in about 3 hours?";
      agentReply = "No problem! I will adjust our dialer schedule and queue an automated callback call for you in 3 hours. Safe driving!";
      statusUpdate = 'pending_callback';
      callbackTime = 'Rescheduled: Call back in 3 hours';
      feedback = "Requested callback in 3 hours.";
      crmUpdateLabel = "CRM Updated: Outbound queue callback scheduled for 3 hours later.";

    } else if (choice === 'not_interested') {
      customerPhrase = "I am not interested anymore, please stop calling this number.";
      agentReply = "My apologies. I have updated our CRM records and marked this deal. We will remove your contact from the dialing queue. Goodbye.";
      statusUpdate = 'failed';
      feedback = "Customer requested to stop calls / not interested.";
      crmUpdateLabel = "CRM Updated: Deal marked as LOST. AI Drop-off Reason Diagnostic triggered.";
    }

    setOutboundLogs(prev => [...prev, { sender: 'user', text: customerPhrase }]);
    setIsOutboundProcessing(true);

    setTimeout(() => {
      setOutboundLogs(prev => [...prev, { 
        sender: 'agent', 
        text: agentReply,
        actionPerformed: crmUpdateLabel
      }]);
      setIsOutboundProcessing(false);

      // Update state arrays
      setOutboundTasks(prev => prev.map(t => {
        if (t.id === activeOutboundTaskId) {
          return {
            ...t,
            status: statusUpdate,
            feedback,
            callbackTime,
            crmSynced: true
          };
        }
        return t;
      }));
    }, 1500);
  };

  const endOutboundCall = () => {
    setOutboundCallStatus('ended');

    // Sync call transcript to Unified Inbox and local call history
    if (outboundLogs.length > 0 && activeOutboundTask) {
      const activeNumber = outboundRouting === 'twilio' ? (twilioNum || activeOutboundTask.phone) : (byoPhoneNum || activeOutboundTask.phone);

      const newCall: SavedCall = {
        id: `call-ob-${Date.now()}`,
        direction: 'outbound',
        contactName: activeOutboundTask.name,
        phone: activeNumber,
        goal: activeOutboundTask.goal,
        timestamp: new Date().toLocaleString(),
        status: activeOutboundTask.status === 'failed' ? 'failed' : activeOutboundTask.status === 'pending_callback' ? 'pending_callback' : 'completed',
        transcript: [...outboundLogs]
      };

      setSavedCalls(prev => {
        const updated = [newCall, ...prev];
        localStorage.setItem(`voice_history_${tenantId}`, JSON.stringify(updated));
        return updated;
      });

      if (onAddVoiceConversation) {
        const messages: ChatMessage[] = outboundLogs.map((log, idx) => ({
          id: `m-voice-ob-${idx}-${Date.now()}`,
          sender: log.sender === 'user' ? 'customer' : 'ai',
          text: log.text,
          timestamp: new Date().toISOString()
        }));
        const currentTask = outboundTasks.find(t => t.id === activeOutboundTask.id);
        const taskFeedback = currentTask?.feedback || 'Outbound dial complete.';
        onAddVoiceConversation(activeOutboundTask.name, activeNumber, activeOutboundTask.goal, messages, taskFeedback);
      }
    }

    setTimeout(() => {
      setOutboundCallStatus('idle');
      setOutboundCallActive(false);
      setActiveOutboundTaskId(null);
    }, 1500);
  };


  const activeInboundNumber = inboundRouting === 'twilio' ? (twilioNum || '') : (byoPhoneNum || '');
  const activeOutboundNumber = outboundRouting === 'twilio' ? (twilioNum || '') : (byoPhoneNum || '');

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
      {/* View Header with Sub-tabs */}
      <div className="view-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 className="view-title">Voice AI Call Center</h2>
          <p className="view-subtitle">Powered by Voice AI SIP Gateways. Manage inbound inquiries, execute outbound dialer campaigns, and connect Twilio.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Sub-tab Switches */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <button
              onClick={() => setActiveSubTab('inbound')}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                backgroundColor: activeSubTab === 'inbound' ? 'var(--primary-color)' : 'transparent',
                color: activeSubTab === 'inbound' ? 'white' : 'var(--text-secondary)'
              }}
            >
              <PhoneCall size={14} /> Inbound Gateway
            </button>
            <button
              onClick={() => setActiveSubTab('outbound')}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                backgroundColor: activeSubTab === 'outbound' ? 'var(--primary-color)' : 'transparent',
                color: activeSubTab === 'outbound' ? 'white' : 'var(--text-secondary)'
              }}
            >
              <Calendar size={14} /> Outbound Campaigns
            </button>
            <button
              onClick={() => setActiveSubTab('settings')}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                backgroundColor: activeSubTab === 'settings' ? 'var(--primary-color)' : 'transparent',
                color: activeSubTab === 'settings' ? 'white' : 'var(--text-secondary)'
              }}
            >
              <Settings size={14} /> Settings & Numbers
            </button>
          </div>
          
          {/* Connection Indicators */}
          {activeInboundNumber ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success-color)', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#6ee7b7' }}>
              <span className="node-running" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)' }} />
              <span>Voice AI Gateway (Active) • {activeInboundNumber}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#fca5a5' }}>
              <span className="node-stopped" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <span>Voice AI Gateway (Inactive) • Unconfigured</span>
            </div>
          )}
        </div>
      </div>

      {activeSubTab === 'inbound' && (
        /* ================= INBOUND TAB ================= */
        <div>
          <div className="grid-cols-12" style={{ gap: '20px' }}>
            {/* Left panel: Config Dialer */}
            <div className="col-span-5 glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', minHeight: '440px' }}>
              <div style={{ width: '100%' }}>
                <label className="form-label">Inbound AI Attendant</label>
                <select
                  className="form-input"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  disabled={inboundCallActive}
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.department} Voice AI)</option>
                  ))}
                </select>
              </div>

              {/* Virtual Screen showing incoming/active calls */}
              <div style={{ 
                width: '260px', 
                height: '240px', 
                background: '#090d16', 
                border: '4px solid var(--border-glass)', 
                borderRadius: '24px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ width: '80px', height: '14px', background: 'var(--border-glass)', borderRadius: '0 0 8px 8px', position: 'absolute', top: 0 }} />

                {inboundCallStatus === 'ringing' && (
                  <div style={{ textAlign: 'center', marginTop: '10px', zIndex: 10, animation: 'pulse 1.5s infinite' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', border: '2px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                      <PhoneCall size={24} style={{ color: 'var(--primary-color)' }} />
                    </div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '8px' }}>INCOMING CALL</h4>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Dialing: {activeInboundNumber}
                    </p>
                  </div>
                )}

                {inboundCallStatus === 'connected' && (
                  <div style={{ textAlign: 'center', marginTop: '10px', zIndex: 10 }}>
                    <img 
                      src={selectedAgent?.avatar} 
                      alt="" 
                      style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid var(--success-color)', objectFit: 'cover', margin: '0 auto' }} 
                    />
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '8px' }}>{selectedAgent?.name}</h4>
                    <p style={{ fontSize: '0.65rem', color: 'var(--success-color)', marginTop: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      LIVE INBOUND ACTIVE
                    </p>
                  </div>
                )}

                {inboundCallStatus === 'idle' && (
                  <div style={{ textAlign: 'center', marginTop: '15px', color: 'var(--text-muted)' }}>
                    <Phone size={36} style={{ marginBottom: '6px', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.75rem', margin: 0 }}>No Active Connections</p>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Gateway Route: {activeInboundNumber}</span>
                  </div>
                )}

                {inboundCallStatus === 'ended' && (
                  <div style={{ textAlign: 'center', marginTop: '15px', color: 'var(--danger-color)' }}>
                    <PhoneOff size={36} style={{ marginBottom: '6px' }} />
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0 }}>CALL HUNG UP</h4>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', margin: '2px 0' }}>Logs synced to Communication Hub</p>
                  </div>
                )}

                {/* Call Controls */}
                <div style={{ zIndex: 10, display: 'flex', gap: '10px' }}>
                  {inboundCallStatus === 'idle' && (
                    <button onClick={triggerInboundCall} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.7rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <PhoneCall size={12} /> Simulate Call In
                    </button>
                  )}
                  {inboundCallStatus === 'ringing' && (
                    <>
                      <button onClick={acceptInboundCall} className="btn btn-success" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>
                        <Play size={16} />
                      </button>
                      <button onClick={() => setInboundCallStatus('idle')} className="btn btn-danger" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>
                        <PhoneOff size={16} />
                      </button>
                    </>
                  )}
                  {inboundCallStatus === 'connected' && (
                    <button onClick={endInboundCall} className="btn btn-danger" style={{ borderRadius: '50%', width: '44px', height: '44px', padding: 0 }}>
                      <PhoneOff size={18} />
                    </button>
                  )}
                </div>

                {/* Background frequency bars during call */}
                {inboundCallStatus === 'connected' && (
                  <div style={{ display: 'flex', gap: '3px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="voice-wave-bar"></div>
                    <div className="voice-wave-bar"></div>
                    <div className="voice-wave-bar"></div>
                    <div className="voice-wave-bar"></div>
                    <div className="voice-wave-bar"></div>
                  </div>
                )}

                <div style={{ position: 'absolute', bottom: -50, width: '100%', height: '100px', background: 'var(--primary-glow)', filter: 'blur(30px)', zIndex: 1 }} />
              </div>
            </div>

            {/* Right panel: Dialogue transcription */}
            <div className="col-span-7 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '440px', background: '#0c0f1d' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>Inbound Transcript Stream</h3>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '14px', border: '1px solid var(--border-glass)' }}>
                {inboundLogs.map((log, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {log.actionPerformed && (
                      <div style={{ display: 'flex', gap: '6px', padding: '6px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '4px', fontSize: '0.7rem', color: '#6ee7b7', fontFamily: 'monospace' }}>
                        <Shield size={12} style={{ marginTop: '2px' }} />
                        <span>{log.actionPerformed}</span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: log.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '80%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                        background: log.sender === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.03)',
                        color: 'white',
                        border: log.sender === 'user' ? 'none' : '1px solid var(--border-glass)',
                        borderBottomLeftRadius: log.sender === 'user' ? '12px' : '2px',
                        borderBottomRightRadius: log.sender === 'user' ? '2px' : '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          <Volume2 size={10} />
                          <span>{log.sender === 'user' ? 'Customer (Inbound speech)' : `${selectedAgent.name} (Attendant)`}</span>
                        </div>
                        {log.text}
                      </div>
                    </div>
                  </div>
                ))}

                {isInboundProcessing && (
                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', fontFamily: 'monospace' }}>
                    <span className="node-running" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)', display: 'inline-block' }}></span>
                    <span>AI processing customer speech...</span>
                  </div>
                )}

                {inboundLogs.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Click "Simulate Call In" on the phone console, then answer the call to start talking to the AI.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={inboundCallStatus === 'connected' ? "Type customer inquiry words (e.g. 'What are your hours?' or 'I want to book')..." : "Inbound call offline"} 
                  value={inboundSpeechText}
                  onChange={(e) => setInboundSpeechText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInboundSpeak()}
                  disabled={inboundCallStatus !== 'connected' || isInboundProcessing}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={handleInboundSpeak}
                  disabled={inboundCallStatus !== 'connected' || isInboundProcessing}
                  style={{ padding: '0 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Mic size={14} /> Speak
                </button>
              </div>
            </div>
          </div>

          {/* Local Call History List */}
          <div className="glass-panel" style={{ marginTop: '20px', padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} style={{ color: 'var(--primary-color)' }} /> Recent Phone Call Logs & Transcripts
            </h3>
            {savedCalls.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No recent call records stored.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Direction</th>
                      <th>Contact</th>
                      <th>Phone Number</th>
                      <th>Goal</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedCalls.map((call) => {
                      const isExpanded = expandedCallId === call.id;
                      return (
                        <React.Fragment key={call.id}>
                          <tr>
                            <td>{call.timestamp}</td>
                            <td>
                              <span className={`badge ${call.direction === 'inbound' ? 'badge-primary' : 'badge-secondary'}`} style={{ display: 'inline-block', padding: '2px 6px', fontSize: '0.65rem' }}>
                                {call.direction === 'inbound' ? '📥 Inbound' : '📤 Outbound'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 'bold' }}>{call.contactName}</td>
                            <td>{call.phone}</td>
                            <td>{call.goal}</td>
                            <td>
                              {call.status === 'completed' && <span className="badge badge-success">Completed</span>}
                              {call.status === 'pending_callback' && <span className="badge badge-warning">Rescheduled</span>}
                              {call.status === 'failed' && <span className="badge badge-danger">Not Interested</span>}
                            </td>
                            <td>
                              <button 
                                onClick={() => setExpandedCallId(isExpanded ? null : call.id)} 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                              >
                                {isExpanded ? 'Collapse' : '🔎 View Transcript'}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '12px', border: '1px solid var(--border-glass)', borderRadius: '6px', background: 'rgba(99,102,241,0.02)' }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '4px', marginBottom: '4px' }}>
                                    Call Transcript: {call.contactName} ({call.phone})
                                  </div>
                                  {call.transcript && call.transcript.length > 0 ? (
                                    call.transcript.map((log, idx) => (
                                      <div key={idx} style={{ fontSize: '0.75rem', display: 'flex', gap: '6px', margin: '2px 0' }}>
                                        <strong style={{ color: log.sender === 'agent' ? 'var(--primary-color)' : 'var(--accent-color)' }}>
                                          {log.sender === 'agent' ? 'AI Attendant:' : 'Customer:'}
                                        </strong>
                                        <span style={{ color: 'var(--text-primary)' }}>{log.text}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No speech transcript recorded.</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'outbound' && (
        /* ================= OUTBOUND CAMPAIGNS TAB ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Dashboard KPIs */}
          <div className="grid-cols-12" style={{ gap: '12px' }}>
            <div className="col-span-3 glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                🚀
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>OUTBOUND ACTIVE ID</span>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '2px 0' }}>
                  {activeOutboundNumber}
                </h4>
              </div>
            </div>

            <div className="col-span-3 glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                ⏳
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>PENDING CALLBACKS</span>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '2px 0' }}>
                  {outboundTasks.filter(t => t.status === 'pending_callback').length} Postponed
                </h4>
              </div>
            </div>

            <div className="col-span-3 glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                ✓
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>COMPLETED DIALS</span>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '2px 0' }}>
                  {outboundTasks.filter(t => t.status === 'completed').length} Successful
                </h4>
              </div>
            </div>

            <div className="col-span-3 glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                📉
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>RECOVERY DIAL RATE</span>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '2px 0' }}>68.4% success</h4>
              </div>
            </div>
          </div>

          <div className="grid-cols-12" style={{ gap: '20px' }}>
            {/* Outbound Tasks List */}
            <div className="col-span-7 glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Outbound Callback Queue</h3>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '320px' }}>
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Outbound Goal</th>
                      <th>Status</th>
                      <th>Feedback log</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outboundTasks.map(t => (
                      <tr key={t.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.phone}</div>
                          </div>
                        </td>
                        <td><span style={{ fontSize: '0.75rem' }}>{t.goal}</span></td>
                        <td>
                          {t.status === 'scheduled' && <span className="badge badge-primary">Scheduled</span>}
                          {t.status === 'pending_callback' && (
                            <span className="badge badge-warning" style={{ display: 'flex', flexDirection: 'column', fontSize: '0.6rem', padding: '4px' }}>
                              <span>Pending Callback</span>
                              <span style={{ fontSize: '0.55rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.7)' }}>{t.callbackTime}</span>
                            </span>
                          )}
                          {t.status === 'completed' && <span className="badge badge-success">Completed</span>}
                          {t.status === 'failed' && <span className="badge badge-danger">Not Interested</span>}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            {t.feedback || 'Waiting for call contact...'}
                          </span>
                        </td>
                        <td>
                          {(t.status === 'scheduled' || t.status === 'pending_callback') ? (
                            <button
                              onClick={() => startOutboundCall(t.id)}
                              className="btn btn-primary"
                              disabled={outboundCallActive}
                              style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                            >
                              📞 Dial Out
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Logged</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Task creation form inline */}
              <form onSubmit={handleCreateOutboundTask} style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: 'auto' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contact Name" 
                  value={newTaskName} 
                  onChange={(e) => setNewTaskName(e.target.value)} 
                  style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1 }}
                  required
                />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Phone (e.g. +1...)" 
                  value={newTaskPhone} 
                  onChange={(e) => setNewTaskPhone(e.target.value)} 
                  style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1 }}
                  required
                />
                <select
                  className="form-input"
                  value={newTaskGoal}
                  onChange={(e) => setNewTaskGoal(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1.2, height: '34px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'white' }}
                >
                  <option value="Confirm Dental Cleaning">Confirm Dental Cleaning</option>
                  <option value="Confirm Penthouse Tour">Confirm Penthouse Tour</option>
                  <option value="Collect Callback Feedback">Collect Callback Feedback</option>
                  <option value="Verify Billing Account Details">Verify Account Details</option>
                </select>
                <button type="submit" className="btn btn-success" style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={14} /> Add Queue
                </button>
              </form>
            </div>

            {/* Outbound Simulator Console Panel */}
            <div className="col-span-5 glass-panel" style={{ padding: '20px', background: '#0a0d16', display: 'flex', flexDirection: 'column', height: '420px' }}>
              <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Volume2 size={16} style={{ color: 'var(--accent-color)' }} /> Outbound Call Simulator
                </h4>
              </div>

              {outboundCallActive && activeOutboundTask ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Speech Log */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '6px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {outboundLogs.map((log, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {log.actionPerformed && (
                          <div style={{ display: 'flex', gap: '4px', padding: '4px 8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '4px', fontSize: '0.65rem', color: '#6ee7b7', fontFamily: 'monospace', marginBottom: '4px' }}>
                            <CheckCircle2 size={10} style={{ marginTop: '2px' }} />
                            <span>{log.actionPerformed}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: log.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            padding: '8px 12px',
                            background: log.sender === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.02)',
                            border: log.sender === 'user' ? 'none' : '1px solid var(--border-glass)',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            maxWidth: '90%',
                            color: 'white'
                          }}>
                            {log.text}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isOutboundProcessing && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        Agent is speaking / updating CRM...
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  {outboundCallStatus === 'connected' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>CHOOSE CUSTOMER RESPONSE TO SIMULATE:</div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <button 
                          onClick={() => handleOutboundSimulationAction('confirm')}
                          disabled={isOutboundProcessing}
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.7rem', padding: '6px', justifyContent: 'center', borderColor: 'var(--success-color)', color: 'var(--success-color)' }}
                        >
                          "Yes, book/confirm now"
                        </button>
                        <button 
                          onClick={() => handleOutboundSimulationAction('callback_2d')}
                          disabled={isOutboundProcessing}
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.7rem', padding: '6px', justifyContent: 'center', borderColor: 'var(--warning-color)', color: 'var(--warning-color)' }}
                        >
                          "Call back in 2 days"
                        </button>
                        <button 
                          onClick={() => handleOutboundSimulationAction('callback_3h')}
                          disabled={isOutboundProcessing}
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.7rem', padding: '6px', justifyContent: 'center' }}
                        >
                          "Call back in 3 hours"
                        </button>
                        <button 
                          onClick={() => handleOutboundSimulationAction('not_interested')}
                          disabled={isOutboundProcessing}
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.7rem', padding: '6px', justifyContent: 'center', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}
                        >
                          "Not interested anymore"
                        </button>
                      </div>

                      <button onClick={endOutboundCall} className="btn btn-danger" style={{ width: '100%', fontSize: '0.75rem', padding: '8px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <PhoneOff size={12} /> Hang Up Call
                      </button>
                    </div>
                  )}

                  {outboundCallStatus === 'calling' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '8px' }}>
                      <PhoneCall size={32} className="node-running" style={{ color: 'var(--primary-color)' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dialing out to {activeOutboundTask.name}...</span>
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '20px' }}>
                  <Phone size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <span>Select a callback task in the queue and click **Dial Out** to begin outbound campaign validation.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'settings' && (
        /* ================= VOICE CONFIG & NUMBERS TAB ================= */
        <div className="grid-cols-12" style={{ gap: '20px' }}>
          {/* Left Column: Number Link & Routing */}
          <div className="col-span-6 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', margin: 0 }}>
              <PhoneCall size={18} /> Phone Routing & Credentials
            </h3>

            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              💡 <strong>Centralized vault:</strong> Phone carrier settings, Twilio credentials, BYO Carrier SIP credentials, payment keys (PhonePe), and AI engine keys can be managed centrally in the <strong>Integrations</strong> tab under Administration.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <input 
                type="checkbox" 
                id="voice-lead-capture"
                checked={voiceRequireLeadCapture} 
                onChange={(e) => setVoiceRequireLeadCapture(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="voice-lead-capture" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer', margin: 0 }}>
                Require Pre-Call Lead Capture Form Conversational Step
              </label>
            </div>

            <form onSubmit={handleSaveVoiceSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Routing selectors */}
              <div style={{ border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Gateway Number Association</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Inbound Calls Route:</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="radio" checked={inboundRouting === 'twilio'} onChange={() => setInboundRouting('twilio')} /> Twilio Number
                      </label>
                      <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="radio" checked={inboundRouting === 'byo'} onChange={() => setInboundRouting('byo')} /> Custom BYO Number
                      </label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Outbound Dialer Caller ID:</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="radio" checked={outboundRouting === 'twilio'} onChange={() => setOutboundRouting('twilio')} /> Twilio Number
                      </label>
                      <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="radio" checked={outboundRouting === 'byo'} onChange={() => setOutboundRouting('byo')} /> Custom BYO Number
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Twilio configurations */}
              <div style={{ border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📞 Twilio Trunking Configuration
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Twilio Account SID</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      value={twilioSid} 
                      onChange={(e) => setTwilioSid(e.target.value)} 
                      placeholder="ACxxxxxxxxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Twilio Auth Token</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      value={twilioToken} 
                      onChange={(e) => setTwilioToken(e.target.value)} 
                      placeholder="auth_token"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Twilio Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      value={twilioNum} 
                      onChange={(e) => setTwilioNum(e.target.value)} 
                      placeholder="+15551234567"
                    />
                  </div>
                </div>
              </div>

              {/* BYO Phone configurations */}
              <div style={{ border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🌐 Custom BYO SIP Server Configuration
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>SIP URI / Gateway Server</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      value={byoSipServer} 
                      onChange={(e) => setByoSipServer(e.target.value)} 
                      placeholder="sip.mycarrier.com"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>SIP Username</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        value={byoSipUsername} 
                        onChange={(e) => setByoSipUsername(e.target.value)} 
                        placeholder="sip_user"
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>SIP Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        value={byoSipPassword} 
                        onChange={(e) => setByoSipPassword(e.target.value)} 
                        placeholder="sip_password"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Custom Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      value={byoPhoneNum} 
                      onChange={(e) => setByoPhoneNum(e.target.value)} 
                      placeholder="+15559876543"
                    />
                  </div>
                </div>
              </div>

              {saveSuccess && (
                <div style={{ padding: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Voice & SIP settings saved successfully!
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Settings size={16} /> Save Settings Configuration
              </button>
            </form>
          </div>

          {/* Right Column: Company Voice Profile Config */}
          <div className="col-span-6 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', margin: 0 }}>
              <Shield size={18} /> Company Voice Knowledge Profile
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Define details about your company, products, pricing, working hours, and FAQs. The digital employee will dynamically access these values when speaking to inbound callers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Company/Product Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ fontSize: '0.8rem' }}
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  placeholder="e.g. Smile Dental Clinic"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Services & Core Offerings</label>
                <textarea 
                  className="form-input" 
                  style={{ fontSize: '0.75rem', minHeight: '60px', lineHeight: '1.4' }}
                  value={companyServices} 
                  onChange={(e) => setCompanyServices(e.target.value)} 
                  placeholder="Describe your services..."
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Pricing & Packages</label>
                <textarea 
                  className="form-input" 
                  style={{ fontSize: '0.75rem', minHeight: '60px', lineHeight: '1.4' }}
                  value={companyPricing} 
                  onChange={(e) => setCompanyPricing(e.target.value)} 
                  placeholder="Detail your pricing structures..."
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Working Hours & Calendar Openings</label>
                <textarea 
                  className="form-input" 
                  style={{ fontSize: '0.75rem', minHeight: '60px', lineHeight: '1.4' }}
                  value={companyHours} 
                  onChange={(e) => setCompanyHours(e.target.value)} 
                  placeholder="Specify working hours and timezone..."
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>General FAQs / Custom Knowledge</label>
                <textarea 
                  className="form-input" 
                  style={{ fontSize: '0.75rem', minHeight: '60px', lineHeight: '1.4' }}
                  value={companyFAQs} 
                  onChange={(e) => setCompanyFAQs(e.target.value)} 
                  placeholder="Insert payment policies, parking info, insurance details, etc..."
                  required
                />
              </div>
            </div>
          </div>
          
        </div>
      )}


    </div>
  );
};

