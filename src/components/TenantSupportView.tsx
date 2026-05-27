import React, { useState, useRef, useEffect } from 'react';
import { Send, LifeBuoy, Bot, User, CornerDownLeft } from 'lucide-react';
import { Tenant } from '../types';
import { useAuth } from '../auth/AuthProvider';

interface TenantSupportViewProps {
  tenant: Tenant;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const TenantSupportView: React.FC<TenantSupportViewProps> = ({ tenant }) => {
  const { apiFetch } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Hello! I am the AiraOS Platform Assistant. How can I help you integrate Twilio, configure BYO carrier, or understand our packages and rates today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "How do I set up Twilio calling?",
    "How does the visual workflow designer work?",
    "What are the rates for the Scale Plan?",
    "How to configure BYO Carrier SIP trunking?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          agentId: 'platform-support',
          tenantId: tenant.id,
          history: messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          sender: 'ai',
          text: data.reply || "I'm sorry, I couldn't process that query. Please verify your connection or try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('API request failed');
      }
    } catch (e) {
      const errorMessage: Message = {
        sender: 'ai',
        text: 'Connection error. The support gateway appears to be offline. Please verify network access.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '16px' }}>
      <div className="view-header">
        <div>
          <h2 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LifeBuoy size={22} style={{ color: 'var(--primary-color)' }} /> Help & Support Console
          </h2>
          <p className="view-subtitle">Instant guidance on integrations, visual workflow configurations, billing plans, and SIP gateway channels.</p>
        </div>
      </div>

      <div className="grid-cols-12" style={{ flex: 1, minHeight: 0 }}>
        {/* Chat Area */}
        <div className="col-span-8 glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: 0 }}>
          
          {/* Top Panel Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', border: '1px solid var(--primary-color)', fontSize: '1rem', justifyContent: 'center' }}>
              🤖
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>AiraOS Assistant</div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> Live Support Online
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  flexDirection: m.sender === 'user' ? 'row-reverse' : 'row',
                  maxWidth: '75%'
                }}
              >
                {/* Avatar */}
                <div style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  background: m.sender === 'user' ? 'var(--accent-glow)' : 'var(--primary-glow)',
                  border: `1px solid ${m.sender === 'user' ? 'var(--accent-color)' : 'var(--primary-color)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: 'white',
                  flexShrink: 0
                }}>
                  {m.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                </div>

                {/* Bubble */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div 
                    style={{ 
                      padding: '10px 14px', 
                      borderRadius: '12px', 
                      background: m.sender === 'user' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${m.sender === 'user' ? 'rgba(14, 165, 233, 0.25)' : 'var(--border-glass)'}`,
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      lineHeight: '1.4',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {m.text}
                  </div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-glow)', border: '1px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>
                  <Bot size={12} />
                </div>
                <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '12px' }}>
                  <div className="typing-dots" style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ width: '5px', height: '5px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'typingDot 1.4s infinite both' }}></span>
                    <span style={{ width: '5px', height: '5px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'typingDot 1.4s infinite both', animationDelay: '0.2s' }}></span>
                    <span style={{ width: '5px', height: '5px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'typingDot 1.4s infinite both', animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ask support about twilio hooks, visual design settings..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                disabled={isTyping}
                style={{ paddingRight: '40px' }}
              />
              <button 
                onClick={() => handleSendMessage(inputValue)}
                className="btn btn-primary"
                disabled={!inputValue.trim() || isTyping}
                style={{ 
                  position: 'absolute', 
                  right: '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  padding: '6px',
                  borderRadius: '6px',
                  background: inputValue.trim() ? 'var(--primary-color)' : 'transparent',
                  border: 'none',
                  color: inputValue.trim() ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 'auto'
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>

        </div>

        {/* Quick Help Guide */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
          
          {/* Quick Questions Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Suggested Queries</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quickQuestions.map((q, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="btn"
                  disabled={isTyping}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '10px 14px',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Quick References Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary)' }}>Developer Docs</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 12px 0' }}>
              AiraOS integrates voice agents using client-side Speech-to-Text (STT) and text-to-speech (TTS) interfaces, alongside a Visual Workflow automation pipeline.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Webhook endpoint format:<br/>
              <code style={{ display: 'block', padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', marginTop: '4px', fontSize: '0.7rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                {`https://${tenant.slug}.airaos.com/api/voice/inbound`}
              </code>
            </div>
          </div>

        </div>
      </div>
      <style>{`
        @keyframes typingDot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};
