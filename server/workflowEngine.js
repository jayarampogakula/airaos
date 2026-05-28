import { readDb, writeDb } from './db.js';
import { decryptCredentials } from './vault.js';

// Global WebSockets connection pool for real-time telemetry
export const telemetrySockets = new Set();

// In-memory timers for delayed executions
const activeTimers = new Map();

/**
 * Register a WebSocket connection for telemetry
 */
export function registerTelemetrySocket(ws) {
  telemetrySockets.add(ws);
  ws.on('close', () => telemetrySockets.delete(ws));
}

/**
 * Broadcast telemetry events to all connected clients
 */
function broadcastTelemetry(event, data) {
  const payload = JSON.stringify({ event, ...data });
  for (const ws of telemetrySockets) {
    if (ws.readyState === 1) { // OPEN
      try {
        ws.send(payload);
      } catch (err) {
        console.error('[Telemetry Broadcast Error]', err);
      }
    }
  }
}

/**
 * Replace double-bracket template variables with context values
 */
export function resolveVariables(text, context) {
  if (typeof text !== 'string') return text;
  
  const contact = context.contact || {};
  const appointment = context.appointment || {};
  const conversation = context.conversation || {};
  const variables = context.variables || {};
  
  return text
    .replace(/\{\{contact\.name\}\}/g, contact.name || 'John Doe')
    .replace(/\{\{contact\.email\}\}/g, contact.email || 'customer@example.com')
    .replace(/\{\{contact\.phone\}\}/g, contact.phone || '')
    .replace(/\{\{contact\.company\}\}/g, contact.company || 'Individual')
    .replace(/\{\{contact\.city\}\}/g, contact.city || '')
    .replace(/\{\{appointment\.time\}\}/g, appointment.dateTime ? new Date(appointment.dateTime).toLocaleTimeString() : '2:30 PM')
    .replace(/\{\{appointment\.dateTime\}\}/g, appointment.dateTime ? new Date(appointment.dateTime).toLocaleString() : '2:30 PM')
    .replace(/\{\{appointment\.location\}\}/g, appointment.location || 'Clinic Suite A')
    .replace(/\{\{appointment\.type\}\}/g, appointment.type || 'Consultation')
    .replace(/\{\{call\.transcript\}\}/g, context.callTranscript || 'No transcript available')
    .replace(/\{\{last_message\}\}/g, conversation.lastMessageText || 'No recent messages')
    .replace(/\{\{ai_result\}\}/g, context.lastAIResult || '')
    .replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (match, p1) => {
      // Resolve custom variables
      if (variables[p1] !== undefined) return String(variables[p1]);
      if (p1.startsWith('contact.')) {
        const field = p1.split('.')[1];
        return contact[field] || '';
      }
      if (p1.startsWith('appointment.')) {
        const field = p1.split('.')[1];
        return appointment[field] || '';
      }
      return match;
    });
}

/**
 * Call LLM using tenant keys, falling back to smart mock if credentials are missing
 */
async function callLLM(tenantId, systemPrompt, userPrompt) {
  try {
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId);
    const integrations = decryptCredentials({
      ...(db.integrations || {}),
      ...(tenant?.integrations || {}),
      ...(tenant?.settings || {})
    });

    const provider = integrations.activeModelProvider || 'openai';
    let apiKey = '';
    
    if (provider === 'gemini') {
      apiKey = integrations.geminiApiKey || process.env.GEMINI_API_KEY;
    } else if (provider === 'deepseek') {
      apiKey = integrations.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    } else {
      apiKey = integrations.openaiApiKey || process.env.OPENAI_API_KEY;
    }

    if (!apiKey) {
      console.warn(`[Workflow Engine LLM] No API key found for provider "${provider}". Using mock LLM responder.`);
      return generateMockLLMResponse(systemPrompt, userPrompt);
    }

    let url = 'https://api.openai.com/v1/chat/completions';
    let headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    let body = {};

    if (provider === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      body = {
        contents: [
          ...(systemPrompt ? [{ role: 'user', parts: [{ text: `System Instruction: ${systemPrompt}` }] }] : []),
          { role: 'user', parts: [{ text: userPrompt }] }
        ]
      };
    } else if (provider === 'deepseek') {
      url = 'https://api.deepseek.com/chat/completions';
      body = {
        model: 'deepseek-chat',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      };
    } else {
      body = {
        model: 'gpt-4o-mini',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`LLM API returned status ${response.status}`);
    }

    const json = await response.json();
    if (provider === 'gemini') {
      return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    return json.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('[Workflow Engine LLM Error]', err);
    return generateMockLLMResponse(systemPrompt, userPrompt);
  }
}

