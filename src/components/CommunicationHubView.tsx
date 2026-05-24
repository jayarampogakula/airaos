import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, CheckCircle2, User, Phone, Mail, 
  Building, AlertTriangle, Play, Pause, Plus, Sparkles, Database 
} from 'lucide-react';
import { Conversation, Contact, Agent, ChatMessage } from '../types';

interface CommunicationHubViewProps {
  conversations: Conversation[];
  contacts: Contact[];
  agents: Agent[];
  onAddMessage: (convId: string, text: string, sender: 'customer' | 'ai' | 'human') => void;
  onUpdateConvStatus: (convId: string, status: 'ai_active' | 'human_escalated' | 'closed') => void;
  onAddContactNote: (contactId: string, note: string) => void;
  onAddContactTag: (contactId: string, tag: string) => void;
  tenantId: string;
}

export const CommunicationHubView: React.FC<CommunicationHubViewProps> = ({
  conversations,
  contacts,
  agents,
  onAddMessage,
  onUpdateConvStatus,
  onAddContactNote,
  onAddContactTag,
  tenantId
}) => {
  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatwootUrl, setChatwootUrl] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('coolify_integrations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.chatwootUrl) {
          setChatwootUrl(parsed.chatwootUrl);
        }
      } catch (e) {}
    }
  }, []);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const activeContact = contacts.find(c => c.id === activeConv?.contactId);
  const assignedAgent = agents.find(a => a.id === activeConv?.assignedAgentId);

  // Send message from customer or staff agent
  const handleSend = () => {
    if (!inputText.trim() || !activeConvId) return;
    
    // Send message as 'human' (since we are the Tenant Admin typing in the dashboard)
    // Unless the user explicitly simulates a customer message. Let's make it so if we type, we are the 'human' staff.
    // But wait! To let the user test the AI, let's provide a toggle: "Simulate Customer Chat" vs "Send as Staff"
    // Let's add a neat option in the input bar.
    onAddMessage(activeConvId, inputText, 'human');
    setInputText('');
  };

  // Simulate receiving a message from the customer
  const handleSimulateCustomer = () => {
    if (!inputText.trim() || !activeConvId) return;
    
    onAddMessage(activeConvId, inputText, 'customer');
    const msgText = inputText;
    setInputText('');

    // If AI is active, trigger automated reply
    if (activeConv?.status === 'ai_active') {
      setIsTyping(true);
      setTimeout(() => {
        let reply = '';
        const lower = msgText.toLowerCase();

        if (tenantId === 't-1') {
          // Dental Clinic AI (Sarah)
          if (lower.includes('price') || lower.includes('cost') || lower.includes('cleaning')) {
            reply = 'Our standard teeth cleaning is $120. In-office teeth whitening is $450. Would you like me to book a slot for you?';
          } else if (lower.includes('hour') || lower.includes('open')) {
            reply = 'We are open Monday through Friday from 9:00 AM to 6:00 PM. We are closed on weekends.';
          } else if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('whitening')) {
            reply = 'I can help with that! We have openings tomorrow at 2:30 PM or 4:00 PM. Please confirm if either works, or specify a date!';
          } else {
            reply = `Hi, I am Sarah from Smile Dental Clinic. I am looking up the details for you. How else can I help you today?`;
          }
        } else if (tenantId === 't-2') {
          // Real Estate AI (Marcus)
          if (lower.includes('penthouse') || lower.includes('view') || lower.includes('layout')) {
            reply = 'Penthouses feature 2 & 3 bedroom options, double-height ceilings, and private pools. What is your email address so I can send the floorplans?';
          } else if (lower.includes('price') || lower.includes('how much')) {
            reply = 'Units start at $850,000. Could I get your name and email to send you our pricing spreadsheet?';
          } else {
            reply = 'Hi! Marcus here. I can assist you with booking tours at Apex Heights. What budget or size are you looking for?';
          }
        } else {
          // General AI
          reply = 'I have received your request. Let me look up our knowledge base to solve this support query.';
        }

        onAddMessage(activeConvId, reply, 'ai');
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !activeContact) return;
    onAddContactNote(activeContact.id, noteText);
    setNoteText('');
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim() || !activeContact) return;
    onAddContactTag(activeContact.id, tagInput);
    setTagInput('');
  };

  return (
    <div className="chat-layout animate-fade-in">
      
      {/* Inbox List (Left) */}
      <div className="chat-inbox-list">
        <div className="chat-inbox-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <MessageSquare size={16} /> Unified Inbox
            </h3>
            {chatwootUrl && (
              <a
                href={chatwootUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ 
                  fontSize: '0.7rem', 
                  padding: '3px 8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  textDecoration: 'none',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderColor: '#f59e0b',
                  color: '#f59e0b'
                }}
              >
                <span>💬</span> Live Console
              </a>
            )}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Website, WhatsApp & SMS integrations.
          </span>
        </div>

        <div className="chat-inbox-items">
          {conversations.map((conv) => {
            const contact = contacts.find(c => c.id === conv.contactId);
            const isSelected = conv.id === activeConvId;
            const channelIcons: Record<string, string> = {
              web: '🌐',
              whatsapp: '💬',
              sms: '📱',
              email: '📧',
              instagram: '📸',
              voice: '📞'
            };

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`chat-inbox-item ${isSelected ? 'active' : ''}`}
              >
                <div style={{ fontSize: '1.25rem' }}>{channelIcons[conv.channel] || '💬'}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {contact?.name || 'Unknown Contact'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{conv.lastMessageTime}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.lastMessageText}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                    <span className={`badge ${conv.status === 'ai_active' ? 'badge-primary' : conv.status === 'human_escalated' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                      {conv.status === 'ai_active' ? '🤖 AI Auto' : conv.status === 'human_escalated' ? '⚠️ Staff' : 'Closed'}
                    </span>
                    {conv.unreadCount ? (
                      <span style={{ background: 'var(--primary-color)', color: 'white', fontSize: '0.6rem', padding: '1px 5px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Window (Middle) */}
      <div className="chat-main-window">
        {activeConv ? (
          <>
            {/* Header controls */}
            <div className="chat-main-header">
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  Chat with {activeContact?.name}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span>Channel: <span style={{ textTransform: 'capitalize' }}>{activeConv.channel}</span></span>
                  <span>•</span>
                  <span>Assigned Agent: {assignedAgent?.name || 'None'}</span>
                </div>
              </div>

              {/* Autopilot Toggles */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeConv.status === 'ai_active' ? (
                  <button 
                    onClick={() => onUpdateConvStatus(activeConv.id, 'human_escalated')}
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '6px 12px', borderColor: 'var(--danger-color)', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Pause size={12} /> Pause AI (Escalate)
                  </button>
                ) : (
                  <button 
                    onClick={() => onUpdateConvStatus(activeConv.id, 'ai_active')}
                    className="btn btn-primary" 
                    style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Play size={12} /> Enable AI Autopilot
                  </button>
                )}
                <button 
                  onClick={() => onUpdateConvStatus(activeConv.id, 'closed')}
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  Close Chat
                </button>
              </div>
            </div>

            {/* Conversation Log */}
            <div className="chat-messages-container">
              {activeConv.messages.map((m) => (
                <div key={m.id} className={`chat-message-bubble ${m.sender}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.65rem', opacity: 0.7 }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {m.sender === 'customer' ? activeContact?.name : m.sender === 'ai' ? `🤖 AiraOS (${assignedAgent?.name})` : '🧑‍💼 Staff Agent'}
                    </span>
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div>{m.text}</div>
                </div>
              ))}
              
              {isTyping && (
                <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', fontFamily: 'monospace' }}>
                  <Sparkles size={12} className="node-running" style={{ color: 'var(--primary-color)' }} />
                  <span>AI Agent {assignedAgent?.name} is thinking...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="chat-input-bar">
              <input
                type="text"
                className="form-input"
                placeholder="Type response details here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} className="btn btn-secondary" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                Reply as Staff
              </button>
              <button 
                onClick={handleSimulateCustomer} 
                className="btn btn-primary" 
                style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Send this message simulating the customer to test how the AI autopilot answers."
              >
                <Sparkles size={12} /> Simulate Customer Chat
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
            <MessageSquare size={48} style={{ marginBottom: '12px' }} />
            <span>Select a conversation from the sidebar to start chatting.</span>
          </div>
        )}
      </div>

      {/* Customer Profile Card (Right) */}
      <div className="chat-profile-sidebar">
        {activeContact ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
              <div 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: 'var(--primary-glow)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1.8rem', 
                  color: 'var(--primary-color)',
                  border: '2px solid var(--border-glass)',
                  marginBottom: '10px'
                }}
              >
                {activeContact.name.charAt(0)}
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{activeContact.name}</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{activeContact.company}</span>
            </div>

            {/* Contact Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <Phone size={12} />
                <span>{activeContact.phone}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <Mail size={12} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeContact.email}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <Building size={12} />
                <span>{activeContact.company}</span>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-glass)' }} />

            {/* Tags section */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {activeContact.tags.map((t, i) => (
                  <span key={i} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{t}</span>
                ))}
              </div>
              <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+ Tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                />
              </form>
            </div>

            <div style={{ height: '1px', background: 'var(--border-glass)' }} />

            {/* Internal Notes */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Internal Notes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto', marginBottom: '10px' }}>
                {activeContact.notes.map((n, i) => (
                  <div key={i} style={{ padding: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                    {n}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add secret staff note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  style={{ padding: '6px', fontSize: '0.75rem' }}
                />
              </form>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No contact profile linked.</div>
        )}
      </div>

    </div>
  );
};
