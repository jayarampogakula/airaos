import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AIBrainView } from './components/AIBrainView';
import { EmployeeBuilderView } from './components/EmployeeBuilderView';
import { CommunicationHubView } from './components/CommunicationHubView';
import { CRMPipelineView } from './components/CRMPipelineView';
import { SchedulerView } from './components/SchedulerView';
import { WorkflowView } from './components/WorkflowView';
import { VoiceAIView } from './components/VoiceAIView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { WidgetBuilderView } from './components/WidgetBuilderView';
import { WhiteLabelView } from './components/WhiteLabelView';
import { LandingPageView } from './components/LandingPageView';
import { SuperAdminView } from './components/SuperAdminView';
import { TeamAccessView } from './components/TeamAccessView';
import { IntegrationsView } from './components/IntegrationsView';
import { CrewAIView } from './components/CrewAIView';
import { BillingUpgradeView } from './components/BillingUpgradeView';
import { PhonePeSimulator } from './components/PhonePeSimulator';


import { 
  mockTenants, mockAgents, mockContacts, mockDeals, 
  mockConversations, mockAppointments, mockWorkflows, 
  mockKnowledgeSources, mockKbChunks, mockSystemMetrics, mockBillingLimits 
} from './mockData';
import { Tenant, Agent, Contact, Deal, Conversation, Appointment, Workflow, KnowledgeSource, KbChunk, SystemMetrics, ChatMessage } from './types';

