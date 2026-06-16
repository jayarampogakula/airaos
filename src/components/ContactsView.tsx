import React, { useState } from 'react';
import {
  Users, Search, Filter, Plus, Mail, Phone, Building, Tag,
  Calendar, DollarSign, UserCheck, MessageSquare, AlertCircle,
  TrendingUp, Sparkles, ChevronRight, X, User, ArrowUpRight,
  TrendingDown, Check, Trash2, Clock
} from 'lucide-react';
import { Contact, Deal, Conversation, Appointment, Agent } from '../types';
import { CustomerTimelineView } from './CustomerTimelineView';

interface ContactsViewProps {
  contacts: Contact[];
  deals: Deal[];
  conversations: Conversation[];
  appointments: Appointment[];
  agents: Agent[];
  onAddContact: (contact: Contact) => void;
  onUpdateContact: (contact: Contact) => void;
  onAddContactNote: (contactId: string, note: string) => void;
  onAddContactTag: (contactId: string, tag: string) => void;
  tenantId: string;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  deals,
  conversations,
  appointments,
  agents,
  onAddContact,
  onUpdateContact,
  onAddContactNote,
  onAddContactTag,
  tenantId
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  
  // Drawer & Panel state
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'notes' | 'info'>('timeline');
  const [newNoteText, setNewNoteText] = useState('');
  const [newTagText, setNewTagText] = useState('');
  
