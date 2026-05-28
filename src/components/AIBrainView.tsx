import React, { useState } from 'react';
import { Brain, Sliders, ShieldCheck, PlayCircle, Sparkles, Send, Database } from 'lucide-react';
import { Tenant } from '../types';

interface AIBrainViewProps {
  tenant: Tenant;
}

export const AIBrainView: React.FC<AIBrainViewProps> = ({ tenant }) => {
  const [provider, setProvider] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.4);
  const [maxTokens, setMaxTokens] = useState(1500);
  const [guardrails, setGuardrails] = useState({
    pii: true,
    injection: true,
    grounding: true,
    moderation: false,
  });

  const dentalPrompt = `You are Sarah, the AI Dental Receptionist for Smile Dental Clinic. Your main job is to answer patients FAQs about clinical procedures, working hours (Mon-Fri 9AM-6PM), pricing, and book, reschedule, or cancel dental appointments.\n\nKeep answers polite, professional, and relatively short. Always confirm details (name, phone number, date/time) before scheduling a dentist slot in the Calendar Scheduler.\n\nIf the patient describes severe bleeding, excruciating pain, or other major emergencies, flag that you are transferring them to a human receptionist immediately.`;

  const realEstatePrompt = `You are Marcus, the AI Sales Agent for Apex Heights Real Estate. Your goal is to capture customer contact details, qualify their property needs (budget, location, bedrooms), explain property layouts, and book viewing appointments.\n\nNever give out exact unit prices before capturing name and email. Once captured, book a calendar slot for a private tour with our human agents.`;

  const supportPrompt = `You are Chloe, the AI Customer Support Agent for ByteTech Software Solutions. You diagnose user bugs, search the knowledge base for instructions, explain troubleshooting steps, and create support tickets in the CRM when issues are unresolved.\n\nAsk troubleshooting questions one by one. If unresolved, create a support ticket and assure the user that developers are looking into it.`;

  const defaultPrompt = tenant.id === 't-1' ? dentalPrompt : tenant.id === 't-2' ? realEstatePrompt : supportPrompt;

  const [systemPrompt, setSystemPrompt] = useState(defaultPrompt);
  const [playgroundInput, setPlaygroundInput] = useState('');
  
  interface PlaygroundMessage {
    role: 'user' | 'assistant';
    text: string;
    reasoning?: string;
  }
  
  const [playgroundHistory, setPlaygroundHistory] = useState<PlaygroundMessage[]>([
    { role: 'assistant', text: `Hi there! I am connected to the current GatiDesk AI Brain. Test my reasoning and grounding by asking questions.` }
  ]);
  const [isQuerying, setIsQuerying] = useState(false);

  const handlePlaygroundSend = () => {
    if (!playgroundInput.trim()) return;

    const userText = playgroundInput;
    setPlaygroundHistory(prev => [...prev, { role: 'user', text: userText }]);
    setPlaygroundInput('');
    setIsQuerying(true);

    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userText,
        history: playgroundHistory.map(m => ({ sender: m.role, text: m.text })),
        tenantId: tenant.id
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch chat response');
        return res.json();
      })
      .then(data => {
        setPlaygroundHistory(prev => [...prev, { 
          role: 'assistant', 
          text: data.text,
          reasoning: data.reasoning 
        }]);
        setIsQuerying(false);
      })
      .catch(err => {
        console.error(err);
        setPlaygroundHistory(prev => [...prev, { 
          role: 'assistant', 
          text: 'Error: Could not connect to the local AI Brain backend. Make sure the backend server is running.',
          reasoning: 'Connection to backend failed.' 
        }]);
        setIsQuerying(false);
      });
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <div className="view-header">
        <div>
          <h2 className="view-title">AI Brain Settings</h2>
          <p className="view-subtitle">Powered by Dify. Configure LLM orchestration, model weights, safety guardrails, and prompts.</p>
        </div>
      </div>

      <div className="grid-cols-12" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Settings Panel */}
        <div className="col-span-6 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', height: '100%' }}>
          
          {/* Section 1: LLM Routing */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--text-primary)' }}>
              <Sliders size={16} style={{ color: 'var(--primary-color)' }} /> LLM Model Routing
            </h3>
            
            <div className="grid-cols-12">
              <div className="col-span-6 form-group">
                <label className="form-label">Active Provider Model</label>
                <select 
                  className="form-input" 
                  value={provider} 
                  onChange={(e) => setProvider(e.target.value)}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}
                >
                  <option value="gpt-4o">OpenAI GPT-4o (Recommended)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gemini-1-5-pro">Gemini 1.5 Pro</option>
                  <option value="llama3-ollama">Ollama (Llama 3 8B Local)</option>
                </select>
              </div>

              <div className="col-span-6 form-group">
                <label className="form-label">Max Token Length</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={maxTokens} 
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))} 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label">Temperature: {temperature}</label>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Precision vs Creativity</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1.0" 
                step="0.1" 
                value={temperature} 
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)' }} />

          {/* Section 2: Guardrails */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--success-color)' }} /> Guardrails & Safety
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>Mask Personally Identifiable Info (PII)</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Anonymizes names, emails, and phones prior to sending payload to external LLM.</div>
                </div>
                <input 
                  type="checkbox" 
                  className="form-checkbox" 
                  checked={guardrails.pii} 
                  onChange={(e) => setGuardrails({ ...guardrails, pii: e.target.checked })} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>Strict RAG Grounding</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Instructs model to only reply using provided knowledge chunks; avoids hallucinating replies.</div>
                </div>
                <input 
                  type="checkbox" 
                  className="form-checkbox" 
                  checked={guardrails.grounding} 
                  onChange={(e) => setGuardrails({ ...guardrails, grounding: e.target.checked })} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>Prompt Injection Shield</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Filters input strings trying to bypass system prompt instructions.</div>
                </div>
                <input 
                  type="checkbox" 
                  className="form-checkbox" 
                  checked={guardrails.injection} 
                  onChange={(e) => setGuardrails({ ...guardrails, injection: e.target.checked })} 
                />
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)' }} />

          {/* Section 3: Prompt Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>System Instruction Prompt</label>
              <button 
                onClick={() => setSystemPrompt(defaultPrompt)} 
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Sparkles size={10} /> Reset to Tenant Default
              </button>
            </div>
            <textarea
              className="form-input"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={{ flex: 1, minHeight: '140px', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.4', background: 'var(--bg-secondary)', resize: 'vertical' }}
            />
          </div>

        </div>

        {/* Playground Testing Panel */}
        <div className="col-span-6 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', background: '#0c0f1d' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <PlayCircle size={16} style={{ color: 'var(--accent-color)' }} /> Brain Playground Simulator
          </h3>

          {/* Messages Log */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--border-glass)' }}>
            {playgroundHistory.map((m, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div 
                    style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      lineHeight: '1.4',
                      background: m.role === 'user' ? 'var(--primary-color)' : 'var(--bg-tertiary)',
                      color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border-glass)'
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {isQuerying && (
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', alignItems: 'center', fontFamily: 'monospace' }}>
                <span className="node-running" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)', display: 'inline-block' }}></span>
                <span>AI Brain thinking... Executing Vector RAG index...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ask the AI agent a question (e.g. 'What are your hours?')" 
              value={playgroundInput}
              onChange={(e) => setPlaygroundInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePlaygroundSend()}
              disabled={isQuerying}
            />
            <button 
              className="btn btn-primary" 
              onClick={handlePlaygroundSend}
              disabled={isQuerying}
              style={{ width: '42px', height: '42px', padding: 0 }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