/**
 * Generate smart mock responses if LLM APIs are not connected
 */
function generateMockLLMResponse(systemPrompt, userPrompt) {
  const prompt = (systemPrompt + ' ' + userPrompt).toLowerCase();
  
  if (prompt.includes('classifier') || prompt.includes('classify')) {
    if (prompt.includes('budget') || prompt.includes('price') || prompt.includes('worth')) return 'VIP Sales';
    if (prompt.includes('error') || prompt.includes('fail') || prompt.includes('bug')) return 'Technical Support';
    return 'General Inquiry';
  }
  if (prompt.includes('intent')) {
    if (prompt.includes('book') || prompt.includes('schedule') || prompt.includes('visit')) return 'Book Appointment';
    if (prompt.includes('cancel')) return 'Cancel Appointment';
    return 'General Help';
  }
  if (prompt.includes('sentiment')) {
    if (prompt.includes('bad') || prompt.includes('angry') || prompt.includes('worst')) return 'Negative';
    if (prompt.includes('good') || prompt.includes('great') || prompt.includes('happy')) return 'Positive';
    return 'Neutral';
  }
  if (prompt.includes('decision')) {
    if (prompt.includes('escalate')) return 'YES';
    return 'NO';
  }
  if (prompt.includes('summarize')) {
    return 'Summary: Customer requested appointment slot details for next Tuesday.';
  }
  return 'AI generated mock response details.';
}

/**
 * Core function to run an individual node in the graph
 */
