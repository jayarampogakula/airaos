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
import { TenantSettingsView } from './components/TenantSettingsView';
import { TenantSupportView } from './components/TenantSupportView';
import { useAuth } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';


import { 
  mockTenants, mockAgents, mockContacts, mockDeals, 
  mockConversations, mockAppointments, mockWorkflows, 
  mockKnowledgeSources, mockKbChunks, mockSystemMetrics, mockBillingLimits 
} from './mockData';
import { Tenant, Agent, Contact, Deal, Conversation, Appointment, Workflow, KnowledgeSource, KbChunk, SystemMetrics, ChatMessage } from './types';

function App() {
  const {
    user,
    activeTenant,
    activeTenantId,
    apiFetch,
    isAuthenticated,
    logout,
    switchTenant,
    tenants: authTenants
  } = useAuth();
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

  useEffect(() => {
    if (activeTenantId) {
      setSelectedTenantId(activeTenantId);
      setCurrentRole('tenant');
      setViewMode('app');
    }
  }, [activeTenantId]);

  useEffect(() => {
    if (currentRole === 'superadmin') {
      if (!['tenants', 'plans', 'infrastructure', 'settings', 'marketplace', 'support_bot'].includes(activeTab)) {
        setActiveTab('tenants');
      }
    } else {
      if (['tenants', 'plans', 'infrastructure', 'settings', 'marketplace', 'support_bot'].includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [currentRole, activeTab]);

  useEffect(() => {
    if (authTenants.length > 0) {
      setTenants(authTenants);
    }
  }, [authTenants]);

  // Core Ledgers
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows.map(w => ({ ...w, tenantId: 't-1' })));
  const [sources, setSources] = useState<KnowledgeSource[]>(mockKnowledgeSources);
  const [chunks, setChunks] = useState<KbChunk[]>(mockKbChunks);
  const [platformSupportBot, setPlatformSupportBot] = useState({
    enabled: true,
    name: 'Platform Guide',
    avatar: '🤖',
    welcomeMessage: 'Hi! I am the AiraOS Platform Assistant. How can I help you integrate SIP, Twilio, configure BYO, or understand our packages and rates today?',
    prompt: 'You are the AiraOS Platform Assistant, a friendly and extremely helpful digital receptionist for AiraOS platform users (tenants).\n\nYour task is to clarify doubts regarding:\n1. Twilio Integration: Enter Twilio Account SID, Auth Token, and Twilio Phone Number in the Integrations panel.\n2. BYO (Bring Your Own) Carrier: Configure BYO SIP Server host, username, password, and the custom phone number.\n3. SIP Integration: Use the BYO SIP Server credentials to route inbound and outbound calls through custom PBX/carriers.\n4. Packages & Rates: Growth (₹2,499/mo, 5,000 chats, 300 voice mins), Scale (₹6,999/mo, 25,000 chats, 2,000 voice mins), and Enterprise (₹19,999/mo+, unlimited chats/voice, unlimited digital employees). Overage rates: $0.05 per chat, $0.15 per voice minute, $0.10/min inbound, $0.20/min outbound.\n\nBe professional, brief, and clear. Help users understand how to set these up in their Settings and Integrations sections.'
  });

  const [platformBillingSettings, setPlatformBillingSettings] = useState(() => {
    const stored = localStorage.getItem('platform_billing_settings');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return {
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
      overageChatRate: 0.05,
      overageVoiceRate: 0.15,
      inboundCallRate: 0.10,
      outboundCallRate: 0.20,
      voiceSynthesisRate: 0.02,
      chatAddonPrice: 250,
      voiceAddonPrice: 400
    };
  });

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
    localStorage.setItem('platform_billing_settings', JSON.stringify(platformBillingSettings));
  }, [platformBillingSettings]);

  // Force superadmin role for admin user
  useEffect(() => {
    if (user?.email === 'admin@airaos.com' && currentRole !== 'superadmin' && !isImpersonating) {
      setCurrentRole('superadmin');
      setActiveTab('tenants');
    }
  }, [user, currentRole, isImpersonating]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadBackendData = async () => {
      try {
        const [bootstrapRes, botRes, billingRes] = await Promise.all([
          apiFetch('/api/current-tenant/bootstrap'),
          apiFetch('/api/platform-support-bot'),
          apiFetch('/api/platform-billing-settings')
        ]);

        if (bootstrapRes.ok) {
          const data = await bootstrapRes.json();
          if (data.tenant) {
            setTenants(prev => prev.map(t => t.id === data.tenant.id ? data.tenant : t));
          }
          setContacts(data.contacts || []);
          setDeals(data.deals || []);
          setAppointments(data.appointments || []);
          setConversations(data.conversations || []);
          setAgents(data.agents?.length ? data.agents : getFilteredAgents());
          if (data.workflows?.length) setWorkflows(data.workflows);
          if (data.knowledge_sources) setSources(data.knowledge_sources);
          if (data.knowledge_chunks) setChunks(data.knowledge_chunks);
        }
        if (botRes.ok) {
          const data = await botRes.json();
          if (data) setPlatformSupportBot(data);
        }
        if (billingRes.ok) {
          const data = await billingRes.json();
          if (data) setPlatformBillingSettings(data);
        }
      } catch (err) {
        console.warn('Backend server not online. Running in simulation mode with local mock storage.', err);
      }
    };

    loadBackendData();
  }, [apiFetch, isAuthenticated, activeTenantId]);

  // Dynamically inject/remove Platform Support Bot script widget
  useEffect(() => {
    if (platformSupportBot?.enabled) {
      // Prevent duplicate scripts or widgets
      const existingScript = document.getElementById('airaos-platform-bot-script');
      if (existingScript) return;

      const getAppBasePath = () => {
        const path = window.location.pathname;
        if (path.endsWith('.html')) {
          return path.substring(0, path.lastIndexOf('/') + 1);
        }
        return path.endsWith('/') ? path : path + '/';
      };

      const script = document.createElement('script');
      script.id = 'airaos-platform-bot-script';
      script.src = getAppBasePath() + 'widget.js';
      script.setAttribute('data-tenant-id', selectedTenantId || 't-1');
      script.setAttribute('data-title', platformSupportBot.name || 'Platform Guide');
      script.setAttribute('data-color', '#6366f1');
      script.setAttribute('data-position', 'right');
      script.setAttribute('data-mode', 'hybrid');
      script.setAttribute('data-agent-id', 'platform-support');
      script.defer = true;
      document.head.appendChild(script);

      return () => {
        // Cleanup if disabled or component updates
        const scriptEl = document.getElementById('airaos-platform-bot-script');
        if (scriptEl) scriptEl.remove();
        
        // Remove launcher and container elements created by widget.js
        const launcher = document.querySelector('.airaos-widget-launcher');
        const container = document.querySelector('.airaos-widget-container');
        if (launcher) launcher.remove();
        if (container) container.remove();
        
        // Remove stylesheet injected by widget.js
        const styles = document.getElementsByTagName('style');
        for (let i = 0; i < styles.length; i++) {
          if (styles[i].innerHTML.includes('airaos-widget-launcher')) {
            styles[i].remove();
            break;
          }
        }

        delete (window as any).AiraOSWidgetLoaded;
      };
    } else {
      // If disabled, make sure it is cleaned up
      const scriptEl = document.getElementById('airaos-platform-bot-script');
      if (scriptEl) scriptEl.remove();
      const launcher = document.querySelector('.airaos-widget-launcher');
      const container = document.querySelector('.airaos-widget-container');
      if (launcher) launcher.remove();
      if (container) container.remove();
      
      const styles = document.getElementsByTagName('style');
      for (let i = 0; i < styles.length; i++) {
        if (styles[i].innerHTML.includes('airaos-widget-launcher')) {
          styles[i].remove();
          break;
        }
      }

      delete (window as any).AiraOSWidgetLoaded;
    }
  }, [platformSupportBot?.enabled, platformSupportBot?.name, selectedTenantId]);

  const selectedTenant = tenants.find(t => t.id === selectedTenantId) || activeTenant || tenants[0];

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
    const superadminTabs = ['tenants', 'plans', 'infrastructure', 'settings', 'marketplace', 'support_bot'];
    const tenantTabs = [
      'dashboard', 'brain', 'employees', 'inbox', 'crm', 
      'scheduler', 'workflow', 'voice', 'knowledge', 'widget', 'website', 'whitelabel', 'team', 'integrations', 'crew', 'billing',
      'tenant_settings', 'tenant_support'
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
    const scoped = agents.filter(a => !a.tenantId || a.tenantId === selectedTenantId);
    if (scoped.length) return scoped;
    if (selectedTenantId === 't-1') return agents.filter(a => a.department === 'Reception' || a.department === 'Billing');
    if (selectedTenantId === 't-2') return agents.filter(a => a.department === 'Sales' || a.department === 'Reception');
    return agents.filter(a => a.department === 'Support' || a.department === 'Billing');
  };

  const getFilteredConversations = () => {
    const scoped = conversations.filter(c => !c.tenantId || c.tenantId === selectedTenantId);
    if (scoped.length) return scoped;
    const tenantAgents = getFilteredAgents().map(a => a.id);
    return conversations.filter(c => tenantAgents.includes(c.assignedAgentId || ''));
  };

  const getFilteredAppointments = () => {
    const scoped = appointments.filter(app => !app.tenantId || app.tenantId === selectedTenantId);
    if (scoped.length) return scoped;
    const tenantAgents = getFilteredAgents().map(a => a.id);
    return appointments.filter(app => tenantAgents.includes(app.agentId));
  };

  const getFilteredDeals = () => {
    const scoped = deals.filter(d => !d.tenantId || d.tenantId === selectedTenantId);
    if (scoped.length) return scoped;
    // In our seed, John Doe is for Dental, Sarah Jenkins for Real Estate, Michael Chen for TechSupport
    if (selectedTenantId === 't-1') return deals.filter(d => d.contactId === 'c-101' || d.contactId === 'c-104');
    if (selectedTenantId === 't-2') return deals.filter(d => d.contactId === 'c-102');
    return deals.filter(d => d.contactId === 'c-103');
  };

  const getFilteredContacts = () => {
    const scoped = contacts.filter(c => !c.tenantId || c.tenantId === selectedTenantId);
    if (scoped.length) return scoped;
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
      tenantId: selectedTenantId,
      conversationId: convId,
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

    apiFetch(`/api/current-tenant/conversations/${convId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, allowLocalFallback: true })
    }).catch(err => console.warn('Could not sync status to server:', err));
  };


  const handleAddContactNote = (contactId: string, note: string) => {
    let updatedContact: any = null;
    setContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        updatedContact = { ...c, notes: [...c.notes, note] };
        return updatedContact;
      }
      return c;
    }));

    if (updatedContact) {
      apiFetch(`/api/current-tenant/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedContact)
      }).catch(err => console.warn('Could not sync contact note to backend.', err));
    }
  };

  const handleAddContactTag = (contactId: string, tag: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        return { ...c, tags: [...c.tags, tag] };
      }
      return c;
    }));
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    apiFetch(`/api/contacts/${updatedContact.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedContact)
    }).catch(err => console.warn('Could not sync updated contact to backend:', err));
  };

  const handleUpdateDealStage = (dealId: string, stage: Deal['stage']) => {
    setDeals(prev => prev.map(d => {
      if (d.id === dealId) {
        return { ...d, stage };
      }
      return d;
    }));

    apiFetch(`/api/current-tenant/deals/${dealId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage })
    }).catch(err => console.warn('Could not sync deal stage to backend.', err));
  };

  const handleAddContact = async (newContactData: Omit<Contact, 'id' | 'createdAt' | 'tags' | 'notes'>) => {
    const newContact: Contact = {
      ...newContactData,
      id: `c-${Date.now()}`,
      tenantId: selectedTenantId,
      createdAt: new Date().toISOString(),
      tags: ['Manual Inbound'],
      notes: []
    };

    setContacts(prev => [...prev, newContact]);

    // Create a corresponding deal
    const newDeal: Deal = {
      id: `d-${Date.now()}`,
      tenantId: selectedTenantId,
      contactId: newContact.id,
      name: `${newContact.name} - Custom Inquire`,
      value: 500,
      stage: 'lead',
      createdAt: new Date().toISOString()
    };
    setDeals(prev => [...prev, newDeal]);

    try {
      await apiFetch('/api/current-tenant/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
      await apiFetch('/api/current-tenant/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeal)
      });
    } catch (err) {
      console.warn('Could not sync contact/deal to backend.', err);
    }
  };

  const handleAddAppointment = (newApp: Appointment) => {
    const scopedApp = { ...newApp, tenantId: newApp.tenantId || selectedTenantId };
    setAppointments(prev => {
      if (prev.some(a => a.id === scopedApp.id)) return prev;
      return [scopedApp, ...prev];
    });

    setContacts(prev => prev.map(c => {
      if (c.id === scopedApp.contactId) {
        const timeStr = new Date(scopedApp.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const note = `Calendar Scheduler Slot Booked: ${scopedApp.type} on ${new Date(scopedApp.dateTime).toLocaleDateString()} at ${timeStr}`;
        if (c.notes.includes(note)) return c;
        return {
          ...c,
          notes: [...c.notes, note]
        };
      }
      return c;
    }));

    apiFetch('/api/current-tenant/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scopedApp)
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

    apiFetch(`/api/current-tenant/appointments/${appId}`, {
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
        tenantId: selectedTenantId,
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
      tenantId: selectedTenantId,
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
        tenantId: selectedTenantId,
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
    const scopedWorkflow = { ...newWf, tenantId: newWf.tenantId || selectedTenantId };
    setWorkflows(prev => [...prev, scopedWorkflow]);
    apiFetch('/api/current-tenant/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scopedWorkflow)
    }).catch(err => console.warn('Could not sync workflow to backend.', err));
  };

  const getFilteredWorkflows = () => {
    return workflows.filter(w => w.tenantId === selectedTenantId);
  };

  const handleUpdateWorkflow = (updatedWf: Workflow) => {
    const scopedWorkflow = { ...updatedWf, tenantId: updatedWf.tenantId || selectedTenantId };
    setWorkflows(prev => prev.map(w => w.id === scopedWorkflow.id ? scopedWorkflow : w));
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
          const updatedAgent = {
            ...a,
            knowledgeSources: [...a.knowledgeSources, newSource.name]
          };
          apiFetch(`/api/current-tenant/agents/${a.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedAgent)
          }).catch(err => console.warn('Could not sync agent kb updates to backend.', err));
          return updatedAgent;
        }
        return a;
      }));
    }

    apiFetch('/api/current-tenant/knowledge-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newSource,
        chunks: sourceChunks
      })
    }).catch(err => console.warn('Could not sync knowledge source to backend.', err));
  };

  const handleUpdateBranding = (tenantId: string, updates: Partial<Tenant>) => {
    let updatedTenant: any = null;
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        updatedTenant = { ...t, ...updates };
        return updatedTenant;
      }
      return t;
    }));

    if (updatedTenant) {
      apiFetch('/api/current-tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(err => console.warn('Could not sync branding changes to backend.', err));
    }
  };

  const handleHireAgent = (newAgent: Agent) => {
    const scopedAgent = { ...newAgent, tenantId: newAgent.tenantId || selectedTenantId };
    setAgents(prev => [scopedAgent, ...prev]);
    apiFetch('/api/current-tenant/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scopedAgent)
    }).catch(err => console.warn('Could not sync agent to backend.', err));
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    const scopedAgent = { ...updatedAgent, tenantId: updatedAgent.tenantId || selectedTenantId };
    setAgents(prev => prev.map(a => a.id === scopedAgent.id ? scopedAgent : a));
    apiFetch(`/api/current-tenant/agents/${scopedAgent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scopedAgent)
    }).catch(err => console.warn('Could not sync agent update to backend.', err));
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

  const handleLoginSuccess = (_role: 'tenant' | 'superadmin', tenantId?: string, email?: string) => {
    const isAdmin = email === 'admin@airaos.com' || user?.email === 'admin@airaos.com';
    if (isAdmin) {
      setCurrentRole('superadmin');
      setActiveTab('tenants');
    } else {
      setCurrentRole('tenant');
      setSelectedTenantId(tenantId || activeTenantId || 't-1');
      setActiveTab('dashboard');
    }
    setViewMode('app');
  };

  const handleLogout = async () => {
    await logout();
    setViewMode('marketing');
    setCurrentRole('tenant');
    setSelectedTenantId('t-1');
    setActiveTab('dashboard');
    setIsImpersonating(false);
  };

  const getBillingSettings = () => {
    return platformBillingSettings;
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

  if (!isAuthenticated || viewMode === 'marketing') {
    return <LandingPageView onLoginSuccess={handleLoginSuccess} />;
  }

  if (window.location.hash.startsWith('#phonepe-checkout')) {
    return <PhonePeSimulator />;
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        user={user}
        currentRole={currentRole}
        selectedTenant={selectedTenant}
        tenants={tenants}
        onSelectTenant={(tenantId) => {
          switchTenant(tenantId)
            .then(() => {
              setSelectedTenantId(tenantId);
              setActiveTab('dashboard');
            })
            .catch((err) => console.warn('Could not switch workspace.', err));
        }}
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
                  platformSupportBot={platformSupportBot}
                  usageLimits={getUsageLimits()}
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
                  onUpdateContact={handleUpdateContact}
                />
              )}
              {activeTab === 'crm' && (
                <CRMPipelineView
                  contacts={getFilteredContacts()}
                  deals={getFilteredDeals()}
                  onUpdateDealStage={handleUpdateDealStage}
                  onAddContact={handleAddContact}
                  onAddContactNote={handleAddContactNote}
                  agents={getFilteredAgents()}
                  tenantId={selectedTenantId}
                  onUpdateContact={handleUpdateContact}
                />
              )}
              {activeTab === 'scheduler' && (
                <SchedulerView
                  appointments={getFilteredAppointments()}
                  contacts={getFilteredContacts()}
                  agents={getFilteredAgents()}
                  onAddAppointment={handleAddAppointment}
                  onCancelAppointment={handleCancelAppointment}
                  tenantId={selectedTenantId}
                />
              )}
              {activeTab === 'workflow' && (
                <WorkflowView
                  workflows={getFilteredWorkflows()}
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
                  onSwitchTab={setActiveTab}
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
                  onSwitchTab={setActiveTab}
                  onUpdateTenant={(updates) => handleUpdateBranding(selectedTenantId, updates)}
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
                  onSwitchTab={setActiveTab}
                  onUpdateTenant={(updates) => handleUpdateBranding(selectedTenantId, updates)}
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
                <IntegrationsView tenant={selectedTenant} currentRole={currentRole} />
              )}
              {activeTab === 'crew' && (
                <CrewAIView
                  agents={getFilteredAgents()}
                  contacts={getFilteredContacts()}
                  tenantId={selectedTenantId}
                />
              )}
              {activeTab === 'billing' && (
                <BillingUpgradeView
                  tenant={selectedTenant}
                  usageLimits={getUsageLimits()}
                  platformBillingSettings={platformBillingSettings}
                />
              )}
              {activeTab === 'tenant_settings' && (
                <TenantSettingsView
                  tenant={selectedTenant}
                  onUpdateSettings={(updates) => handleUpdateBranding(selectedTenantId, updates)}
                />
              )}
              {activeTab === 'tenant_support' && (
                <TenantSupportView
                  tenant={selectedTenant}
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
              platformSupportBot={platformSupportBot}
              onUpdatePlatformSupportBot={(data: any) => {
                setPlatformSupportBot(data);
                apiFetch('/api/platform-support-bot', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                }).catch(err => console.error('Failed to save platform support bot settings:', err));
              }}
              platformBillingSettings={platformBillingSettings}
              onUpdatePlatformBillingSettings={(data: any) => {
                setPlatformBillingSettings(data);
                apiFetch('/api/platform-billing-settings', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                }).catch(err => console.error('Failed to save platform billing settings:', err));
              }}
            />
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
