import React, { useEffect, useState } from 'react';
import {
  Building,
  Mail,
  MessageSquare,
  Pause,
  Phone,
  Play,
  Search,
  Sparkles,
  Tag,
  UserCheck
} from 'lucide-react';
import { Agent, ChatMessage, Contact, Conversation } from '../types';
import { useAuth } from '../auth/AuthProvider';

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
  const { apiFetch } = useAuth();
  const [liveConversations, setLiveConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  const loadInbox = async () => {
    setIsLoadingInbox(true);
    const params = new URLSearchParams();
    params.set('status', 'all');
    if (searchText.trim()) params.set('q', searchText.trim());
    if (channelFilter !== 'all') params.set('channel', channelFilter);

    try {
      const res = await apiFetch(`/api/current-tenant/conversations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLiveConversations(data);
        if (!activeConvId && data[0]) setActiveConvId(data[0].id);
      }
    } catch {
      setLiveConversations([]);
    } finally {
      setIsLoadingInbox(false);
    }
  };

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 8000);
    return () => clearInterval(interval);
  }, [tenantId, searchText, channelFilter]);


  const visibleConversations = liveConversations.length ? liveConversations : conversations;

  useEffect(() => {
    if (!activeConvId && visibleConversations[0]) {
      setActiveConvId(visibleConversations[0].id);
    }
  }, [visibleConversations, activeConvId]);

  const activeConv = visibleConversations.find((conversation) => conversation.id === activeConvId);
  const activeContact = contacts.find((contact) => contact.id === activeConv?.contactId) || (activeConv?.contact as Contact | undefined);
  const assignedAgent = agents.find((agent) => agent.id === activeConv?.assignedAgentId);

  const postConversationMessage = async (content: string, privateNote = false, sender: ChatMessage['sender'] = 'human') => {
    if (!activeConv) return;
    await apiFetch(`/api/current-tenant/conversations/${activeConv.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        private: privateNote,
        messageType: sender === 'customer' ? 'incoming' : 'outgoing',
        sender,
        allowLocalFallback: true
      })
    });
    loadInbox();
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeConvId) return;
    const text = inputText.trim();
    onAddMessage(activeConvId, text, 'human');
    postConversationMessage(text).catch(() => {});
    setInputText('');
  };

  const handleSimulateCustomer = () => {
    if (!inputText.trim() || !activeConvId) return;
    const msgText = inputText.trim();
    onAddMessage(activeConvId, msgText, 'customer');
    postConversationMessage(msgText, false, 'customer').catch(() => {});
    setInputText('');

    if (activeConv?.status === 'ai_active') {
      setIsTyping(true);
      setTimeout(() => {
        const lower = msgText.toLowerCase();
        let reply = 'I have received your request. Let me look up the details for you.';
        if (tenantId === 't-1' && (lower.includes('price') || lower.includes('cleaning'))) {
          reply = 'Our standard teeth cleaning is $120. Would you like me to book a slot for you?';
        } else if (tenantId === 't-2' && (lower.includes('price') || lower.includes('tour'))) {
          reply = 'I can help with property pricing and site visits. What budget and area are you considering?';
        }
        onAddMessage(activeConvId, reply, 'ai');
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleAddNote = (event: React.FormEvent) => {
    event.preventDefault();
    if (!noteText.trim() || !activeContact) return;
    const text = noteText.trim();
    onAddContactNote(activeContact.id, text);
    postConversationMessage(text, true, 'note').catch(() => {});
    setNoteText('');
  };

  const handleAddTag = (event: React.FormEvent) => {
    event.preventDefault();
    if (!tagInput.trim() || !activeContact || !activeConv) return;
    const label = tagInput.trim();
    const labels = Array.from(new Set([...(activeConv.labels || []), label]));
    onAddContactTag(activeContact.id, label);
    apiFetch(`/api/current-tenant/conversations/${activeConv.id}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labels, allowLocalFallback: true })
    }).then(() => loadInbox()).catch(() => {});
    setTagInput('');
  };

  const handleAssignConversation = (agentId: string) => {
    if (!activeConv) return;
    apiFetch(`/api/current-tenant/conversations/${activeConv.id}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeId: agentId, allowLocalFallback: true })
    }).then(() => {
      setLiveConversations((prev) => prev.map((conversation) => (
        conversation.id === activeConv.id ? { ...conversation, assignedAgentId: agentId, status: 'human_escalated' } : conversation
      )));
      onUpdateConvStatus(activeConv.id, 'human_escalated');
    }).catch(() => {});
  };

  const handleUpdateStatus = (status: Conversation['status']) => {
    if (!activeConv) return;
    setLiveConversations((prev) => prev.map((conversation) => (
      conversation.id === activeConv.id ? { ...conversation, status } : conversation
    )));
    onUpdateConvStatus(activeConv.id, status);
  };


  const channelIcons: Record<string, string> = {
    web: 'Web',
    website: 'Web',
    whatsapp: 'WA',
    sms: 'SMS',
    email: 'Mail',
    gmail: 'Gmail',
    outlook: 'Outlook',
    smtp: 'SMTP',
    telegram: 'TG',
    instagram: 'IG',
    facebook: 'FB',
    voice: 'Call'
  };

  return (
    <div className="chat-layout animate-fade-in">
      <div className="chat-inbox-list">
        <div className="chat-inbox-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <MessageSquare size={16} /> Unified Inbox
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: '9px', top: '8px', color: 'var(--text-muted)' }} />
              <input className="form-input" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search conversations" style={{ padding: '6px 8px 6px 28px', fontSize: '0.72rem' }} />
            </div>
            <select className="form-input" value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} style={{ width: '118px', padding: '6px 8px', fontSize: '0.72rem' }}>
              <option value="all">All</option>
              <option value="website">Website</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {isLoadingInbox ? 'Loading inbox...' : 'Local unified inbox.'}
          </span>
        </div>

        <div className="chat-inbox-items">
          {visibleConversations.map((conv) => {
            const contact = contacts.find((item) => item.id === conv.contactId);
            const isSelected = conv.id === activeConvId;
            return (
              <div key={conv.id} onClick={() => setActiveConvId(conv.id)} className={`chat-inbox-item ${isSelected ? 'active' : ''}`}>
                <div style={{ fontSize: '0.68rem', width: '38px', fontWeight: 700, color: 'var(--primary-color)' }}>{channelIcons[conv.channel] || 'Chat'}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{contact?.name || 'Unknown Contact'}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{conv.lastMessageTime}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMessageText}</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge ${conv.status === 'ai_active' ? 'badge-primary' : conv.status === 'human_escalated' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                      {conv.status === 'ai_active' ? 'AI Auto' : conv.status === 'human_escalated' ? 'Staff' : 'Closed'}
                    </span>
                    {(conv.labels || []).slice(0, 2).map((label) => (
                      <span key={label} className="badge badge-cyan" style={{ fontSize: '0.58rem', padding: '1px 5px' }}>{label}</span>
                    ))}
                    {!!conv.unreadCount && (
                      <span style={{ background: 'var(--primary-color)', color: 'white', fontSize: '0.6rem', padding: '1px 5px', borderRadius: '10px', fontWeight: 'bold' }}>{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chat-main-window">
        {activeConv ? (
          <>
            <div className="chat-main-header">
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Chat with {activeContact?.name || 'Unknown Contact'}</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span>Channel: <span style={{ textTransform: 'capitalize' }}>{activeConv.channel}</span></span>
                  <span>Assigned Agent: {assignedAgent?.name || 'None'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeConv.status === 'ai_active' ? (
                  <button onClick={() => handleUpdateStatus('human_escalated')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px', borderColor: 'var(--danger-color)', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Pause size={12} /> Pause AI
                  </button>
                ) : (
                  <button onClick={() => handleUpdateStatus('ai_active')} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Play size={12} /> Enable AI
                  </button>
                )}
                <button onClick={() => handleUpdateStatus('closed')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>Close Chat</button>
              </div>

            </div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.75rem' }}>
              <UserCheck size={14} style={{ color: 'var(--text-secondary)' }} />
              <select className="form-input" value={activeConv.assignedAgentId || ''} onChange={(event) => handleAssignConversation(event.target.value)} style={{ maxWidth: '220px', padding: '6px 8px', fontSize: '0.75rem' }}>
                <option value="">Unassigned</option>
                {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
              </select>
              {(activeConv.labels || []).map((label) => (
                <span key={label} className="badge badge-cyan" style={{ fontSize: '0.65rem', display: 'inline-flex', gap: '4px', alignItems: 'center' }}><Tag size={10} /> {label}</span>
              ))}
            </div>

            <div className="chat-messages-container">
              {activeConv.messages.map((message) => (
                <div key={message.id} className={`chat-message-bubble ${message.private ? 'ai' : message.sender}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.65rem', opacity: 0.7 }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {message.sender === 'customer' ? activeContact?.name : message.sender === 'ai' ? `AiraOS (${assignedAgent?.name || 'AI'})` : message.private || message.sender === 'note' ? 'Private Note' : 'Staff Agent'}
                    </span>
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div>{message.text}</div>
                </div>
              ))}
              {isTyping && (
                <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', fontFamily: 'monospace' }}>
                  <Sparkles size={12} className="node-running" style={{ color: 'var(--primary-color)' }} />
                  <span>AI Agent {assignedAgent?.name} is thinking...</span>
                </div>
              )}
            </div>

            <div className="chat-input-bar">
              <input type="text" className="form-input" placeholder="Type response details here..." value={inputText} onChange={(event) => setInputText(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleSend()} />
              <button onClick={handleSend} className="btn btn-secondary" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Reply as Staff</button>
              <button onClick={handleSimulateCustomer} className="btn btn-primary" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> Simulate Customer
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

      <div className="chat-profile-sidebar">
        {activeContact ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'var(--primary-color)', border: '2px solid var(--border-glass)', marginBottom: '10px' }}>
                {activeContact.name.charAt(0)}
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{activeContact.name}</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{activeContact.company}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}><Phone size={12} /><span>{activeContact.phone}</span></div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}><Mail size={12} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeContact.email}</span></div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}><Building size={12} /><span>{activeContact.company}</span></div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-glass)' }} />

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {[...(activeContact.tags || []), ...(activeConv?.labels || [])].filter((tag, index, all) => all.indexOf(tag) === index).map((tag) => (
                  <span key={tag} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{tag}</span>
                ))}
              </div>
              <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '6px' }}>
                <input type="text" className="form-input" placeholder="+ Label" value={tagInput} onChange={(event) => setTagInput(event.target.value)} style={{ padding: '4px 8px', fontSize: '0.7rem' }} />
              </form>
            </div>

            <div style={{ height: '1px', background: 'var(--border-glass)' }} />

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Internal Notes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto', marginBottom: '10px' }}>
                {(activeContact.notes || []).map((note, index) => (
                  <div key={index} style={{ padding: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>{note}</div>
                ))}
              </div>
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '6px' }}>
                <input type="text" className="form-input" placeholder="Add private staff note..." value={noteText} onChange={(event) => setNoteText(event.target.value)} style={{ padding: '6px', fontSize: '0.75rem' }} />
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
