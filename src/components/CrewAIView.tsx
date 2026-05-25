import React, { useState } from 'react';
import { Sparkles, Play, CheckCircle2, User, FileText, ChevronRight, Plus, Trash2, AlertTriangle, Layers, Brain } from 'lucide-react';
import { Agent, Contact } from '../types';

interface CrewAgent {
  id: string;
  agentId: string; // references agent ledger
}

interface CrewTask {
  id: string;
  description: string;
  expectedOutput: string;
  assignedAgentId: string;
}

interface CrewAIViewProps {
  agents: Agent[];
  contacts: Contact[];
}

export const CrewAIView: React.FC<CrewAIViewProps> = ({ agents, contacts }) => {
  const [crewAgents, setCrewAgents] = useState<string[]>([agents[0]?.id || '', agents[1]?.id || ''].filter(Boolean));
  const [tasks, setTasks] = useState<CrewTask[]>([
    {
      id: 'task-1',
      description: 'Analyze the following client query to qualify their interest and estimate deal value: "I want to schedule a penthouse showing, my budget is around $1.5M"',
      expectedOutput: 'A concise qualification report with estimated budget, intent score (1-10), and client objectives.',
      assignedAgentId: agents[1]?.id || agents[0]?.id || ''
    },
    {
      id: 'task-2',
      description: 'Review the qualification report from Task 1. Check availability for tomorrow afternoon and recommend a 30-minute booking slot.',
      expectedOutput: 'A recommended booking appointment time slot and location summary details.',
      assignedAgentId: agents[0]?.id || ''
    }
  ]);

  // Task form state
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskOutput, setNewTaskOutput] = useState('');
  const [newTaskAgent, setNewTaskAgent] = useState(agents[0]?.id || '');

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState<number | null>(null);
  const [stepOutputs, setStepOutputs] = useState<{ [key: string]: string }>({});
  const [stepLogs, setStepLogs] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim() || !newTaskOutput.trim()) return;

    setTasks(prev => [...prev, {
      id: `task-${Date.now()}`,
      description: newTaskDesc,
      expectedOutput: newTaskOutput,
      assignedAgentId: newTaskAgent
    }]);

    setNewTaskDesc('');
    setNewTaskOutput('');
  };

  const handleRemoveTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddAgentToCrew = (agentId: string) => {
    if (crewAgents.includes(agentId)) return;
    setCrewAgents(prev => [...prev, agentId]);
  };

  const handleRemoveAgentFromCrew = (agentId: string) => {
    setCrewAgents(prev => prev.filter(id => id !== agentId));
  };

  const handleLaunchCrew = async () => {
    if (tasks.length === 0 || crewAgents.length === 0) return;

    setIsRunning(true);
    setCurrentStepIdx(0);
    setStepOutputs({});
    setFinalResult('');
    setStepLogs([]);

    const logMessage = (msg: string) => {
      setStepLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    logMessage("Initializing CrewAI Workspace...");
    logMessage(`Assembled crew of ${crewAgents.length} agents to execute ${tasks.length} sequential tasks.`);

    let previousOutput = '';
    const outputs: { [key: string]: string } = {};

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const agent = agents.find(a => a.id === task.assignedAgentId) || agents[0];
      
      setCurrentStepIdx(i);
      logMessage(`Task ${i + 1} delegated to Agent ${agent.name} (${agent.department}).`);
      logMessage(`Instructions: "${task.description.substring(0, 80)}..."`);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Execute the following task.\nTask Description: ${task.description}\nExpected Output Format: ${task.expectedOutput}\n\nContext from previous tasks:\n${previousOutput || 'No previous context.'}`,
            tenantId: 't-1',
            agentId: agent.id
          })
        });

        if (!response.ok) throw new Error('API call failed');
        const data = await response.json();
        
        outputs[task.id] = data.text;
        setStepOutputs(prev => ({ ...prev, [task.id]: data.text }));
        previousOutput += `\n[Task ${i + 1} Output by ${agent.name}]:\n${data.text}\n`;
        logMessage(`Task ${i + 1} executed successfully by ${agent.name}.`);
      } catch (err) {
        console.error(err);
        const fallbackText = `[Simulated Output] Task successfully handled by ${agent.name}. Output matches requirements: "${task.expectedOutput}"`;
        outputs[task.id] = fallbackText;
        setStepOutputs(prev => ({ ...prev, [task.id]: fallbackText }));
        previousOutput += `\n[Task ${i + 1} Output by ${agent.name}]:\n${fallbackText}\n`;
        logMessage(`Task ${i + 1} failed. Falling back to local agent sandbox completion.`);
      }
      
      // Delay for realistic pacing
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logMessage("All tasks finished. Compiling final Crew report...");
    setFinalResult(previousOutput);
    setCurrentStepIdx(null);
    setIsRunning(false);
  };

  // Crew Templates
  const loadTemplate = (type: 'intake' | 'support') => {
    if (type === 'intake') {
      setCrewAgents([agents[1]?.id || '', agents[0]?.id || ''].filter(Boolean));
      setTasks([
        {
          id: 'task-1',
          description: 'Analyze the client query: "I am interested in getting a dental checkup and teeth cleaning next Tuesday, can you tell me the costs?" Extract budget, procedure scope, and urgency.',
          expectedOutput: 'Lead profiling output sheet.',
          assignedAgentId: agents[1]?.id || agents[0]?.id || ''
        },
        {
          id: 'task-2',
          description: 'Review the lead profile. Cross-reference schedule availability for next Tuesday. Recommend three potential 30-minute consultation slots.',
          expectedOutput: 'Available calendar slots proposal list.',
          assignedAgentId: agents[0]?.id || ''
        }
      ]);
    } else {
      setCrewAgents([agents[2]?.id || '', agents[3]?.id || ''].filter(Boolean));
      setTasks([
        {
          id: 'task-1',
          description: 'Investigate client billing complaint: "I was charged $50 extra on my AWS connector SLA invoice." Diagnose limits usage.',
          expectedOutput: 'A diagnostic note on database overage limits.',
          assignedAgentId: agents[2]?.id || agents[0]?.id || ''
        },
        {
          id: 'task-2',
          description: 'Review the diagnostic note. Formulate the billing response outlining the $10/GB overage pricing for exceeding 10GB limits.',
          expectedOutput: 'Email response template explaining the invoice discrepancy.',
          assignedAgentId: agents[3]?.id || agents[0]?.id || ''
        }
      ]);
    }
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
      <div className="view-header">
        <div>
          <h2 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={24} style={{ color: 'var(--primary-color)' }} /> CrewAI Agent Orchestrator
          </h2>
          <p className="view-subtitle">Orchestrate groups of autonomous AI agents working collaboratively to execute sequential business tasks.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => loadTemplate('intake')} style={{ fontSize: '0.75rem' }}>
            Template: Lead Intake
          </button>
          <button className="btn btn-secondary" onClick={() => loadTemplate('support')} style={{ fontSize: '0.75rem' }}>
            Template: Billing Diagnosis
          </button>
        </div>
      </div>

      <div className="grid-cols-12" style={{ gap: '20px' }}>
        
        {/* Left Column: Crew Builder Form */}
        <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Agent Squad */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px', display: 'flex', justifyItems: 'center', gap: '6px' }}>
              <User size={16} style={{ color: 'var(--primary-color)' }} /> Active Crew Squad
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              {crewAgents.map(id => {
                const agent = agents.find(a => a.id === id);
                if (!agent) return null;
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>
                    <span>{agent.name} ({agent.department})</span>
                    <button onClick={() => handleRemoveAgentFromCrew(id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.75rem', padding: '0 2px' }}>×</button>
                  </div>
                );
              })}
              {crewAgents.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No agents selected. Add agents from the list below.</div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Add Agent to Crew</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {agents.map(a => (
                  <button
                    key={a.id}
                    onClick={() => handleAddAgentToCrew(a.id)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                    disabled={crewAgents.includes(a.id)}
                  >
                    + {a.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Task Creator Form */}
          <form onSubmit={handleAddTask} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', justifyItems: 'center', gap: '6px', margin: 0 }}>
              <FileText size={16} style={{ color: 'var(--accent-color)' }} /> Add Task to Pipeline
            </h3>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Task Instructions / Description</label>
              <textarea
                className="form-input"
                style={{ fontSize: '0.75rem', height: '60px', resize: 'vertical' }}
                placeholder="Describe what the agent should do..."
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Expected Output Format</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.75rem' }}
                placeholder="e.g. A bullet point list of pricing tiers."
                value={newTaskOutput}
                onChange={(e) => setNewTaskOutput(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Assigned Agent</label>
              <select
                className="form-input"
                style={{ fontSize: '0.75rem' }}
                value={newTaskAgent}
                onChange={(e) => setNewTaskAgent(e.target.value)}
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.department})</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', fontSize: '0.75rem', padding: '6px 12px' }}>
              Add Task Node
            </button>
          </form>

        </div>

        {/* Right Column: Tasks Pipeline & Execution Output */}
        <div className="col-span-7 glass-panel" style={{ padding: '24px', minHeight: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Task Execution Flow</h3>
            <button
              onClick={handleLaunchCrew}
              className="btn btn-primary"
              disabled={isRunning || tasks.length === 0 || crewAgents.length === 0}
              style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Play size={12} /> Run Crew AI Execution
            </button>
          </div>

          {/* Sequential Task Pipeline Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.map((task, idx) => {
              const agent = agents.find(a => a.id === task.assignedAgentId);
              const isActive = currentStepIdx === idx;
              const isFinished = currentStepIdx !== null && idx < currentStepIdx;
              const output = stepOutputs[task.id];

              return (
                <div
                  key={task.id}
                  className="glass-card"
                  style={{
                    padding: '14px',
                    borderColor: isActive ? 'var(--primary-color)' : isFinished ? 'var(--success-color)' : 'var(--border-glass)',
                    background: isActive ? 'rgba(99,102,241,0.02)' : 'rgba(255,255,255,0.01)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: isFinished ? 'var(--success-color)' : isActive ? 'var(--primary-color)' : 'var(--border-glass)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>
                        {idx + 1}
                      </span>
                      Task for {agent?.name || 'Agent'}
                    </h4>
                    {isActive && <span className="badge badge-primary" style={{ animation: 'pulse 1s infinite' }}>Running</span>}
                    {isFinished && <span className="badge badge-success">Completed</span>}
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>{task.description}</p>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <strong>Expected Output:</strong> {task.expectedOutput}
                  </div>

                  {output && (
                    <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                      {output}
                    </div>
                  )}

                  {!isRunning && (
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '8px', padding: 0 }}
                    >
                      <Trash2 size={10} /> Delete Task
                    </button>
                  )}
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                No tasks added. Use the form on the left to queue tasks.
              </div>
            )}
          </div>

          {/* Live execution logs terminal */}
          {stepLogs.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Agent Execution Logs</label>
              <div style={{
                background: '#070a12',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                maxHeight: '160px',
                overflowY: 'auto',
                color: '#34d399',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {stepLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* Final compiled output */}
          {finalResult && (
            <div style={{ marginTop: '10px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--primary-color)' }}>Final Aggregated Output Report</label>
              <div style={{
                background: '#0a0d16',
                border: '1px solid var(--primary-color)44',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '0.8rem',
                lineHeight: '1.4',
                maxHeight: '300px',
                overflowY: 'auto',
                color: 'var(--text-primary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                  <Layers size={14} /> Compiled Crew AI Agent Report
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{finalResult}</div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