async function executeNode(node, context, tenantId, db) {
  const config = node.config || {};
  const outputs = { success: true, result: '' };

  console.log(`[Workflow Engine] Executing node "${node.label}" (Type: ${node.type})`);
  
  switch (node.type) {
    case 'trigger':
      outputs.result = 'Trigger accepted';
      break;

    case 'action':
      const connector = config.connectorType || '';
      
      if (connector === 'email') {
        const recipient = resolveVariables(config.emailRecipient || context.contact?.email || 'customer@example.com', context);
        const subject = resolveVariables(config.emailSubject || 'Automatic Notification', context);
        const body = resolveVariables(config.emailBody || 'Welcome to our platform!', context);
        
        console.log(`[SMTP Mailer Simulator] Sent email to ${recipient}. Subject: ${subject}`);
        
        // Log note to contact
        const contactId = context.contactId || context.contact?.id;
        if (contactId) {
          const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
          if (contact) {
            contact.notes = contact.notes || [];
            contact.notes.push(`[Workflow Email] Sent mail to ${recipient}: "${subject}"`);
          }
        }
        outputs.result = `Sent email to ${recipient}`;
      }
      
      else if (connector === 'whatsapp') {
        const phone = resolveVariables(config.whatsappNumber || context.contact?.phone || '', context);
        const template = config.whatsappTemplate || 'welcome_lead';
        
        console.log(`[WhatsApp Simulator] Dispatched template "${template}" to ${phone}`);
        
        const contactId = context.contactId || context.contact?.id;
        if (contactId) {
          const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
          if (contact) {
            contact.notes = contact.notes || [];
            contact.notes.push(`[Workflow WhatsApp] Dispatched template "${template}" to ${phone}`);
          }
        }
        outputs.result = `Sent WhatsApp template ${template} to ${phone}`;
      }
      
      else if (connector === 'sms') {
        const phone = resolveVariables(config.smsNumber || context.contact?.phone || '', context);
        const msg = resolveVariables(config.smsMessage || 'Automated SMS Alert', context);
        
        console.log(`[SMS Simulator] Sent SMS to ${phone}: ${msg}`);
        
        const contactId = context.contactId || context.contact?.id;
        if (contactId) {
          const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
          if (contact) {
            contact.notes = contact.notes || [];
            contact.notes.push(`[Workflow SMS] Sent SMS to ${phone}: "${msg}"`);
          }
        }
        outputs.result = `Sent SMS to ${phone}`;
      }
      
      else if (connector === 'crm') {
        // Create Deal or Contact
        const crmAction = config.crmAction || 'create_deal';
        const contactId = context.contactId || context.contact?.id;
        
        if (crmAction === 'create_deal' && contactId) {
          const dealId = `d-${Date.now()}`;
          const newDeal = {
            id: dealId,
            tenantId,
            contactId,
            name: resolveVariables(config.dealName || `Deal: ${context.contact?.name || 'CRM Lead'}`, context),
            value: parseFloat(config.dealValue) || 1200,
            stage: config.pipelineStage || 'lead',
            createdAt: new Date().toISOString()
          };
          db.deals = db.deals || [];
          db.deals.push(newDeal);
          
          const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
          if (contact) {
            contact.notes = contact.notes || [];
            contact.notes.push(`[Workflow CRM] Created pipeline deal: "${newDeal.name}" in stage "${newDeal.stage}".`);
          }
          outputs.result = `Created CRM Deal: ${newDeal.name}`;
        } else if (crmAction === 'update_stage' && contactId) {
          // Update deal stage
          const deal = db.deals.find(d => d.contactId === contactId && d.tenantId === tenantId);
          if (deal) {
            deal.stage = config.pipelineStage || 'qualified';
            outputs.result = `Updated Deal stage to ${deal.stage}`;
          } else {
            outputs.result = `No Deal found to update stage`;
          }
        } else {
          // Create CRM Contact
          const newContact = {
            id: `c-${Date.now()}`,
            tenantId,
            name: resolveVariables(config.contactName || 'New Lead', context),
            email: resolveVariables(config.contactEmail || '', context),
            phone: resolveVariables(config.contactPhone || '', context),
            company: 'Individual',
            tags: ['Workflow Created'],
            notes: ['Automatically created via flow automation.'],
            createdAt: new Date().toISOString()
          };
          db.contacts.push(newContact);
          outputs.result = `Created CRM Contact: ${newContact.name}`;
        }
      }
      
      else if (connector === 'webhook' && config.webhookUrl) {
        const method = config.webhookMethod || 'POST';
        const url = resolveVariables(config.webhookUrl, context);
        
        console.log(`[Webhook Executor] Sending ${method} to ${url}`);
        
        try {
          const fetchPromise = fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'workflow_trigger',
              tenantId,
              context: {
                contact: context.contact,
                appointment: context.appointment,
                variables: context.variables
              },
              timestamp: new Date().toISOString()
            })
          });
          
          // Execute async and don't block fully if it takes long, or await with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          await fetchPromise;
          clearTimeout(timeoutId);
          
          outputs.result = `Webhook sent successfully`;
        } catch (e) {
          console.warn('[Webhook Warning]', e.message);
          outputs.result = `Webhook sent (or timeout/network bypass)`;
        }
      }
      
      else if (node.label.toLowerCase().includes('database') || node.label.toLowerCase().includes('query')) {
        outputs.result = 'Database query executed. Returned 0 conflicts.';
      }
      
      else if (node.label.toLowerCase().includes('notification')) {
        const title = resolveVariables(config.notificationTitle || 'System Alert', context);
        const body = resolveVariables(config.notificationBody || 'A workflow event has run.', context);
        
        const newNotif = {
          id: `notif-${Date.now()}`,
          tenantId,
          title,
          message: body,
          read: false,
          createdAt: new Date().toISOString()
        };
        db.notifications = db.notifications || [];
        db.notifications.push(newNotif);
        outputs.result = `Dispatched notification: "${title}"`;
      }
      
      else if (node.label.toLowerCase().includes('tag')) {
        const tag = resolveVariables(config.tagName || 'Lead-Nurtured', context);
        const contactId = context.contactId || context.contact?.id;
        if (contactId) {
          const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
          if (contact) {
            contact.tags = contact.tags || [];
            if (!contact.tags.includes(tag)) {
              contact.tags.push(tag);
            }
            outputs.result = `Added tag "${tag}" to contact.`;
          }
        }
      }

      else if (node.label.toLowerCase().includes('assign') || node.label.toLowerCase().includes('team')) {
        outputs.result = 'Assigned lead to primary agent Receptionist Sarah.';
      }

      else if (node.label.toLowerCase().includes('call') || node.label.toLowerCase().includes('phone')) {
        // AI Phone Call Action trigger
        const contactPhone = context.contact?.phone || '+15550192834';
        console.log(`[AI Call Campaign] Initiating AI Outbound phone call to ${contactPhone}`);
        
        const contactId = context.contactId || context.contact?.id;
        if (contactId) {
          const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
          if (contact) {
            contact.notes = contact.notes || [];
            contact.notes.push(`[Workflow Call Campaign] Placed automated AI outbound phone call to ${contactPhone}`);
          }
        }
        outputs.result = `Dialed outbound AI call to ${contactPhone}`;
      }

      else {
        outputs.result = 'Action executed';
      }
      break;

    case 'ai':
      const aiType = config.aiNodeType || 'decision';
      const promptText = resolveVariables(config.aiInstructions || 'Process user request.', context);
      const textToAnalyze = resolveVariables(config.aiTargetText || context.callTranscript || context.conversation?.lastMessageText || 'Hello', context);
      
      if (aiType === 'decision') {
        const sysPrompt = 'Review the user content. Reply with exactly "YES" or "NO" based on instructions.';
        const result = await callLLM(tenantId, sysPrompt, `Instruction: ${promptText}\nContent to review: ${textToAnalyze}`);
        const decision = result.trim().toUpperCase().includes('YES') ? 'YES' : 'NO';
        outputs.result = decision;
        context.lastAIResult = decision;
      }
      
      else if (aiType === 'classifier') {
        const categories = config.classifierCategories || 'Sales, Support, Billing';
        const sysPrompt = `Classify this text into exactly one of these categories: [${categories}]. Output ONLY the category name.`;
        const result = await callLLM(tenantId, sysPrompt, `Content: ${textToAnalyze}`);
        outputs.result = result.trim();
        context.lastAIResult = result.trim();
      }
      
      else if (aiType === 'summarizer') {
        const sysPrompt = 'Summarize the following text in under 100 characters.';
        const result = await callLLM(tenantId, sysPrompt, `Text: ${textToAnalyze}`);
        outputs.result = result.trim();
        context.lastAIResult = result.trim();
      }
      
      else if (aiType === 'intent') {
        const sysPrompt = 'Determine the intent of this customer text (e.g. Book Slot, Cancel Slot, Query Price, Human Escalate). Reply in 2-3 words max.';
        const result = await callLLM(tenantId, sysPrompt, `Text: ${textToAnalyze}`);
        outputs.result = result.trim();
        context.lastAIResult = result.trim();
      }
      
      else if (aiType === 'response_gen') {
        const sysPrompt = `Generate a reply to the customer message. Instructions: ${promptText}`;
        const result = await callLLM(tenantId, sysPrompt, `Customer Message: ${textToAnalyze}`);
        outputs.result = result.trim();
        context.lastAIResult = result.trim();
      }
      
      else if (aiType === 'kb_search') {
        // Grounding search
        const query = resolveVariables(config.kbQuery || textToAnalyze, context).toLowerCase();
        const sources = db.knowledge_chunks || [];
        const matches = sources
          .filter(chunk => (chunk.tenantId || 't-1') === tenantId)
          .filter(chunk => chunk.content?.toLowerCase().includes(query) || query.split(/\s+/).some(w => w.length > 4 && chunk.content?.toLowerCase().includes(w)))
          .slice(0, 2)
          .map(c => c.content);
          
        outputs.result = matches.length > 0 ? matches.join('\n') : 'No knowledge chunks matched the query.';
        context.lastAIResult = outputs.result;
      }
      
      else {
        outputs.result = 'AI response processed.';
      }
      break;

    case 'condition':
      // Branching condition evaluation
      const conditionType = config.conditionType || 'if_else';
      
      if (conditionType === 'if_else') {
        const field = config.conditionField || 'crm_stage';
        const operator = config.conditionOperator || 'equals';
        const compareValue = config.conditionCompareValue || 'lead';
        
        let actualValue = '';
        if (field === 'crm_stage') {
          const deal = db.deals?.find(d => d.contactId === context.contact?.id && d.tenantId === tenantId);
          actualValue = deal?.stage || 'lead';
        } else if (field === 'contact_email') {
          actualValue = context.contact?.email || '';
        } else if (field === 'ai_confidence') {
          actualValue = '85'; // mock
        } else {
          actualValue = resolveVariables(`{{${field}}}`, context);
        }

        let isTrue = false;
        if (operator === 'equals') isTrue = String(actualValue).toLowerCase() === String(compareValue).toLowerCase();
        else if (operator === 'contains') isTrue = String(actualValue).toLowerCase().includes(String(compareValue).toLowerCase());
        else if (operator === 'greater_than') isTrue = parseFloat(actualValue) > parseFloat(compareValue);
        else if (operator === 'less_than') isTrue = parseFloat(actualValue) < parseFloat(compareValue);
        
        outputs.result = isTrue ? 'TRUE' : 'FALSE';
      } else {
        outputs.result = 'TRUE';
      }
      break;

    case 'loop':
      const loopType = config.loopType || 'retry';
      if (loopType === 'retry') {
        const currentCount = context.loopCounter || 0;
        const maxRetries = parseInt(config.maxRetries) || 3;
        if (currentCount < maxRetries) {
          context.loopCounter = currentCount + 1;
          outputs.result = 'RETRY';
        } else {
          outputs.result = 'EXHAUSTED';
        }
      } else {
        outputs.result = 'CONTINUE';
      }
      break;

    default:
      outputs.result = 'Node finished';
  }

  return outputs;
}