function App() {
  // Global Roles / Selection State
  const [currentRole, setCurrentRole] = useState<'tenant' | 'superadmin'>(() => {
    return (localStorage.getItem('agentstack_currentRole') as 'tenant' | 'superadmin') || 'tenant';
  });
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    return localStorage.getItem('agentstack_selectedTenantId') || 't-1';
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('agentstack_activeTab') || 'dashboard';
  });
  const [viewMode, setViewMode] = useState<'marketing' | 'app'>(() => {
    return (localStorage.getItem('agentstack_viewMode') as 'marketing' | 'app') || 'marketing';
  });
  const [isImpersonating, setIsImpersonating] = useState<boolean>(() => {
    return localStorage.getItem('agentstack_isImpersonating') === 'true';
  });
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);


  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('agentstack_currentRole', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('agentstack_selectedTenantId', selectedTenantId);
  }, [selectedTenantId]);

  useEffect(() => {
    localStorage.setItem('agentstack_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('agentstack_viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('agentstack_isImpersonating', String(isImpersonating));
  }, [isImpersonating]);

  // Core Ledgers
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [sources, setSources] = useState<KnowledgeSource[]>(mockKnowledgeSources);
  const [chunks, setChunks] = useState<KbChunk[]>(mockKbChunks);

  const [websiteRefreshesCount, setWebsiteRefreshesCount] = useState<{ [tenantId: string]: number }>(() => {
    const stored = localStorage.getItem('agentstack_website_refreshes');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return { 't-1': 1, 't-2': 2, 't-3': 0 }; // default mock values
  });

  useEffect(() => {
    localStorage.setItem('agentstack_website_refreshes', JSON.stringify(websiteRefreshesCount));
  }, [websiteRefreshesCount]);

  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const [contactsRes, dealsRes, appRes, convRes, tenantsRes] = await Promise.all([
          fetch('/api/contacts'),
          fetch('/api/deals'),
          fetch('/api/appointments'),
          fetch('/api/conversations'),
          fetch('/api/tenants')
        ]);

        if (contactsRes.ok) {
          const data = await contactsRes.json();
          if (data && data.length > 0) setContacts(data);
        }
        if (dealsRes.ok) {
          const data = await dealsRes.json();
          if (data && data.length > 0) setDeals(data);
        }
        if (appRes.ok) {
          const data = await appRes.json();
          if (data && data.length > 0) setAppointments(data);
        }
        if (convRes.ok) {
          const data = await convRes.json();
          if (data && data.length > 0) setConversations(data);
        }
        if (tenantsRes.ok) {
          const data = await tenantsRes.json();
          if (data && data.length > 0) setTenants(data);
        }
      } catch (err) {
        console.warn('Backend server not online. Running in simulation mode with local mock storage.', err);
      }
    };

    loadBackendData();
  }, []);

  const selectedTenant = tenants.find(t => t.id === selectedTenantId) || tenants[0];

  // Dynamic White Label Branding Application
  useEffect(() => {
    if (selectedTenant && currentRole === 'tenant') {
      document.documentElement.style.setProperty('--primary-color', selectedTenant.primaryColor);
      // Generate lighter/glow values from primary color
      document.documentElement.style.setProperty('--primary-glow', `${selectedTenant.primaryColor}22`);
      // Update body background using secondaryColor
      document.documentElement.style.setProperty('--bg-primary', selectedTenant.secondaryColor || '#0b0f19');
    } else {
      // Revert to defaults for Super Admin
      document.documentElement.style.setProperty('--primary-color', '#6366f1');
      document.documentElement.style.setProperty('--primary-glow', 'rgba(99, 102, 241, 0.15)');
      document.documentElement.style.setProperty('--bg-primary', '#0b0f19');
    }
  }, [selectedTenant, currentRole]);

  // URL Query & Hash Router on Mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const statusParam = params.get('status');
    const txParam = params.get('tx');
    const hash = window.location.hash;

    if (roleParam === 'superadmin' || roleParam === 'admin' || hash === '#admin') {
      setCurrentRole('superadmin');
      setActiveTab('tenants');
      setViewMode('app');
    } else if (hash.startsWith('#billing') || statusParam === 'success' || txParam) {
      setCurrentRole('tenant');
      setActiveTab('billing');
      setViewMode('app');

      if (statusParam === 'success') {
        alert(`Payment processed successfully!\nTransaction Reference ID: ${txParam || 'N/A'}.\nYour plan and credits have been updated.`);
        // Clean parameters from address bar
        const cleanUrl = window.location.origin + window.location.pathname + '#billing';
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      }
    }
  }, []);

  // Update URL Query parameters dynamically on currentRole changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (viewMode === 'app' && currentRole === 'superadmin') {
      params.set('role', 'superadmin');
    } else {
      params.delete('role');
    }
    const newQuery = params.toString();
    const newUrl = `${window.location.pathname}${newQuery ? '?' + newQuery : ''}${window.location.hash}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  }, [currentRole, viewMode]);

  // Adjust active tabs when switching between Roles
  useEffect(() => {
    const superadminTabs = ['tenants', 'plans', 'infrastructure', 'marketplace'];
    const tenantTabs = [
      'dashboard', 'brain', 'employees', 'inbox', 'crm', 
      'scheduler', 'workflow', 'voice', 'knowledge', 'widget', 'website', 'whitelabel', 'team', 'integrations', 'crew', 'billing'
    ];

    if (currentRole === 'superadmin') {
      if (!superadminTabs.includes(activeTab)) {
        setActiveTab('tenants');
      }
    } else {
      if (!tenantTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [currentRole, activeTab]);

  // Adjust global body overflow styles depending on viewMode (marketing needs scrolling)
  useEffect(() => {
    if (viewMode === 'marketing') {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    }
    return () => {
      // Revert to defaults on cleanup
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    };
  }, [viewMode]);

  // Filter components by Tenant
  // In a real multi-tenant app, items are partitioned by tenantId. 
  // We simulate this by showing/filtering records depending on active Tenant.
  const getFilteredAgents = () => {
    if (selectedTenantId === 't-1') return agents.filter(a => a.department === 'Reception' || a.department === 'Billing');
    if (selectedTenantId === 't-2') return agents.filter(a => a.department === 'Sales' || a.department === 'Reception');
    return agents.filter(a => a.department === 'Support' || a.department === 'Billing');
  };

  const getFilteredConversations = () => {
    const tenantAgents = getFilteredAgents().map(a => a.id);
    return conversations.filter(c => tenantAgents.includes(c.assignedAgentId || ''));
  };

  const getFilteredAppointments = () => {
    const tenantAgents = getFilteredAgents().map(a => a.id);
    return appointments.filter(app => tenantAgents.includes(app.agentId));
  };

  const getFilteredDeals = () => {
    // In our seed, John Doe is for Dental, Sarah Jenkins for Real Estate, Michael Chen for TechSupport
    if (selectedTenantId === 't-1') return deals.filter(d => d.contactId === 'c-101' || d.contactId === 'c-104');
    if (selectedTenantId === 't-2') return deals.filter(d => d.contactId === 'c-102');
    return deals.filter(d => d.contactId === 'c-103');
  };

  const getFilteredContacts = () => {
    const dealContactIds = getFilteredDeals().map(d => d.contactId);
    return contacts.filter(c => dealContactIds.includes(c.id) || c.id === 'c-101');
  };

  const getFilteredSources = () => {
    if (selectedTenantId === 't-1') return sources.filter(s => s.name.includes('Dental') || s.name.includes('FAQ'));
    if (selectedTenantId === 't-2') return sources.filter(s => s.name.includes('Apex') || s.name.includes('Catalog'));
    return sources.filter(s => s.name.includes('ByteTech') || s.name.includes('Refund'));
  };

  const getFilteredChunks = () => {
    const srcIds = getFilteredSources().map(s => s.id);
    return chunks.filter(c => srcIds.includes(c.sourceId));
  };

  // State Callbacks & Actions

  const handleAddMessage = (convId: string, text: string, sender: 'customer' | 'ai' | 'human', slots?: string[]) => {
    const newMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      sender,
      text,
      timestamp: new Date().toISOString(),
      slots
    };

    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        // Increment workflow runs if customer triggers chat
        if (sender === 'customer') {
          triggerWorkflowPulse('wf-1'); // Sync CRM workflow
        }
        
        return {
          ...c,
          messages: [...c.messages, newMessage],
          lastMessageText: text,
          lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unreadCount: sender === 'customer' ? (c.unreadCount || 0) + 1 : 0
        };
      }
      return c;
    }));
  };

  const handleUpdateConvStatus = (convId: string, status: Conversation['status']) => {
    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        if (status === 'human_escalated') {
          triggerWorkflowPulse('wf-3'); // Escalation workflow
        }
        return { ...c, status };
      }
      return c;
    }));
  };

  const handleAddContactNote = (contactId: string, note: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        return { ...c, notes: [...c.notes, note] };
      }
      return c;
    }));
  };

  const handleAddContactTag = (contactId: string, tag: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        return { ...c, tags: [...c.tags, tag] };
      }
      return c;
    }));
  };

  const handleUpdateDealStage = (dealId: string, stage: Deal['stage']) => {
    setDeals(prev => prev.map(d => {
      if (d.id === dealId) {
        return { ...d, stage };
      }
      return d;
    }));

    fetch(`/api/deals/${dealId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage })
    }).catch(err => console.warn('Could not sync deal stage to backend.', err));
  };

  const handleAddContact = async (newContactData: Omit<Contact, 'id' | 'createdAt' | 'tags' | 'notes'>) => {
    const newContact: Contact = {
      ...newContactData,
      id: `c-${Date.now()}`,
      createdAt: new Date().toISOString(),
      tags: ['Manual Inbound'],
      notes: []
    };

    setContacts(prev => [...prev, newContact]);

    // Create a corresponding deal
    const newDeal: Deal = {
      id: `d-${Date.now()}`,
      contactId: newContact.id,
      name: `${newContact.name} - Custom Inquire`,
      value: 500,
      stage: 'lead',
      createdAt: new Date().toISOString()
    };
    setDeals(prev => [...prev, newDeal]);

    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
      await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeal)
      });
    } catch (err) {
      console.warn('Could not sync contact/deal to backend.', err);
    }
  };

  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments(prev => {
      if (prev.some(a => a.id === newApp.id)) return prev;
      return [newApp, ...prev];
    });

    setContacts(prev => prev.map(c => {
      if (c.id === newApp.contactId) {
        const timeStr = new Date(newApp.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const note = `Calendar Scheduler Slot Booked: ${newApp.type} on ${new Date(newApp.dateTime).toLocaleDateString()} at ${timeStr}`;
        if (c.notes.includes(note)) return c;
        return {
          ...c,
          notes: [...c.notes, note]
        };
      }
      return c;
    }));

    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp)
    }).catch(err => console.warn('Could not sync appointment to backend.', err));

    triggerWorkflowPulse('wf-2');
  };

  const handleCancelAppointment = (appId: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === appId) {
        return { ...a, status: 'cancelled' };
      }
      return a;
    }));

    fetch(`/api/appointments/${appId}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Could not sync cancel to backend.', err));
  };

  const handleAddVoiceConversation = (contactName: string, phone: string, scriptGoal: string, transcript: ChatMessage[], feedback?: string, email?: string) => {
    // Find or create contact
    let contact = contacts.find(c => c.phone === phone || c.name.toLowerCase() === contactName.toLowerCase());
    let finalContact: Contact;
    
    if (!contact) {
      finalContact = {
        id: `c-voice-${Date.now()}`,
        name: contactName,
        email: email || `${contactName.toLowerCase().replace(/\s/g, '')}@example.com`,
        phone: phone,
        company: 'Individual',
        tags: ['Voice Lead'],
        notes: [
          `Created from Inbound Call: ${scriptGoal}`,
          feedback ? `Call Feedback: ${feedback}` : `Call outcome recorded.`
        ].filter(Boolean),
        createdAt: new Date().toISOString(),
        city: 'New York',
        assignedAgentId: getFilteredAgents()[0]?.id || 'a-1'
      };
      setContacts(prev => [...prev, finalContact]);
    } else {
      finalContact = contact;
      // Append call outcome to existing contact notes
      setContacts(prev => prev.map(c => {
        if (c.id === finalContact.id) {
          return {
            ...c,
            notes: [
              ...c.notes,
              feedback ? `Call Feedback: ${feedback}` : `Voice Call finished: ${scriptGoal}`
            ]
          };
        }
        return c;
      }));
    }

    const convId = `conv-voice-${Date.now()}`;
    const newConv: Conversation = {
      id: convId,
      contactId: finalContact.id,
      status: 'closed',
      channel: 'voice',
      messages: transcript,
      lastMessageText: transcript[transcript.length - 1]?.text || 'Voice call finished',
      lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      assignedAgentId: getFilteredAgents()[0]?.id
    };

    setConversations(prev => [newConv, ...prev]);

    // Also link a deal if one doesn't exist
    const hasDeal = deals.some(d => d.contactId === finalContact.id);
    if (!hasDeal) {
      const newDeal: Deal = {
        id: `d-voice-${Date.now()}`,
        contactId: finalContact.id,
        name: `${contactName} - Voice AI Inbound`,
        value: 150,
        stage: 'lead',
        createdAt: new Date().toISOString()
      };
      setDeals(prev => [...prev, newDeal]);
    }
  };

  const handleToggleWorkflow = (wfId: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id === wfId) {
        return { ...w, active: !w.active };
      }
      return w;
    }));
  };

  const handleIncrementRuns = (wfId: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id === wfId) {
        return {
          ...w,
          runsCount: w.runsCount + 1,
          successCount: w.successCount + 1,
          lastRun: 'Just now'
        };
      }
      return w;
    }));
  };

  const handleAddWorkflow = (newWf: Workflow) => {
    setWorkflows(prev => [...prev, newWf]);
  };

  const handleUpdateWorkflow = (updatedWf: Workflow) => {
    setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
  };

  const triggerWorkflowPulse = (wfId: string) => {
    // Silently increment workflow counter for simulation fidelity
    setWorkflows(prev => prev.map(w => {
      if (w.id === wfId && w.active) {
        return {
          ...w,
          runsCount: w.runsCount + 1,
          successCount: w.successCount + 1,
          lastRun: 'Just now'
        };
      }
      return w;
    }));
  };

  const handleAddSource = (newSource: KnowledgeSource, sourceChunks: KbChunk[], agentId?: string) => {
    setSources(prev => [...prev, newSource]);
    setChunks(prev => [...prev, ...sourceChunks]);
    if (agentId && agentId !== 'global') {
      setAgents(prev => prev.map(a => {
        if (a.id === agentId) {
          return {
            ...a,
            knowledgeSources: [...a.knowledgeSources, newSource.name]
          };
        }
        return a;
      }));
    }
  };

  const handleUpdateBranding = (tenantId: string, updates: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        return { ...t, ...updates };
      }
      return t;
    }));
  };

  const handleHireAgent = (newAgent: Agent) => {
    setAgents(prev => [newAgent, ...prev]);
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
  };

  // Super Admin: Toggle Client Account Status
  const handleToggleTenantStatus = (tenantId: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        return { ...t, status: t.status === 'active' ? 'suspended' : 'active' };
      }
      return t;
    }));
  };

  // Super Admin: Marketplace template installer
  const handleInstallTemplate = (tplName: string) => {
    const isMedical = tplName.includes('Clinic') || tplName.includes('Medical');
    const isSales = tplName.includes('Real Estate') || tplName.includes('Sales');
    const isAutomotive = tplName.includes('Automotive') || tplName.includes('Leo');
    const isSaaS = tplName.includes('SaaS') || tplName.includes('Clara');
    const isFitness = tplName.includes('Fitness') || tplName.includes('Derrick');
    const isEcom = tplName.includes('E-Commerce') || tplName.includes('Aria');

    let name = 'Support Agent (Template)';
    let avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    let voice = 'Echo (US Female, warm)';
    let department: Agent['department'] = 'Support';
    let prompt = `Imported Prompt instructions from ${tplName} marketplace catalog.`;
    let tools: string[] = ['Create CRM Lead'];

    if (isMedical) {
      name = 'Sarah (Template)';
      avatar = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150';
      voice = 'Echo (US Female, warm)';
      department = 'Reception';
      prompt = 'You are Sarah, the AI Office Receptionist and Lead Coordinator. Answer FAQs, explain clinical services, check availability, and book appointments using the Calendar Scheduler.';
      tools = ['Book Appointment', 'Check Availability'];
    } else if (isSales) {
      name = 'Marcus (Template)';
      avatar = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150';
      voice = 'Alloy (US Male, energetic)';
      department = 'Sales';
      prompt = 'You are Marcus, the AI Sales Executive. Qualify buyer budgets, detail square footage layouts, capture contact info, and push to CRM.';
      tools = ['Create CRM Lead'];
    } else if (isAutomotive) {
      name = 'Leo (Template)';
      avatar = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150';
      voice = 'Alloy (US Male, energetic)';
      department = 'Support';
      prompt = 'You are Leo, the AI Automotive Service Advisor. Check vehicle mileage, explain brake checkups, detail repair packages, and book garage service bays.';
      tools = ['Check Availability', 'Book Appointment'];
    } else if (isSaaS) {
      name = 'Clara (Template)';
      avatar = 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150';
      voice = 'Nova (UK Female, calm)';
      department = 'Support';
      prompt = 'You are Clara, the AI SaaS Onboarding Specialist. Help developers generate API keys, troubleshoot rate limits, and explain plan features.';
      tools = ['Search Docs Database', 'Create Support Ticket'];
    } else if (isFitness) {
      name = 'Derrick (Template)';
      avatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150';
      voice = 'Alloy (US Male, energetic)';
      department = 'Sales';
      prompt = 'You are Derrick, the AI Fitness Coordinator. Help prospects set up free trial gym passes, schedule trainer physical consults, and explain club packages.';
      tools = ['Book Appointment', 'Create CRM Lead'];
    } else if (isEcom) {
      name = 'Aria (Template)';
      avatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';
      voice = 'Echo (US Female, warm)';
      department = 'Sales';
      prompt = 'You are Aria, the AI E-Commerce Lead Qualifier. Assist shoppers with apparel style and size recommendations, qualify budgets, and push qualified deals to CRM.';
      tools = ['Create CRM Lead', 'Update CRM Contact'];
    }

    const newAgent: Agent = {
      id: `a-tpl-${Date.now()}`,
      name,
      avatar,
      voice,
      language: 'English',
      personality: `Preconfigured marketplace ${tplName} assistant.`,
      department,
      prompt,
      workingHours: { start: '09:00', end: '18:00' },
      status: 'online',
      tools,
      knowledgeSources: [],
      escalationRules: 'Escalate after two consecutive human requests.'
    };

    setAgents(prev => [newAgent, ...prev]);
  };

  const handleVisitTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setCurrentRole('tenant');
    setActiveTab('dashboard');
    setIsImpersonating(true);
  };

  const handleLoginSuccess = (role: 'tenant' | 'superadmin', tenantId?: string) => {
    setCurrentRole(role);
    if (role === 'superadmin') {
      setActiveTab('tenants');
    } else {
      setSelectedTenantId(tenantId || 't-1');
      setActiveTab('dashboard');
    }
    setViewMode('app');
  };

  const handleLogout = () => {
    setViewMode('marketing');
    setCurrentRole('tenant');
    setSelectedTenantId('t-1');
    setActiveTab('dashboard');
    setIsImpersonating(false);
  };

  const getBillingSettings = () => {
    const stored = localStorage.getItem('platform_billing_settings');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return {
      growthChats: 2000,
      growthVoice: 500,
      growthWebsites: 2,
      scaleChats: 5000,
      scaleVoice: 1000,
      scaleWebsites: 5,
      enterpriseChats: 10000,
      enterpriseVoice: 2500,
      enterpriseWebsites: 999,
    };
  };

  // Usage limits calculator
  const getUsageLimits = () => {
    const billing = getBillingSettings();
    const plan = selectedTenant?.plan || 'Growth';
    
    let chatsLimit = 2000;
    let voiceLimit = 500;
    let websitesLimit = 2;

    if (plan === 'Growth') {
      chatsLimit = billing.growthChats;
      voiceLimit = billing.growthVoice;
      websitesLimit = billing.growthWebsites;
    } else if (plan === 'Scale') {
      chatsLimit = billing.scaleChats;
      voiceLimit = billing.scaleVoice;
      websitesLimit = billing.scaleWebsites;
    } else {
      chatsLimit = billing.enterpriseChats;
      voiceLimit = billing.enterpriseVoice;
      websitesLimit = billing.enterpriseWebsites;
    }

    const editsUsed = websiteRefreshesCount[selectedTenantId] || 0;

    let conversationsUsed = 154;
    let voiceUsed = 42;
    if (selectedTenantId === 't-1') {
      conversationsUsed = 842;
      voiceUsed = 215;
    } else if (selectedTenantId === 't-2') {
      conversationsUsed = 1240;
      voiceUsed = 380;
    }

    return {
      conversationsUsed,
      conversationsLimit: chatsLimit,
      voiceUsed,
      voiceLimit: voiceLimit,
      websitesUsed: editsUsed,
      websitesLimit: websitesLimit
    };
  };

  if (viewMode === 'marketing') {
    return <LandingPageView onLoginSuccess={handleLoginSuccess} />;
  }

  if (window.location.hash.startsWith('#phonepe-checkout')) {
    return <PhonePeSimulator />;
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        currentRole={currentRole}
        selectedTenant={selectedTenant}
        tenants={tenants}
        onSelectTenant={setSelectedTenantId}
        onSelectRole={setCurrentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        usageLimits={getUsageLimits()}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Main workspace */}
      <div className="main-content">
        
        {/* Top Navbar */}
        <div 
          style={{ 
            height: '60px', 
            borderBottom: '1px solid var(--border-glass)', 
            padding: '0 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            backgroundColor: '#0a0d16'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="btn btn-secondary mobile-menu-btn"
              style={{
                padding: '4px 8px',
                marginRight: '8px',
                fontSize: '1rem',
                lineHeight: '1',
                height: '32px',
                width: '32px',
                display: 'none'
              }}
            >
              ☰
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Workspace</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
              {currentRole === 'superadmin' ? 'Global Platform Administration' : selectedTenant.name}
            </span>
            {currentRole === 'tenant' && isImpersonating && (
              <button
                onClick={() => {
                  setCurrentRole('superadmin');
                  setActiveTab('tenants');
                  setIsImpersonating(false);
                }}
                className="btn"
                style={{
                  marginLeft: '16px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--danger-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
                }}
              >
                ⬅️ Return to Admin
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-glow)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary-color)' }}>
              {currentRole === 'superadmin' ? 'SA' : selectedTenant.name.charAt(0)}
            </div>
          </div>
        </div>

        {/* View body */}
        <div className="content-body">
          {currentRole === 'tenant' ? (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  tenant={selectedTenant}
                  contacts={getFilteredContacts()}
                  appointments={getFilteredAppointments()}
                  deals={getFilteredDeals()}
                  chatsUsed={getUsageLimits().conversationsUsed}
                />
              )}
              {activeTab === 'brain' && (
                <AIBrainView tenant={selectedTenant} />
              )}
              {activeTab === 'employees' && (
                <EmployeeBuilderView
                  agents={getFilteredAgents()}
                  knowledgeSources={getFilteredSources()}
                  onHireAgent={handleHireAgent}
                  onUpdateAgent={handleUpdateAgent}
                />
              )}
              {activeTab === 'inbox' && (
                <CommunicationHubView
                  conversations={getFilteredConversations()}
                  contacts={contacts} // Pass entire list to search matches
                  agents={agents}
                  onAddMessage={handleAddMessage}
                  onUpdateConvStatus={handleUpdateConvStatus}
                  onAddContactNote={handleAddContactNote}
                  onAddContactTag={handleAddContactTag}
                  tenantId={selectedTenantId}
                />
              )}
              {activeTab === 'crm' && (
                <CRMPipelineView
                  contacts={getFilteredContacts()}
                  deals={getFilteredDeals()}
                  onUpdateDealStage={handleUpdateDealStage}
                  onAddContact={handleAddContact}
                  agents={getFilteredAgents()}
                  tenantId={selectedTenantId}
                />
              )}
              {activeTab === 'scheduler' && (
                <SchedulerView
                  appointments={getFilteredAppointments()}
                  contacts={getFilteredContacts()}
                  agents={getFilteredAgents()}
                  onAddAppointment={handleAddAppointment}
                  onCancelAppointment={handleCancelAppointment}
                />
              )}
              {activeTab === 'workflow' && (
                <WorkflowView
                  workflows={workflows}
                  onToggleWorkflow={handleToggleWorkflow}
                  onIncrementRuns={handleIncrementRuns}
                  onAddWorkflow={handleAddWorkflow}
                  onUpdateWorkflow={handleUpdateWorkflow}
                />
              )}
               {activeTab === 'voice' && (
                <VoiceAIView
                  agents={getFilteredAgents()}
                  contacts={getFilteredContacts()}
                  onAddAppointment={handleAddAppointment}
                  onAddVoiceConversation={handleAddVoiceConversation}
                  tenantId={selectedTenantId}
                  tenantName={selectedTenant.name}
                />
              )}
              {activeTab === 'knowledge' && (
                <KnowledgeBaseView
                  sources={getFilteredSources()}
                  chunks={getFilteredChunks()}
                  onAddSource={handleAddSource}
                  agents={getFilteredAgents()}
                />
              )}
              {activeTab === 'widget' && (
                <WidgetBuilderView
                  mode="widget"
                  tenant={selectedTenant}
                  agents={getFilteredAgents()}
                  onAddAppointment={handleAddAppointment}
                  conversations={conversations}
                  onAddMessage={handleAddMessage}
                  websiteEditsLimit={getUsageLimits().websitesLimit || 2}
                  websiteEditsUsed={getUsageLimits().websitesUsed || 0}
                  onIncrementWebsiteEdits={() => {
                    setWebsiteRefreshesCount(prev => ({
                      ...prev,
                      [selectedTenantId]: (prev[selectedTenantId] || 0) + 1
                    }));
                  }}
                  onAddContact={handleAddContact}
                />
              )}
              {activeTab === 'website' && (
                <WidgetBuilderView
                  mode="website"
                  tenant={selectedTenant}
                  agents={getFilteredAgents()}
                  onAddAppointment={handleAddAppointment}
                  conversations={conversations}
                  onAddMessage={handleAddMessage}
                  websiteEditsLimit={getUsageLimits().websitesLimit || 2}
                  websiteEditsUsed={getUsageLimits().websitesUsed || 0}
                  onIncrementWebsiteEdits={() => {
                    setWebsiteRefreshesCount(prev => ({
                      ...prev,
                      [selectedTenantId]: (prev[selectedTenantId] || 0) + 1
                    }));
                  }}
                  onAddContact={handleAddContact}
                />
              )}
              {activeTab === 'whitelabel' && (
                <WhiteLabelView
                  tenant={selectedTenant}
                  onUpdateBranding={handleUpdateBranding}
                />
              )}
              {activeTab === 'team' && (
                <TeamAccessView tenant={selectedTenant} />
              )}
              {activeTab === 'integrations' && (
                <IntegrationsView tenant={selectedTenant} />
              )}
              {activeTab === 'crew' && (
                <CrewAIView
                  agents={getFilteredAgents()}
                  contacts={getFilteredContacts()}
                />
              )}
              {activeTab === 'billing' && (
                <BillingUpgradeView
                  tenant={selectedTenant}
                  usageLimits={getUsageLimits()}
                />
              )}
            </>
          ) : (
            <SuperAdminView
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tenants={tenants}
              onToggleTenantStatus={handleToggleTenantStatus}
              onInstallTemplate={handleInstallTemplate}
              onVisitTenant={handleVisitTenant}
            />
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