  // Add Contact Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactCompany, setNewContactCompany] = useState('');
  const [newContactSource, setNewContactSource] = useState<string>('website_chat');
  const [newContactScore, setNewContactScore] = useState<number>(30);
  const [newContactAgent, setNewContactAgent] = useState<string>('');

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  // Derived arrays
  const contactDeals = selectedContact ? deals.filter(d => d.contactId === selectedContact.id) : [];
  const contactConvs = selectedContact ? conversations.filter(c => c.contactId === selectedContact.id) : [];
  const contactAppts = selectedContact ? appointments.filter(a => a.contactId === selectedContact.id) : [];

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.phone && contact.phone.includes(searchTerm)) ||
      (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = 
      selectedCategory === 'all' || 
      contact.leadCategory === selectedCategory;

    const matchesSource = 
      selectedSource === 'all' || 
      contact.source === selectedSource;

    const matchesAgent = 
      selectedAgent === 'all' || 
      contact.assignedAgentId === selectedAgent;

    return matchesSearch && matchesCategory && matchesSource && matchesAgent;
  });

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-slate-400';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-sky-400';
    if (score >= 30) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score?: number) => {
    if (!score) return 'rgba(148, 163, 184, 0.1)';
    if (score >= 80) return 'rgba(52, 211, 153, 0.1)';
    if (score >= 50) return 'rgba(56, 189, 248, 0.1)';
    if (score >= 30) return 'rgba(251, 191, 36, 0.1)';
    return 'rgba(251, 113, 133, 0.1)';
  };

  const getScoreBorder = (score?: number) => {
    if (!score) return '1px solid rgba(148, 163, 184, 0.2)';
    if (score >= 80) return '1px solid rgba(52, 211, 153, 0.3)';
    if (score >= 50) return '1px solid rgba(56, 189, 248, 0.3)';
    if (score >= 30) return '1px solid rgba(251, 191, 36, 0.3)';
    return '1px solid rgba(251, 113, 133, 0.3)';
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName) return;

    const newContact: Contact = {
      id: `c-${Date.now()}`,
      tenantId,
      name: newContactName,
      email: newContactEmail,
      phone: newContactPhone,
      company: newContactCompany,
      tags: [],
      notes: [],
      createdAt: new Date().toISOString(),
      leadScore: Number(newContactScore),
      leadCategory: Number(newContactScore) >= 80 ? 'sales_ready' : Number(newContactScore) >= 50 ? 'hot' : Number(newContactScore) >= 30 ? 'warm' : 'cold',
      source: newContactSource as any,
      assignedAgentId: newContactAgent || undefined
    };

    onAddContact(newContact);
    setIsAddModalOpen(false);
    
    // Clear forms
    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    setNewContactCompany('');
    setNewContactSource('website_chat');
    setNewContactScore(30);
    setNewContactAgent('');
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId || !newNoteText.trim()) return;
    onAddContactNote(selectedContactId, newNoteText.trim());
    setNewNoteText('');
  };

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId || !newTagText.trim()) return;
    onAddContactTag(selectedContactId, newTagText.trim());
    setNewTagText('');
  };

  const handleAgentChange = (agentId: string) => {
    if (!selectedContact) return;
    const updatedContact = {
      ...selectedContact,
      assignedAgentId: agentId === 'none' ? undefined : agentId
    };
    onUpdateContact(updatedContact);
  };

  const handleCategoryChange = (cat: string) => {
    if (!selectedContact) return;
    const updatedContact = {
      ...selectedContact,
      leadCategory: cat as any
    };
    onUpdateContact(updatedContact);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', gap: '20px', position: 'relative' }}>
      
      {/* Main Database view */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Header / Action Bar */}
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} style={{ color: 'var(--primary-color)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>All Contacts</h2>
              <span style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                {filteredContacts.length} contacts
              </span>
            </div>
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Add Contact
            </button>
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search contacts by name, email, company..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* Category Filter */}
            <div style={{ width: '160px', position: 'relative' }}>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="form-input"
                style={{ appearance: 'none' }}
              >
                <option value="all">All Levels</option>
                <option value="sales_ready">Sales Ready (Hot)</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>

            {/* Source Filter */}
            <div style={{ width: '160px', position: 'relative' }}>
              <select
                value={selectedSource}
                onChange={e => setSelectedSource(e.target.value)}
                className="form-input"
                style={{ appearance: 'none' }}
              >
                <option value="all">All Sources</option>
                <option value="facebook_lead_ads">Facebook Ads</option>
                <option value="website_chat">Website Chat</option>
                <option value="website_form">Website Form</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="voice_call">Voice Call</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {/* Agent Filter */}
            <div style={{ width: '160px', position: 'relative' }}>
              <select
                value={selectedAgent}
                onChange={e => setSelectedAgent(e.target.value)}
                className="form-input"
                style={{ appearance: 'none' }}
              >
                <option value="all">All Agents</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Database Table Container */}
        <div className="glass-panel" style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)' }}>
                <th style={{ padding: '14px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Contact Name</th>
                <th style={{ padding: '14px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Company</th>
                <th style={{ padding: '14px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Contact Info</th>
                <th style={{ padding: '14px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Lead Source</th>
                <th style={{ padding: '14px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Lead Score</th>
                <th style={{ padding: '14px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Assigned Agent</th>
                <th style={{ padding: '14px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={32} style={{ color: 'var(--text-muted)' }} />
                      <span>No contacts found matching criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map(contact => {
                  const isSelected = contact.id === selectedContactId;
                  const assignedAgent = agents.find(a => a.id === contact.assignedAgentId);
                  
                  return (
                    <tr
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                      className="hover-gati-palette-item-loop"
                      style={{
                        borderBottom: '1px solid var(--border-glass)',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(56, 189, 248, 0.04)' : 'transparent',
                        borderColor: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'var(--border-glass)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
                            display: 'flex', alignItems: 'center', color: 'var(--text-primary)',
                            fontSize: '0.8rem', fontWeight: '600', justifyContent: 'center'
                          }}>
                            {contact.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{contact.name}</div>
                            <span style={{
                              fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px',
                              background: getScoreBg(contact.leadScore),
                              color: getScoreColor(contact.leadScore) === 'text-slate-400' ? '#94a3b8' : `var(--${getScoreColor(contact.leadScore).split('-')[1]}-color)`,
                              border: getScoreBorder(contact.leadScore)
                            }}>
                              {contact.leadCategory ? contact.leadCategory.replace('_', ' ').toUpperCase() : 'COLD'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {contact.company || <span style={{ color: 'var(--text-muted)' }}>None</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}><Mail size={10} style={{ display: 'inline', marginRight: '4px' }} />{contact.email || '—'}</span>
                          <span style={{ color: 'var(--text-muted)' }}><Phone size={10} style={{ display: 'inline', marginRight: '4px' }} />{contact.phone || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-secondary)'
                        }}>
                          {contact.source ? contact.source.replace('_', ' ') : 'organic'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={getScoreColor(contact.leadScore)} style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                            {contact.leadScore || 0}
                          </span>
                          <div style={{ flex: 1, minWidth: '40px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                            <div style={{
                              width: `${contact.leadScore || 0}%`, height: '100%', borderRadius: '2px',
                              background: contact.leadScore && contact.leadScore >= 80 ? 'var(--emerald-color)' : contact.leadScore && contact.leadScore >= 50 ? 'var(--sky-color)' : contact.leadScore && contact.leadScore >= 30 ? 'var(--warning-color)' : 'var(--danger-color)'
                            }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {assignedAgent ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <img src={assignedAgent.avatar} alt={assignedAgent.name} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{assignedAgent.name}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(contact.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Drawer Panel (Slide out on contact click) */}
      {selectedContact && (
        <div className="glass-panel" style={{
          width: '450px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          
          {/* Drawer Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                fontSize: '1.1rem', fontWeight: '700'
              }}>
                {selectedContact.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 4px 0' }}>{selectedContact.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedContact.company || 'Individual Lead'}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedContactId(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Stats Panel */}
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-glass)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="glass-card" style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={16} className={getScoreColor(selectedContact.leadScore)} />
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Lead Score</div>
                <div style={{ fontSize: '1rem', fontWeight: '700' }} className={getScoreColor(selectedContact.leadScore)}>{selectedContact.leadScore || 0}/100</div>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={16} style={{ color: 'var(--primary-color)' }} />
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Assignee</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {agents.find(a => a.id === selectedContact.assignedAgentId)?.name || 'Unassigned'}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-tab selection */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)' }}>
            <button
              onClick={() => setActiveSubTab('timeline')}
              style={{
                flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: activeSubTab === 'timeline' ? '2px solid var(--primary-color)' : 'none',
                color: activeSubTab === 'timeline' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeSubTab === 'timeline' ? '600' : '500', fontSize: '0.8rem', cursor: 'pointer'
              }}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveSubTab('notes')}
              style={{
                flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: activeSubTab === 'notes' ? '2px solid var(--primary-color)' : 'none',
                color: activeSubTab === 'notes' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeSubTab === 'notes' ? '600' : '500', fontSize: '0.8rem', cursor: 'pointer'
              }}
            >
              Notes ({selectedContact.notes?.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab('info')}
              style={{
                flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: activeSubTab === 'info' ? '2px solid var(--primary-color)' : 'none',
                color: activeSubTab === 'info' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeSubTab === 'info' ? '600' : '500', fontSize: '0.8rem', cursor: 'pointer'
              }}
            >
              Info & Edit
            </button>
          </div>

          {/* Sub-tab Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            
            {/* TIMELINE SUBTAB */}
            {activeSubTab === 'timeline' && (
              <div style={{ margin: '-16px' }}>
                <CustomerTimelineView
                  isEmbedded={true}
                  contactId={selectedContact.id}
                  contactName={selectedContact.name}
                />
              </div>
            )}

            {/* NOTES SUBTAB */}
            {activeSubTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                {/* Note entry Form */}
                <form onSubmit={handleNoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    placeholder="Write a contact note..."
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    className="form-input"
                    rows={3}
                    style={{ fontSize: '0.8rem', resize: 'none' }}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ alignSelf: 'flex-end', fontSize: '0.75rem', padding: '6px 12px' }}>
                    Add Note
                  </button>
                </form>

                {/* Notes List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(!selectedContact.notes || selectedContact.notes.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No notes yet. Add one above.
                    </div>
                  ) : (
                    selectedContact.notes.map((note, idx) => (
                      <div key={idx} className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{note}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={10} /> Note #{idx + 1}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* INFO & EDIT SUBTAB */}
            {activeSubTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Contact info list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Lead Metrics</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Lead Level Category:</span>
                      <select
                        value={selectedContact.leadCategory || 'cold'}
                        onChange={e => handleCategoryChange(e.target.value)}
                        className="form-input"
                        style={{ width: '150px', padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <option value="sales_ready">Sales Ready</option>
                        <option value="hot">Hot</option>
                        <option value="warm">Warm</option>
                        <option value="cold">Cold</option>
                      </select>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Assigned Agent:</span>
                      <select
                        value={selectedContact.assignedAgentId || 'none'}
                        onChange={e => handleAgentChange(e.target.value)}
                        className="form-input"
                        style={{ width: '150px', padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <option value="none">Unassigned</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tag management */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tags</h4>
                  
                  {/* Tag adding Form */}
                  <form onSubmit={handleTagSubmit} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Add tag (e.g. Dental)..."
                      value={newTagText}
                      onChange={e => setNewTagText(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                    />
                    <button type="submit" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px' }}>
                      Add
                    </button>
                  </form>

                  {/* Tag Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(!selectedContact.tags || selectedContact.tags.length === 0) ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No tags assigned</span>
                    ) : (
                      selectedContact.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', color: 'var(--primary-color)'
                        }}>
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Deals / Pipeline linkages */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Pipeline Deals</h4>
                  {contactDeals.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No active deals linked to this contact.</span>
                  ) : (
                    contactDeals.map(deal => (
                      <div key={deal.id} className="glass-card" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>{deal.name}</div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stage: {deal.stage}</span>
                        </div>
                        <div style={{ fontWeight: '700', color: 'var(--primary-color)', fontSize: '0.9rem' }}>
                          ${deal.value.toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Contact Modal Backdrop */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 15, 30, 0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{
            width: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} style={{ color: 'var(--primary-color)' }} /> Deploy New Contact
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. john@company.com"
                    value={newContactEmail}
                    onChange={e => setNewContactEmail(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +12345678"
                    value={newContactPhone}
                    onChange={e => setNewContactPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={newContactCompany}
                  onChange={e => setNewContactCompany(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Lead Source</label>
                  <select
                    value={newContactSource}
                    onChange={e => setNewContactSource(e.target.value)}
                    className="form-input"
                  >
                    <option value="website_chat">Website Chat</option>
                    <option value="website_form">Website Form</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="facebook_lead_ads">Facebook Ads</option>
                    <option value="voice_call">Voice Call</option>
                    <option value="manual">Manual Entry</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Lead Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newContactScore}
                    onChange={e => setNewContactScore(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assign AI Agent</label>
                <select
                  value={newContactAgent}
                  onChange={e => setNewContactAgent(e.target.value)}
                  className="form-input"
                >
                  <option value="">Unassigned</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.department})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