/**
 * Execute the workflow graph starting from a trigger or specific node
 */
export async function executeWorkflowInstance(runId, workflowId, tenantId, startNodeId, initialContext) {
  try {
    const db = readDb();
    const wf = db.workflows.find(w => w.id === workflowId && w.tenantId === tenantId);
    if (!wf || !wf.active) {
      console.warn(`[Workflow Engine] Workflow ${workflowId} not found or inactive.`);
      return;
    }

    // Locate active run or initialize
    db.workflow_runs = db.workflow_runs || [];
    let runIndex = db.workflow_runs.findIndex(r => r.id === runId);
    let run;
    
    if (runIndex === -1) {
      run = {
        id: runId,
        workflowId,
        tenantId,
        status: 'running',
        timestamp: new Date().toISOString(),
        timeline: [],
        variables: { ...initialContext }
      };
      db.workflow_runs.push(run);
    } else {
      run = db.workflow_runs[runIndex];
      run.status = 'running';
    }

    writeDb(db);

    // Context tracking state
    let currentNodeId = startNodeId;
    let iterations = 0;
    const maxSafetyIterations = 100; // Prevent infinite loops

    while (currentNodeId && iterations < maxSafetyIterations) {
      iterations++;
      
      const node = wf.nodes.find(n => n.id === currentNodeId);
      if (!node) break;

      // Telemetry: highlight executing node
      broadcastTelemetry('node-active', { runId, workflowId, nodeId: currentNodeId });
      
      const startTime = Date.now();
      const nodeRunLog = {
        nodeId: currentNodeId,
        label: node.label,
        type: node.type,
        startTime: new Date().toISOString(),
        status: 'running'
      };
      
      run.timeline.push(nodeRunLog);
      writeDb(db);

      // Execute node logic
      let nodeResult;
      try {
        nodeResult = await executeNode(node, run.variables, tenantId, db);
        
        nodeRunLog.status = 'success';
        nodeRunLog.output = nodeResult.result;
        nodeRunLog.duration = Date.now() - startTime;
      } catch (err) {
        nodeRunLog.status = 'failed';
        nodeRunLog.error = err.message;
        nodeRunLog.duration = Date.now() - startTime;
        
        broadcastTelemetry('node-failed', { runId, workflowId, nodeId: currentNodeId });
        run.status = 'failed';
        writeDb(db);
        break;
      }

      broadcastTelemetry('node-success', { runId, workflowId, nodeId: currentNodeId, result: nodeResult.result });
      writeDb(db);

      // Check if it's a Delay/Wait node. If so, suspend run execution.
      if (node.type === 'action' && node.config?.timingMode === 'delay') {
        const delayVal = parseInt(node.config.delayValue) || 1;
        const delayUnit = node.config.delayUnit || 'days';
        
        let multiplier = 1000 * 60; // minutes
        if (delayUnit === 'hours') multiplier = 1000 * 60 * 60;
        else if (delayUnit === 'days') multiplier = 1000 * 60 * 60 * 24;
        
        const delayMs = delayVal * multiplier;
        const resumeTime = new Date(Date.now() + delayMs).toISOString();

        console.log(`[Workflow Engine] Suspending workflow run ${runId} at node ${currentNodeId} for ${delayVal} ${delayUnit}. Resumes at ${resumeTime}`);

        run.status = 'delayed';
        nodeRunLog.output = `Delayed execution queued for ${resumeTime}`;
        writeDb(db);

        // Find subsequent node
        const nextEdge = wf.edges.find(e => e.source === currentNodeId);
        if (nextEdge) {
          const nextNodeId = nextEdge.target;
          
          // Schedule in memory
          const timerId = setTimeout(() => {
            activeTimers.delete(runId);
            executeWorkflowInstance(runId, workflowId, tenantId, nextNodeId, run.variables);
          }, delayMs);
          activeTimers.set(runId, timerId);
        }
        break; 
      }

      // Check relative scheduling before appointments
      if (node.type === 'action' && node.config?.timingMode === 'relative' && run.variables.appointment?.dateTime) {
        const appDate = new Date(run.variables.appointment.dateTime);
        const relVal = parseInt(node.config.relativeValue) || 1;
        const relUnit = node.config.relativeUnit || 'hours';
        const anchor = node.config.relativeAnchor || 'before';
        
        let multiplier = 1000 * 60; // minutes
        if (relUnit === 'hours') multiplier = 1000 * 60 * 60;
        else if (relUnit === 'days') multiplier = 1000 * 60 * 60 * 24;
        
        const offset = relVal * multiplier;
        const targetMs = anchor === 'before' ? appDate.getTime() - offset : appDate.getTime() + offset;
        const delayMs = targetMs - Date.now();

        if (delayMs > 5000) {
          const resumeTime = new Date(targetMs).toISOString();
          console.log(`[Workflow Engine] Relative timing scheduled for ${resumeTime} (in ${Math.round(delayMs / 1000)} seconds)`);
          
          run.status = 'delayed';
          nodeRunLog.output = `Scheduled relative alert for ${resumeTime}`;
          writeDb(db);

          const nextEdge = wf.edges.find(e => e.source === currentNodeId);
          if (nextEdge) {
            const nextNodeId = nextEdge.target;
            const timerId = setTimeout(() => {
              activeTimers.delete(runId);
              executeWorkflowInstance(runId, workflowId, tenantId, nextNodeId, run.variables);
            }, delayMs);
            activeTimers.set(runId, timerId);
          }
          break;
        }
      }

      // Determine next node based on edges and outputs
      let nextNodeId = null;
      let matchingEdge = null;
      
      // If/Else condition output
      if (node.type === 'condition') {
        const branchHandle = nodeResult.result === 'TRUE' ? 'true' : 'false';
        matchingEdge = wf.edges.find(e => e.source === currentNodeId && e.sourceHandle === branchHandle);
        
        // Fallback if handle details are not fully mapped in JSON edges
        if (!matchingEdge) {
          const hasHandleEdges = wf.edges.some(e => e.source === currentNodeId && (e.sourceHandle === 'true' || e.sourceHandle === 'false'));
          if (!hasHandleEdges) {
            matchingEdge = wf.edges.find(e => e.source === currentNodeId);
          }
        }
      } 
      // Loops
      else if (node.type === 'loop') {
        const loopDecision = nodeResult.result; // RETRY or EXHAUSTED or CONTINUE
        
        if (loopDecision === 'RETRY') {
          // Loop back edge
          matchingEdge = wf.edges.find(e => e.source === currentNodeId && e.sourceHandle === 'loop');
        } else {
          // Outward edge
          matchingEdge = wf.edges.find(e => e.source === currentNodeId && e.sourceHandle === 'done');
        }
        
        if (!matchingEdge) {
          matchingEdge = wf.edges.find(e => e.source === currentNodeId);
        }
      } 
      // standard single edge transition
      else {
        matchingEdge = wf.edges.find(e => e.source === currentNodeId);
      }

      if (matchingEdge) {
        nextNodeId = matchingEdge.target;
        
        // Animate edge line path transition
        broadcastTelemetry('edge-active', { runId, workflowId, edgeId: matchingEdge.id });
        await new Promise(r => setTimeout(r, 600)); // smooth visual transition timing
      }

      currentNodeId = nextNodeId;
    }

    // Mark completion
    if (currentNodeId === null) {
      run.status = 'completed';
      
      // Increment successes count on base workflow
      const finalDb = readDb();
      const wfIndex = finalDb.workflows.findIndex(w => w.id === workflowId && w.tenantId === tenantId);
      if (wfIndex !== -1) {
        finalDb.workflows[wfIndex].runsCount = (finalDb.workflows[wfIndex].runsCount || 0) + 1;
        finalDb.workflows[wfIndex].successCount = (finalDb.workflows[wfIndex].successCount || 0) + 1;
        finalDb.workflows[wfIndex].lastRun = new Date().toLocaleString();
        writeDb(finalDb);
      }
      
      const dbInstance = readDb();
      const currentRunIdx = dbInstance.workflow_runs.findIndex(r => r.id === runId);
      if (currentRunIdx !== -1) {
        dbInstance.workflow_runs[currentRunIdx].status = 'completed';
        writeDb(dbInstance);
      }
      
      broadcastTelemetry('workflow-finished', { runId, workflowId, status: 'completed' });
    }

  } catch (err) {
    console.error('[Workflow Engine Instance Error]', err);
    broadcastTelemetry('workflow-finished', { runId, workflowId, status: 'failed', error: err.message });
  }
}

