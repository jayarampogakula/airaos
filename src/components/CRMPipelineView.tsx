import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Calendar, ChevronRight, UserPlus, 
  Search, KanbanSquare, Table, Trash2, ArrowRight, 
  Brain, AlertTriangle, FileText, CheckCircle2, BarChart3, Clock, MapPin, Briefcase, Shield
} from 'lucide-react';
import { Contact, Deal, Agent } from '../types';

interface CRMPipelineViewProps {
  contacts: Contact[];
  deals: Deal[];
  onUpdateDealStage: (dealId: string, stage: Deal['stage']) => void;
  onAddContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'tags' | 'notes'>) => void;
  onAddContactNote?: (contactId: string, note: string) => void;
  agents: Agent[];
  tenantId: string;
  onUpdateContact?: (updated: Contact) => void;
}

interface DropoffAnalysisReport {
  dealId: string;
  dealName: string;
  clientName: string;
  value: number;
  cause: string;
  confidence: number;
  explanation: string;
  transcriptHighlight: { sender: string; text: string }[];
  recoveryPlan: string;
  recoveryTriggered: boolean;
}

export const CRMPipelineView: React.FC<CRMPipelineViewProps> = ({
  contacts,
  deals,
  onUpdateDealStage,
  onAddContact,
  onAddContactNote,
  agents,
  tenantId,
  onUpdateContact
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'deals' | 'contacts' | 'dropoff'>('deals');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editProject, setEditProject] = useState('');
  const [editAgentId, setEditAgentId] = useState('');

  const handleStartEdit = (c: Contact) => {
    setEditName(c.name || '');
    setEditEmail(c.email || '');
    setEditPhone(c.phone || '');
    setEditCompany(c.company || '');
    setEditCity(c.city || '');
    setEditProject(c.project || '');
    setEditAgentId(c.assignedAgentId || '');
    setIsEditing(true);
  };

  const handleSaveContactEdit = (contactId: string) => {
    if (onUpdateContact) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        onUpdateContact({
          ...contact,
          name: editName,
          email: editEmail,
          phone: editPhone,
          company: editCompany,
          city: editCity,
          project: editProject,
          assignedAgentId: editAgentId
        });
      }
    }
    setIsEditing(false);
  };
  
  // CRM Filters state
  const [filterDate, setFilterDate] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterAgent, setFilterAgent] = useState('');

  // Selected contact for detail drawer
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  useEffect(() => {
    setIsEditing(false);
  }, [selectedContactId]);

  // AI Campaign states
  const [campaignObjective, setCampaignObjective] = useState('');
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [campaignLogs, setCampaignLogs] = useState<string[]>([]);

  // New contact form state
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  // Drop-off Analysis State
  const [selectedLostDealId, setSelectedLostDealId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<DropoffAnalysisReport | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  const handleRunCampaign = (contactId: string) => {
    if (!campaignObjective.trim()) return;
    setIsCampaignRunning(true);
    setCampaignLogs([`[SYSTEM] Initializing outbound follow-up campaign...`]);

    setTimeout(() => {
      setCampaignLogs(prev => [...prev, `[AI AGENT] Fetching contact credentials for WhatsApp dispatch...`]);
    }, 400);

    setTimeout(() => {
      setCampaignLogs(prev => [...prev, `[AI AGENT] Sending message: "Hi! Following up regarding your inquiry. Are you still looking to achieve: '${campaignObjective}'?"`]);
      if (onAddContactNote) {
        onAddContactNote(contactId, `AI Campaign Triggered: Sent WhatsApp message with objective: "${campaignObjective}"`);
      }
    }, 900);

    setTimeout(() => {
      setCampaignLogs(prev => [...prev, `[SYSTEM] Analyzing customer response payload...`]);
    }, 1600);

    setTimeout(() => {
      const responses = [
        "Yes, I'm absolutely interested! Can we schedule a slots tomorrow?",
        "Yes, that fits my budget, let's schedule a call.",
        "Sure, tell me more about it.",
        "I'm interested, please share the admission details."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setCampaignLogs(prev => [...prev, `[CUSTOMER REPLIED] "${randomResponse}"`]);
      
      if (onAddContactNote) {
        onAddContactNote(contactId, `Customer Replied: "${randomResponse}" (Sentiment: Positive)`);
      }
    }, 2200);

    setTimeout(() => {
      setCampaignLogs(prev => [...prev, `[DECISION ENGINE] Sentiment: POSITIVE. Automatically advancing pipeline deal stage to "Qualified".`]);
      
      const contactDeals = deals.filter(d => d.contactId === contactId);
      if (contactDeals.length > 0) {
        const targetDeal = contactDeals[0];
        onUpdateDealStage(targetDeal.id, 'qualified');
        
        if (onAddContactNote) {
          onAddContactNote(contactId, `System Action: Automatically advanced Deal "${targetDeal.name}" to Qualified stage based on AI Campaign response.`);
        }
      } else {
        setCampaignLogs(prev => [...prev, `[WARNING] No deal found for this contact. Deal progress skipped.`]);
      }
      
      setIsCampaignRunning(false);
      setCampaignObjective('');
    }, 3000);
  };

  const stages: { id: Deal['stage']; label: string; color: string }[] = [
    { id: 'lead', label: 'Lead Inbound', color: 'var(--accent-color)' },
    { id: 'qualified', label: 'Qualified', color: 'var(--primary-color)' },
    { id: 'proposal', label: 'Proposal Sent', color: 'var(--warning-color)' },
    { id: 'negotiation', label: 'Negotiation', color: '#c084fc' }, 
    { id: 'won', label: 'Won', color: 'var(--success-color)' },
    { id: 'lost', label: 'Lost', color: 'var(--danger-color)' }
  ];

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddContact({
      name,
      email,
      phone,
      company: company || 'Individual'
    });

    setFormOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lost Deals Selection
  const lostDeals = deals.filter(d => d.stage === 'lost');

  // Trigger simulated AI Analysis for Drop-off Cause
  const handleAnalyzeDropoff = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    const contact = contacts.find(c => c.id === deal?.contactId);
    if (!deal || !contact) return;

    setSelectedLostDealId(dealId);
    setIsAnalyzing(true);
    setAnalysisReport(null);
    setWebhookStatus(null);

    setTimeout(() => {
      let report: DropoffAnalysisReport;

      // Predict cause based on name or value (simulated RAG logs lookup)
      if (deal.name.toLowerCase().includes('dental') || contact.name.toLowerCase().includes('doe')) {
        report = {
          dealId: deal.id,
          dealName: deal.name,
          clientName: contact.name,
          value: deal.value,
          cause: 'Pricing Barrier',
          confidence: 94,
          explanation: 'The customer requested whitening services but repeatedly objected to the $450 price point, asking for a discount under $400. The AI assistant was constrained by pricing guidelines and could not offer reductions, leading to deal stagnation.',
          transcriptHighlight: [
            { sender: 'Patient (John Doe)', text: 'Is there any discount? $450 is a bit steep for whitening.' },
            { sender: 'AI (Sarah)', text: 'We do not offer custom discounts at this time. Standard whitening is $450. Would you still like to schedule?' },
            { sender: 'Patient (John Doe)', text: 'No thanks, I will check elsewhere.' }
          ],
          recoveryPlan: 'Send automated email linking to our dental insurance co-pay discount schemes, and offer a first-time patient whitening coupon of $50.',
          recoveryTriggered: false
        };
      } else if (deal.name.toLowerCase().includes('penthouse') || contact.name.toLowerCase().includes('jenkins')) {
        report = {
          dealId: deal.id,
          dealName: deal.name,
          clientName: contact.name,
          value: deal.value,
          cause: 'Scheduling Conflict & Timing',
          confidence: 88,
          explanation: 'The client wanted to book a private tour of the penthouse showing specifically on Sunday, but our weekly shifts are mapped Monday to Friday. The AI offered Saturday slots, which did not align with the customer\'s corporate calendar, causing drop-off.',
          transcriptHighlight: [
            { sender: 'Buyer (Sarah Jenkins)', text: 'Can we book the penthouse view tour on Sunday morning at 10?' },
            { sender: 'AI (Marcus)', text: 'Our property advisors are only available Monday to Friday from 9AM to 6PM. I can schedule a tour for Monday morning?' },
            { sender: 'Buyer (Sarah Jenkins)', text: 'Monday does not work. I\'m only in town on Sunday.' }
          ],
          recoveryPlan: 'Trigger a task request for our human realtor to schedule an emergency Sunday tour exception, and text the client regarding custom arrangements.',
          recoveryTriggered: false
        };
      } else {
        report = {
          dealId: deal.id,
          dealName: deal.name,
          clientName: contact.name,
          value: deal.value,
          cause: 'Missing Specialized Service',
          confidence: 82,
          explanation: 'The client inquired about specialized server load balancing setups which are outside our standard microservice subscription parameters. The support agent offered standard integrations, but the customer required customized code.',
          transcriptHighlight: [
            { sender: 'Client (Michael Chen)', text: 'Do you offer custom vector database load balancer node configurations?' },
            { sender: 'AI (Chloe)', text: 'We support standard PostgreSQL vector configurations. Custom load balancer setup is not in our direct catalogue.' }
          ],
          recoveryPlan: 'Dispatch technical sales callback webhook to outline custom enterprise integration tiers.',
          recoveryTriggered: false
        };
      }

      setAnalysisReport(report);
      setIsAnalyzing(false);
    }, 1800);
  };

  const handleTriggerRecoveryFlow = () => {
    if (!analysisReport) return;
    setWebhookStatus('firing');
    
    // Simulate recovery webhook call
    setTimeout(() => {
      setWebhookStatus('success');
      setAnalysisReport(prev => prev ? { ...prev, recoveryTriggered: true } : null);
    }, 1500);
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      
      {/* View Header with Sub-tabs */}
      <div className="view-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 className="view-title">CRM Pipeline</h2>
          <p className="view-subtitle">Consolidated Customer Relationship Management system and automated conversions analyst.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Sub-tab Switches */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <button
              onClick={() => setActiveSubTab('deals')}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                backgroundColor: activeSubTab === 'deals' ? 'var(--primary-color)' : 'transparent',
                color: activeSubTab === 'deals' ? 'white' : 'var(--text-secondary)'
              }}
            >
              <KanbanSquare size={14} /> Deals Pipeline
            </button>
            <button
              onClick={() => setActiveSubTab('contacts')}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                backgroundColor: activeSubTab === 'contacts' ? 'var(--primary-color)' : 'transparent',
                color: activeSubTab === 'contacts' ? 'white' : 'var(--text-secondary)'
              }}
            >
              <Table size={14} /> Contacts Directory
            </button>
            <button
              onClick={() => setActiveSubTab('dropoff')}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                backgroundColor: activeSubTab === 'dropoff' ? 'var(--primary-color)' : 'transparent',
                color: activeSubTab === 'dropoff' ? 'white' : 'var(--text-secondary)'
              }}
            >
              <Brain size={14} /> AI Drop-off Analyst
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
            <UserPlus size={16} /> New Contact
          </button>
        </div>
      </div>

      {/* Unified Filters Bar */}
      {(activeSubTab === 'deals' || activeSubTab === 'contacts') && (
        <div 
          className="glass-panel animate-fade-in" 
          style={{ 
            padding: '12px 18px', 
            marginBottom: '16px', 
            display: 'flex', 
            gap: '12px', 
            flexWrap: 'wrap', 
            alignItems: 'center',
            background: 'rgba(255,255,255,0.01)'
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1.2, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search contacts/deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '30px', paddingTop: '5px', paddingBottom: '5px', fontSize: '0.75rem', height: '32px' }}
            />
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}><Clock size={12} /> Date:</span>
            <input
              type="date"
              className="form-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ fontSize: '0.75rem', padding: '4px 8px', height: '32px', width: '120px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'white' }}
            />
          </div>

          {/* City Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={12} /> City:</span>
            <select
              className="form-input"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              style={{ fontSize: '0.75rem', padding: '4px 8px', height: '32px', width: '120px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'white' }}
            >
              <option value="">All Cities</option>
              <option value="New York">New York</option>
              <option value="Miami">Miami</option>
              <option value="San Francisco">San Francisco</option>
            </select>
          </div>

          {/* Project Filter (Real Estate only: tenantId === 't-2') */}
          {tenantId === 't-2' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}><Briefcase size={12} /> Project:</span>
              <select
                className="form-input"
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                style={{ fontSize: '0.75rem', padding: '4px 8px', height: '32px', width: '130px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'white' }}
              >
                <option value="">All Projects</option>
                <option value="Apex Penthouse">Apex Penthouse</option>
                <option value="Skyline Condos">Skyline Condos</option>
                <option value="Greenwood Villas">Greenwood Villas</option>
              </select>
            </div>
          )}

          {/* Assigned Agent Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}><Shield size={12} /> Agent:</span>
            <select
              className="form-input"
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              style={{ fontSize: '0.75rem', padding: '4px 8px', height: '32px', width: '130px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'white' }}
            >
              <option value="">All Agents</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.department})</option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchTerm || filterDate || filterCity || filterProject || filterAgent) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDate('');
                setFilterCity('');
                setFilterProject('');
                setFilterAgent('');
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.65rem', padding: '4px 8px', height: '32px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {activeSubTab === 'deals' && (
        /* ================= DEALS KANBAN TAB ================= */
        <div className="kanban-board">
          {stages.map((stage) => {
            const getFilteredDeals = () => {
              return deals.filter(d => {
                const contact = contacts.find(c => c.id === d.contactId);
                if (!contact) return false;
                
                const searchMatch = !searchTerm || 
                  d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  contact.name.toLowerCase().includes(searchTerm.toLowerCase());
                  
                const dateMatch = !filterDate || new Date(contact.createdAt) >= new Date(filterDate);
                const cityMatch = !filterCity || (contact.city && contact.city.toLowerCase().includes(filterCity.toLowerCase()));
                const projectMatch = !filterProject || (contact.project && contact.project.toLowerCase() === filterProject.toLowerCase());
                const agentMatch = !filterAgent || contact.assignedAgentId === filterAgent;
                
                return searchMatch && dateMatch && cityMatch && projectMatch && agentMatch;
              });
            };

            const stageDeals = getFilteredDeals().filter(d => d.stage === stage.id);
            const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
            return (
              <div 
                key={stage.id} 
                className="kanban-column"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const dealId = e.dataTransfer.getData("text/plain");
                  if (dealId) {
                    onUpdateDealStage(dealId, stage.id);
                  }
                }}
              >
                <div className="kanban-column-header">
                  <div>
                    <h4 className="kanban-column-title" style={{ color: stage.color }}>{stage.label}</h4>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {stageDeals.length} deals • ${totalValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="kanban-cards-container">
                  {stageDeals.map((deal) => {
                    const contact = contacts.find(c => c.id === deal.contactId);
                    return (
                      <div 
                        key={deal.id} 
                        className="kanban-card"
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", deal.id);
                        }}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).tagName !== 'SELECT') {
                            setSelectedContactId(contact?.id || null);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {deal.name}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          👤 {contact?.name || 'Unknown Contact'}
                        </div>
                        {contact?.company && contact.company !== 'Individual' && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            🏢 {contact.company}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                            ${deal.value.toLocaleString()}
                          </span>
                          
                          <select
                            value={deal.stage}
                            onChange={(e) => onUpdateDealStage(deal.id, e.target.value as any)}
                            style={{
                              padding: '2px 4px',
                              fontSize: '0.65rem',
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-glass)',
                              borderRadius: '4px',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="lead">Lead</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal">Proposal</option>
                            <option value="negotiation">Negot.</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  
                  {stageDeals.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '24px 0', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      No deals in stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSubTab === 'contacts' && (
        /* ================= CONTACTS DIRECTORY TAB ================= */
        <div className="glass-panel" style={{ padding: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click any row below to view full contact details, communication notes, and Voice AI call feedback.
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Showing {filteredContacts.length} of {contacts.length} contacts
            </span>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contact Profile</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Company</th>
                  <th>Tags</th>
                  <th>Captured Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    onClick={() => setSelectedContactId(contact.id)}
                    style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                    className="crm-contact-row"
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {contact.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: '600', display: 'inline-flex', alignItems: 'center' }}>
                          {contact.name}
                          {contact.inquiryCount && contact.inquiryCount > 1 && (
                            <span style={{ 
                              fontSize: '0.65rem', 
                              marginLeft: '6px', 
                              padding: '1px 5px', 
                              background: 'rgba(245, 158, 11, 0.15)', 
                              color: '#f59e0b', 
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '4px',
                              fontWeight: 'bold'
                            }}>
                              {contact.inquiryCount}x
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td>{contact.email}</td>
                    <td>{contact.phone}</td>
                    <td>
                      <span style={{ color: contact.company === 'Individual' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {contact.company}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {contact.tags.map((t, idx) => (
                          <span key={idx} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'dropoff' && (
        /* ================= AI DROPOFF ANALYST TAB ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Reason stats and aggregate details */}
          <div className="grid-cols-12" style={{ gap: '20px' }}>
            <div className="col-span-7 glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <BarChart3 size={16} style={{ color: 'var(--primary-color)' }} /> Drop-off Cause Distribution (Platform Average)
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>Pricing Barrier (Too Expensive)</strong>
                    <span style={{ color: 'var(--danger-color)' }}>45% frequency</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '45%', background: 'var(--danger-color)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>Scheduling Conflicts / Weekly Shift Objections</strong>
                    <span style={{ color: '#c084fc' }}>30% frequency</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '30%', background: '#c084fc' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>Missing Features / Special Service Objections</strong>
                    <span style={{ color: 'var(--warning-color)' }}>15% frequency</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '15%', background: 'var(--warning-color)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>Competitor Comparison Objections</strong>
                    <span style={{ color: 'var(--accent-color)' }}>10% frequency</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '10%', background: 'var(--accent-color)' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary Narrative */}
            <div className="col-span-5 glass-panel" style={{ padding: '20px', display: 'flex', gap: '12px', background: 'rgba(99, 102, 241, 0.02)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
              <Brain size={28} style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '4px' }} />
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 6px 0' }}>AI Analyst Insight</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                  "Most conversions fail due to **Pricing Barrier** during teeth whitening inquiries or **Sunday scheduling restrictions** for estate viewings. Connecting a recovery flow webhook to your local **workflow automator** can dispatch custom follow-up promotional codes automatically."
                </p>
              </div>
            </div>
          </div>

          <div className="grid-cols-12" style={{ gap: '20px' }}>
            {/* Lost Deals List */}
            <div className="col-span-5 glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Inactive / Lost Deals</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lostDeals.map((deal) => {
                  const contact = contacts.find(c => c.id === deal.contactId);
                  const isSelected = selectedLostDealId === deal.id;

                  return (
                    <div 
                      key={deal.id} 
                      onClick={() => handleAnalyzeDropoff(deal.id)}
                      className={`glass-card`} 
                      style={{ 
                        padding: '12px', 
                        cursor: 'pointer', 
                        borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-glass)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255,255,255,0.01)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.8rem' }}>{deal.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', fontWeight: 'bold' }}>
                          ${deal.value.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Client: {contact?.name} • Company: {contact?.company}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          Created: {new Date(deal.createdAt).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          Diagnose Drop-off <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {lostDeals.length === 0 && (
                  <div style={{ padding: '30px', textTransform: 'none', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    No lost leads currently. Move a deal card to "Lost" on the pipeline board to analyze!
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostic Report Panel */}
            <div className="col-span-7 glass-panel" style={{ padding: '20px', minHeight: '380px', background: '#0a0d16', display: 'flex', flexDirection: 'column' }}>
              
              {isAnalyzing && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px' }}>
                  <Brain size={36} className="node-running" style={{ color: 'var(--primary-color)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    Reading chat transcripts... Classifying objections... Running RAG diagnostic...
                  </span>
                </div>
              )}

              {!isAnalyzing && analysisReport && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  {/* Report Header */}
                  <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>
                        Conversion Objections Diagnostic: {analysisReport.clientName}
                      </h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Deal value: ${analysisReport.value} • Codebase vector checked
                      </span>
                    </div>
                    <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Brain size={12} /> {analysisReport.cause} ({analysisReport.confidence}% confidence)
                    </span>
                  </div>

                  {/* Dialogue snippet */}
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                      TRANSCRIPT SNIPPET OBJECTION POINTS:
                    </span>
                    <div style={{ background: '#05070c', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-glass)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {analysisReport.transcriptHighlight.map((h, hIdx) => (
                        <div key={hIdx}>
                          <strong style={{ color: 'var(--primary-color)' }}>{h.sender}:</strong>
                          <span style={{ color: '#e2e8f0', marginLeft: '6px' }}>"{h.text}"</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                      AI EXPLANATION REPORT:
                    </span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                      {analysisReport.explanation}
                    </p>
                  </div>

                  {/* Recovery Plan */}
                  <div style={{ background: 'rgba(99,102,241,0.02)', border: '1px solid rgba(99,102,241,0.15)', padding: '12px', borderRadius: '6px' }}>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--primary-color)' }}>AI Suggested Recovery Actions</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3', margin: 0 }}>
                      {analysisReport.recoveryPlan}
                    </p>
                  </div>

                  {/* Recovery Webhook Actions */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                    {webhookStatus === 'success' && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                        <CheckCircle2 size={12} /> Webhook fired successfully to workflow engine gateway
                      </span>
                    )}
                    {webhookStatus === 'firing' && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        Sending HTTP webhook payload...
                      </span>
                    )}
                    {!webhookStatus && (
                      <button 
                        onClick={handleTriggerRecoveryFlow}
                        className="btn btn-primary" 
                        style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Brain size={12} /> Trigger Workflow Recovery Campaign
                      </button>
                    )}
                  </div>

                </div>
              )}

              {!isAnalyzing && !analysisReport && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '40px' }}>
                  <FileText size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <span>Select an inactive/lost deal from the ledger to run the AI drop-off reason diagnostic.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Contact Creation Modal */}
      {formOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '450px', padding: '24px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'Space Grotesk, sans-serif' }}>Log CRM Contact</h3>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="john.doe@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Company / Account Name</label>
                <input type="text" className="form-input" placeholder="e.g. Smile Dental / Individual" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Contact Details slide-out drawer */}
      {selectedContactId && (() => {
        const contact = contacts.find(c => c.id === selectedContactId);
        if (!contact) return null;
        const agentObj = agents.find(a => a.id === contact.assignedAgentId);
        
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '420px',
            height: '100vh',
            background: '#0d111c',
            borderLeft: '1px solid var(--border-glass)',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.6)',
            zIndex: 1100,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'slideIn 0.25s ease-out'
          }}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {contact.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold', color: 'white' }}>{contact.name}</h3>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Created {new Date(contact.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedContactId(null)} 
                className="btn btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                ✕ Close
              </button>
            </div>

            {/* Profile Info */}
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', overflowY: 'auto', maxHeight: '320px', paddingRight: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Name:</label>
                  <input className="form-input" style={{ fontSize: '0.75rem', padding: '6px' }} value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Email:</label>
                  <input className="form-input" style={{ fontSize: '0.75rem', padding: '6px' }} value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Phone:</label>
                  <input className="form-input" style={{ fontSize: '0.75rem', padding: '6px' }} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Company:</label>
                  <input className="form-input" style={{ fontSize: '0.75rem', padding: '6px' }} value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>City:</label>
                  <input className="form-input" style={{ fontSize: '0.75rem', padding: '6px' }} value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Project:</label>
                  <input className="form-input" style={{ fontSize: '0.75rem', padding: '6px' }} value={editProject} onChange={(e) => setEditProject(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assigned Employee:</label>
                  <select className="form-input" style={{ fontSize: '0.75rem', padding: '6px' }} value={editAgentId} onChange={(e) => setEditAgentId(e.target.value)}>
                    <option value="">Unassigned</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.department})</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1 }} onClick={() => handleSaveContactEdit(contact.id)}>Save</button>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1 }} onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>{contact.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>{contact.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Company:</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>{contact.company}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>City:</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>{contact.city || 'Not Specified'}</span>
                </div>
                {tenantId === 't-2' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Real Estate Project:</span>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{contact.project || 'Not Specified'}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Employee:</span>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
                    {agentObj ? `${agentObj.name} (${agentObj.department})` : 'Unassigned'}
                  </span>
                </div>
                <button className="btn btn-secondary" style={{ marginTop: '8px', padding: '6px', fontSize: '0.75rem' }} onClick={() => handleStartEdit(contact)}>
                  ✏️ Edit Profile Info
                </button>
              </div>
            )}

            {/* Tags */}
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>TAGS:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {contact.tags.map((t, idx) => (
                  <span key={idx} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* AI Follow-up Campaign Form */}
            <div style={{
              background: 'rgba(14, 165, 233, 0.03)',
              border: '1px solid rgba(14, 165, 233, 0.15)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }} key={contact.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                <Brain size={16} />
                <span>AI Follow-up Campaign</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                Trigger an automated AI outbound follow-up message to this contact to progress their deal stage based on sentiment analysis.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>CAMPAIGN OBJECTIVE:</label>
                <input 
                  type="text" 
                  value={campaignObjective} 
                  onChange={(e) => setCampaignObjective(e.target.value)}
                  placeholder="e.g. Schedule whitening checkup / confirm property budget"
                  style={{
                    background: '#111827',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '0.75rem',
                    color: 'white',
                    outline: 'none'
                  }}
                  disabled={isCampaignRunning}
                />
              </div>

              <button
                onClick={() => handleRunCampaign(contact.id)}
                className="btn btn-primary"
                style={{
                  fontSize: '0.75rem',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: isCampaignRunning ? 'not-allowed' : 'pointer'
                }}
                disabled={isCampaignRunning || !campaignObjective.trim()}
              >
                {isCampaignRunning ? 'AI Campaign Running...' : 'Run Outbound AI Campaign'}
              </button>

              {campaignLogs.length > 0 && (
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '0.65rem',
                  color: '#10b981',
                  fontFamily: 'monospace',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-glass)'
                }}>
                  {campaignLogs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes & Feedback Logs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                FEEDBACK LOGS & NOTES:
              </span>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {contact.notes.map((note, idx) => {
                  const isCallFeedback = note.startsWith('Call Feedback:') || note.startsWith('Voice Call finished:') || note.includes('Inbound Call') || note.includes('Campaign');
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: '10px', 
                        borderRadius: '6px', 
                        background: isCallFeedback ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255,255,255,0.02)',
                        border: isCallFeedback ? '1px solid rgba(99,102,241,0.2)' : '1px solid var(--border-glass)',
                        fontSize: '0.75rem',
                        lineHeight: '1.3'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isCallFeedback ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.65rem' }}>
                        <span>{isCallFeedback ? '📞 Phone Call Log' : '📝 Note'}</span>
                      </div>
                      <div style={{ color: 'white' }}>{note}</div>
                    </div>
                  );
                })}
                {contact.notes.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    No feedback logs or notes linked to this profile.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .crm-contact-row:hover {
          background: rgba(255,255,255,0.02) !important;
        }
      `}</style>
    </div>
  );
};
