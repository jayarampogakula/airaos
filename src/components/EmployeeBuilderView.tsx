import React, { useState } from 'react';
import { UserCheck, Plus, Shield, Clock, BookOpen, Volume2, X, Check } from 'lucide-react';
import { Agent, KnowledgeSource } from '../types';

interface EmployeeBuilderViewProps {
  agents: Agent[];
  knowledgeSources: KnowledgeSource[];
  onHireAgent: (newAgent: Agent) => void;
  onUpdateAgent: (updatedAgent: Agent) => void;
}

export const EmployeeBuilderView: React.FC<EmployeeBuilderViewProps> = ({
  agents,
  knowledgeSources,
  onHireAgent,
  onUpdateAgent
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<'Support' | 'Sales' | 'Reception' | 'Billing' | 'Admissions'>('Support');
  const [voice, setVoice] = useState('Echo (US Female, warm)');
  const [personality, setPersonality] = useState('');
  const [prompt, setPrompt] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedKb, setSelectedKb] = useState<string[]>([]);

  // Sub-tabs: Hired Employees vs Templates Marketplace
  const [activeViewTab, setActiveViewTab] = useState<'hired' | 'marketplace'>('hired');
  const [successInstall, setSuccessInstall] = useState<string | null>(null);

  const marketplaceTemplates = [
    { 
      name: 'Clinic AI Receptionist', 
      desc: 'Pre-trained dental and medical receptionist. Handles Calendar Scheduler bookings, basic co-pay FAQ, and emergency escalation.', 
      sector: 'Medical',
      agentName: 'Sarah',
      department: 'Reception',
      voice: 'Echo (US Female, warm)',
      personality: 'Preconfigured marketplace Medical Clinic assistant.',
      prompt: 'You are Sarah, the AI Office Receptionist and Lead Coordinator. Answer FAQs, explain clinical services, check availability, and book appointments using the Calendar Scheduler.',
      tools: ['Book Appointment', 'Check Availability']
    },
    { 
      name: 'Real Estate Sales Agent', 
      desc: 'Penthouse tours coordinator. Qualifies buyer budgets, details square footage layouts, and pushes contacts into CRM.', 
      sector: 'Real Estate',
      agentName: 'Marcus',
      department: 'Sales',
      voice: 'Alloy (US Male, energetic)',
      personality: 'Preconfigured marketplace Real Estate Sales coordinator.',
      prompt: 'You are Marcus, the AI Sales Executive. Qualify buyer budgets, detail square footage layouts, capture contact info, and push to CRM.',
      tools: ['Create CRM Lead']
    },
    { 
      name: 'Insurance Advisor', 
      desc: 'Explains health and car deductible limits, matches policies, and logs quotes in the CRM pipeline.', 
      sector: 'Finance',
      agentName: 'James',
      department: 'Sales',
      voice: 'Fable (British Male, clear)',
      personality: 'Preconfigured marketplace Insurance Advisor.',
      prompt: 'You are James, the AI Insurance Advisor. Explain health and car deductible limits, match policies, and log quotes in the CRM pipeline.',
      tools: ['Create CRM Lead', 'Search Docs Database']
    },
    { 
      name: 'Law Firm Assistant', 
      desc: 'Schedules legal consultations, checks conflict-of-interest indicators, and processes intake forms.', 
      sector: 'Legal',
      agentName: 'Chloe',
      department: 'Support',
      voice: 'Nova (UK Female, calm)',
      personality: 'Preconfigured marketplace Law Firm Assistant.',
      prompt: 'You are Chloe, the Law Firm Assistant. Schedule legal consultations, check conflict-of-interest indicators, and process intake forms.',
      tools: ['Book Appointment', 'Update CRM Contact']
    },
    { 
      name: 'Restaurant Booking Agent', 
      desc: 'Manages table reservations, dietary preferences, and triggers Workflow Automator SMS alerts for reservation confirmations.', 
      sector: 'Hospitality',
      agentName: 'Alex',
      department: 'Reception',
      voice: 'Echo (US Female, warm)',
      personality: 'Preconfigured marketplace Restaurant Booking Agent.',
      prompt: 'You are Alex, the Restaurant Booking Agent. Manage table reservations, dietary preferences, and trigger SMS confirmations.',
      tools: ['Book Appointment', 'Send WhatsApp Confirmation']
    },
    {
      name: 'Automotive Service Advisor (Leo)',
      desc: 'Pre-trained garage advisor. Qualifies mileage, checks brake checkup openings, lists repair service packages, and books service bays.',
      sector: 'Automotive',
      agentName: 'Leo',
      department: 'Support',
      voice: 'Alloy (US Male, energetic)',
      personality: 'Preconfigured marketplace Automotive Service Advisor.',
      prompt: 'You are Leo, the AI Automotive Service Advisor. Check vehicle mileage, explain brake checkups, detail repair packages, and book garage service bays.',
      tools: ['Check Availability', 'Book Appointment']
    },
    {
      name: 'SaaS Onboarding Specialist (Clara)',
      desc: 'Assists developers with API keys, troubleshoot credentials rate limits, and matches client subscription plan benefits.',
      sector: 'Technology',
      agentName: 'Clara',
      department: 'Support',
      voice: 'Nova (UK Female, calm)',
      personality: 'Preconfigured marketplace SaaS Onboarding Specialist.',
      prompt: 'You are Clara, the AI SaaS Onboarding Specialist. Help developers generate API keys, troubleshoot rate limits, and explain plan features.',
      tools: ['Search Docs Database', 'Create Support Ticket']
    },
    {
      name: 'Fitness Club Coordinator (Derrick)',
      desc: 'Coordinates gym trial passes, schedules fitness consultations, and details personal trainer rates/packages.',
      sector: 'Wellness',
      agentName: 'Derrick',
      department: 'Sales',
      voice: 'Alloy (US Male, energetic)',
      personality: 'Preconfigured marketplace Fitness Coordinator.',
      prompt: 'You are Derrick, the AI Fitness Coordinator. Help prospects set up free trial gym passes, schedule trainer physical consults, and explain club packages.',
      tools: ['Book Appointment', 'Create CRM Lead']
    },
    {
      name: 'E-Commerce Lead Qualifier (Aria)',
      desc: 'Apparel sizing advisor. Recommends clothing sizes, qualifies shopper budgets, and captures purchase interests.',
      sector: 'Retail',
      agentName: 'Aria',
      department: 'Sales',
      voice: 'Echo (US Female, warm)',
      personality: 'Preconfigured marketplace E-Commerce Assistant.',
      prompt: 'You are Aria, the AI E-Commerce Lead Qualifier. Assist shoppers with apparel style and size recommendations, qualify budgets, and push qualified deals to CRM.',
      tools: ['Create CRM Lead', 'Update CRM Contact']
    }
  ];

  const handleInstallTemplate = (tpl: typeof marketplaceTemplates[0]) => {
    const newAgent: Agent = {
      id: `a-tpl-${Date.now()}`,
      name: tpl.agentName,
      avatar: tpl.sector === 'Medical' 
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' 
        : tpl.sector === 'Real Estate'
        ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      voice: tpl.voice,
      language: 'English',
      personality: tpl.personality,
      department: tpl.department as any,
      prompt: tpl.prompt,
      workingHours: { start: '09:00', end: '18:00' },
      status: 'online',
      tools: tpl.tools,
      knowledgeSources: [],
      escalationRules: 'Escalate to human support if unable to resolve after 2 queries.'
    };

    onHireAgent(newAgent);
    setSuccessInstall(tpl.name);
    setTimeout(() => setSuccessInstall(null), 3000);
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgentId(agent.id);
    setName(agent.name);
    setDepartment(agent.department as any);
    setVoice(agent.voice);
    setPersonality(agent.personality);
    setPrompt(agent.prompt);
    setStartTime(agent.workingHours.start);
    setEndTime(agent.workingHours.end);
    setSelectedTools(agent.tools);
    setSelectedKb(agent.knowledgeSources);
    setEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgentId || !name.trim()) return;

    const targetAgent = agents.find(a => a.id === editingAgentId);
    if (!targetAgent) return;

    const updatedAgent: Agent = {
      ...targetAgent,
      name,
      voice,
      personality: personality || `Attentive and helpful ${department} digital employee.`,
      department,
      prompt: prompt || `You are ${name}, the ${department} agent. Assist customers politely.`,
      workingHours: { start: startTime, end: endTime },
      tools: selectedTools,
      knowledgeSources: selectedKb
    };

    onUpdateAgent(updatedAgent);
    setEditModalOpen(false);
    setEditingAgentId(null);

    // Reset state
    setName('');
    setPersonality('');
    setPrompt('');
    setStartTime('09:00');
    setEndTime('18:00');
    setSelectedTools([]);
    setSelectedKb([]);
  };

  const toggleAgentStatus = (agent: Agent) => {
    const updatedAgent: Agent = {
      ...agent,
      status: agent.status === 'online' ? 'offline' : 'online'
    };
    onUpdateAgent(updatedAgent);
  };

  const availableTools = [
    'Book Appointment',
    'Check Availability',
    'Create CRM Lead',
    'Update CRM Contact',
    'Create Support Ticket',
    'Send WhatsApp Confirmation',
    'Generate Invoice Link',
    'Search Docs Database'
  ];

  const handleToolToggle = (tName: string) => {
    if (selectedTools.includes(tName)) {
      setSelectedTools(selectedTools.filter(x => x !== tName));
    } else {
      setSelectedTools([...selectedTools, tName]);
    }
  };

  const handleKbToggle = (kbName: string) => {
    if (selectedKb.includes(kbName)) {
      setSelectedKb(selectedKb.filter(x => x !== kbName));
    } else {
      setSelectedKb([...selectedKb, kbName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const avatarUrl = department === 'Reception' 
      ? 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150'
      : department === 'Sales'
      ? 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
      : 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150';

    const newAgent: Agent = {
      id: `a-${Date.now()}`,
      name,
      avatar: avatarUrl,
      voice,
      language: 'English',
      personality: personality || `Attentive and helpful ${department} digital employee.`,
      department,
      prompt: prompt || `You are ${name}, the ${department} agent. Assist customers politely.`,
      workingHours: { start: startTime, end: endTime },
      status: 'online',
      tools: selectedTools,
      knowledgeSources: selectedKb,
      escalationRules: 'Escalate to human support if unable to resolve after 2 queries.'
    };

    onHireAgent(newAgent);
    setModalOpen(false);

    // Reset state
    setName('');
    setPersonality('');
    setPrompt('');
    setStartTime('09:00');
    setEndTime('18:00');
    setSelectedTools([]);
    setSelectedKb([]);
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <div className="view-header">
        <div>
          <h2 className="view-title">Digital Employee Builder</h2>
          <p className="view-subtitle">Hire and customize virtual personnel for specific business roles.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <button 
              onClick={() => setActiveViewTab('hired')} 
              className="btn" 
              style={{ 
                padding: '6px 12px', 
                fontSize: '0.75rem', 
                backgroundColor: activeViewTab === 'hired' ? 'var(--primary-color)' : 'transparent', 
                color: activeViewTab === 'hired' ? 'white' : 'var(--text-secondary)'
              }}
            >
              Active Employees
            </button>
            <button 
              onClick={() => setActiveViewTab('marketplace')} 
              className="btn" 
              style={{ 
                padding: '6px 12px', 
                fontSize: '0.75rem', 
                backgroundColor: activeViewTab === 'marketplace' ? 'var(--primary-color)' : 'transparent', 
                color: activeViewTab === 'marketplace' ? 'white' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Browse Templates
            </button>
          </div>
          
          {activeViewTab === 'hired' && (
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Deploy Custom Employee
            </button>
          )}
        </div>
      </div>

      {activeViewTab === 'hired' && (
        /* Grid List of Employees */
        <div className="grid-cols-12 animate-fade-in">
          {agents.map((agent) => (
          <div key={agent.id} className="col-span-6 glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img src={agent.avatar} alt={agent.name} className="avatar-img" style={{ width: '48px', height: '48px' }} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {agent.name}
                    <span className={`badge ${agent.status === 'online' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                      {agent.status === 'online' ? 'Active' : 'Offline'}
                    </span>
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Department: <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>{agent.department}</span>
                  </div>
                </div>
              </div>
              <span className="badge badge-primary">{agent.voice.split(' ')[0]} Voice</span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <strong>Personality:</strong> {agent.personality}
            </p>

            <div style={{ height: '1px', background: 'var(--border-glass)' }} />

            {/* Stats row */}
            <div className="grid-cols-12" style={{ gap: '10px' }}>
              <div className="col-span-6" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <Clock size={12} />
                <span>Shift: {agent.workingHours.start} - {agent.workingHours.end}</span>
              </div>
              <div className="col-span-6" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <Volume2 size={12} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Voice: {agent.voice}</span>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-glass)' }} />

            {/* Tools & Knowledge links */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Authorized System Tools ({agent.tools.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {agent.tools.length > 0 ? (
                  agent.tools.map((t, idx) => (
                    <span key={idx} style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)' }}>
                      🛠️ {t}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No tools assigned</span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Linked Knowledge Sources ({agent.knowledgeSources.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {agent.knowledgeSources.length > 0 ? (
                  agent.knowledgeSources.map((kb, idx) => (
                    <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                      📄 {kb}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No knowledge base mapped</span>
                )}
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-glass)', margin: '8px 0' }} />
            
            {/* Status Toggle and Edit Controls */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button 
                type="button"
                onClick={() => openEditModal(agent)} 
                className="btn btn-secondary" 
                style={{ flex: 1, fontSize: '0.75rem', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                ✏️ Edit Details
              </button>
              <button 
                type="button"
                onClick={() => toggleAgentStatus(agent)} 
                className={`btn ${agent.status === 'online' ? 'btn-danger' : 'btn-success'}`} 
                style={{ flex: 1, fontSize: '0.75rem', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                {agent.status === 'online' ? '🔴 Disable Agent' : '🟢 Enable Agent'}
              </button>
            </div>

            </div>
          ))}
        </div>
      )}

      {activeViewTab === 'marketplace' && (
        /* Marketplace templates */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
          {successInstall && (
            <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} />
              <span>Successfully hired template: <strong>{successInstall}</strong>! It is now active under the "Active Employees" tab.</span>
            </div>
          )}

          <div className="grid-cols-12">
            {marketplaceTemplates.map((tpl, i) => (
              <div key={i} className="col-span-4 glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.6rem' }}>{tpl.sector}</span>
                    <span style={{ fontSize: '1.1rem' }}>🤖</span>
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '6px' }}>{tpl.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '10px' }}>
                    {tpl.desc}
                  </p>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>🗣️ Voice: {tpl.voice.split(' ')[0]}</span>
                    <span>🛠️ Tools: {tpl.tools.join(', ')}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleInstallTemplate(tpl)}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '0.75rem', padding: '6px', marginTop: '16px' }}
                >
                  One-Click Hire
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hire Wizard Modal Overlay */}
      {modalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div 
            className="glass-panel" 
            style={{ 
              width: '600px', 
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 40px)', 
              overflowY: 'auto', 
              padding: '24px', 
              backgroundColor: 'var(--bg-secondary)',
              position: 'relative',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
              boxSizing: 'border-box'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', fontFamily: 'Space Grotesk, sans-serif' }}>Deploy New Digital Employee</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-cols-12">
                <div className="col-span-6 form-group">
                  <label className="form-label">Employee Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Sarah" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                
                <div className="col-span-6 form-group">
                  <label className="form-label">Department / Department Role</label>
                  <select className="form-input" value={department} onChange={(e) => setDepartment(e.target.value as any)}>
                    <option value="Reception">Receptionist</option>
                    <option value="Sales">Sales Coordinator</option>
                    <option value="Support">Support Specialist</option>
                    <option value="Billing">Billing & Accounts Assistant</option>
                    <option value="Admissions">Admissions Counselor</option>
                  </select>
                </div>

                <div className="col-span-6 form-group">
                  <label className="form-label">Trained Voice Model</label>
                  <select className="form-input" value={voice} onChange={(e) => setVoice(e.target.value)}>
                    <option value="Echo (US Female, warm)">Echo (US Female, warm)</option>
                    <option value="Alloy (US Male, energetic)">Alloy (US Male, energetic)</option>
                    <option value="Nova (UK Female, calm)">Nova (UK Female, calm)</option>
                    <option value="Fable (British Male, clear)">Fable (British Male, clear)</option>
                  </select>
                </div>

                <div className="col-span-3 form-group">
                  <label className="form-label">Shift Start</label>
                  <input type="time" className="form-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>

                <div className="col-span-3 form-group">
                  <label className="form-label">Shift End</label>
                  <input type="time" className="form-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role Personality</label>
                <input type="text" className="form-input" placeholder="e.g. Compassionate and extremely organized." value={personality} onChange={(e) => setPersonality(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Custom Instruction Prompt</label>
                <textarea className="form-input" style={{ minHeight: '100px', fontSize: '0.8rem' }} placeholder="Enter prompt instructions for LLM thinking..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </div>

              {/* Action mappings */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Action Tool Integrations</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                  {availableTools.map((tool) => (
                    <div key={tool} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id={`tool-${tool}`}
                        className="form-checkbox"
                        checked={selectedTools.includes(tool)}
                        onChange={() => handleToolToggle(tool)}
                      />
                      <label htmlFor={`tool-${tool}`} style={{ fontSize: '0.75rem', cursor: 'pointer' }}>{tool}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* KB mappings */}
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">Linked Knowledge Base Sources</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                  {knowledgeSources.map((kb) => (
                    <div key={kb.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id={`kb-${kb.id}`}
                        className="form-checkbox"
                        checked={selectedKb.includes(kb.name)}
                        onChange={() => handleKbToggle(kb.name)}
                      />
                      <label htmlFor={`kb-${kb.id}`} style={{ fontSize: '0.75rem', cursor: 'pointer' }}>{kb.name}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={16} /> Deploy Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Agent Modal Overlay */}
      {editModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div 
            className="glass-panel" 
            style={{ 
              width: '600px', 
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 40px)', 
              overflowY: 'auto', 
              padding: '24px', 
              backgroundColor: 'var(--bg-secondary)',
              position: 'relative',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
              boxSizing: 'border-box'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', fontFamily: 'Space Grotesk, sans-serif' }}>Edit Digital Employee Profile</h3>
              <button onClick={() => { setEditModalOpen(false); setEditingAgentId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="grid-cols-12">
                <div className="col-span-6 form-group">
                  <label className="form-label">Employee Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Sarah" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                
                <div className="col-span-6 form-group">
                  <label className="form-label">Department / Department Role</label>
                  <select className="form-input" value={department} onChange={(e) => setDepartment(e.target.value as any)}>
                    <option value="Reception">Receptionist</option>
                    <option value="Sales">Sales Coordinator</option>
                    <option value="Support">Support Specialist</option>
                    <option value="Billing">Billing & Accounts Assistant</option>
                    <option value="Admissions">Admissions Counselor</option>
                  </select>
                </div>

                <div className="col-span-6 form-group">
                  <label className="form-label">Trained Voice Model</label>
                  <select className="form-input" value={voice} onChange={(e) => setVoice(e.target.value)}>
                    <option value="Echo (US Female, warm)">Echo (US Female, warm)</option>
                    <option value="Alloy (US Male, energetic)">Alloy (US Male, energetic)</option>
                    <option value="Nova (UK Female, calm)">Nova (UK Female, calm)</option>
                    <option value="Fable (British Male, clear)">Fable (British Male, clear)</option>
                  </select>
                </div>

                <div className="col-span-3 form-group">
                  <label className="form-label">Shift Start</label>
                  <input type="time" className="form-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>

                <div className="col-span-3 form-group">
                  <label className="form-label">Shift End</label>
                  <input type="time" className="form-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role Personality</label>
                <input type="text" className="form-input" placeholder="e.g. Compassionate and extremely organized." value={personality} onChange={(e) => setPersonality(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Custom Instruction Prompt</label>
                <textarea className="form-input" style={{ minHeight: '100px', fontSize: '0.8rem' }} placeholder="Enter prompt instructions for LLM thinking..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </div>

              {/* Action mappings */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Action Tool Integrations</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                  {availableTools.map((tool) => (
                    <div key={tool} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id={`edit-tool-${tool}`}
                        className="form-checkbox"
                        checked={selectedTools.includes(tool)}
                        onChange={() => handleToolToggle(tool)}
                      />
                      <label htmlFor={`edit-tool-${tool}`} style={{ fontSize: '0.75rem', cursor: 'pointer' }}>{tool}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* KB mappings */}
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">Linked Knowledge Base Sources</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                  {knowledgeSources.map((kb) => (
                    <div key={kb.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id={`edit-kb-${kb.id}`}
                        className="form-checkbox"
                        checked={selectedKb.includes(kb.name)}
                        onChange={() => handleKbToggle(kb.name)}
                      />
                      <label htmlFor={`edit-kb-${kb.id}`} style={{ fontSize: '0.75rem', cursor: 'pointer' }}>{kb.name}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setEditModalOpen(false); setEditingAgentId(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