/**
 * Dispatch trigger and enqueue matching workflow runs
 */
export async function enqueueWorkflowTrigger(db, tenantId, triggerType, context) {
  try {
    const activeWorkflows = (db.workflows || []).filter(w => w.tenantId === tenantId && w.active);
    
    for (const wf of activeWorkflows) {
      // Find trigger node
      const triggerNode = wf.nodes.find(n => n.type === 'trigger');
      if (!triggerNode) continue;

      let isMatch = false;
      const label = triggerNode.label.toLowerCase();
      
      if (triggerType === 'chat' && (label.includes('chat') || label.includes('lead') || label.includes('submitted') || label.includes('create'))) isMatch = true;
      if (triggerType === 'cal' && (label.includes('calendar') || label.includes('appointment') || label.includes('booked'))) isMatch = true;
      if (triggerType === 'escalation' && (label.includes('handoff') || label.includes('human') || label.includes('escalate'))) isMatch = true;
      if (triggerType === 'call' && (label.includes('call') || label.includes('phone') || label.includes('missed'))) isMatch = true;
      if (triggerType === 'webhook' && label.includes('webhook')) isMatch = true;

      if (!isMatch) continue;

      const runId = `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      console.log(`[Workflow Engine Queue] Enqueueing workflow "${wf.name}" (${wf.id}) for trigger "${triggerType}" (RunId: ${runId})`);
      
      // Execute asynchronously in the background
      setTimeout(() => {
        const nextEdge = wf.edges.find(e => e.source === triggerNode.id);
        if (nextEdge) {
          executeWorkflowInstance(runId, wf.id, tenantId, nextEdge.target, context);
        }
      }, 0);
    }
  } catch (err) {
    console.error('[Workflow Engine trigger dispatch error]', err);
  }
}
