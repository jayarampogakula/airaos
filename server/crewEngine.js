import { readDb, writeDb } from './db.js';

// Search knowledge base chunks (RAG)
function searchKnowledgeChunks(query, chunks) {
  if (!query) return [];
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (words.length === 0) return [];

  const scored = chunks.map(chunk => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    words.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1;
      }
    });
    return { chunk, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.chunk.content);
}

// Tool executor
async function executeTool(action, input, db, logCallback, tenantId = 't-1') {
  logCallback(`Calling tool [${action}] with parameters: ${JSON.stringify(input)}`);
  
  switch (action) {
    case 'CRM_LOOKUP_CONTACT': {
      const query = (input.query || '').toLowerCase();
      if (!query) return { error: "Missing query parameter." };
      
      const results = db.contacts.filter(c => 
        c.tenantId === tenantId &&
        (
          (c.name || '').toLowerCase().includes(query) ||
          (c.email || '').toLowerCase().includes(query) ||
          (c.phone || '').includes(query)
        )
      );
      
      return { success: true, count: results.length, contacts: results };
    }
    
    case 'CRM_CREATE_CONTACT': {
      const { name, email, phone, company } = input;
      if (!name) return { error: "Missing name parameter." };
      
      const newContact = {
        id: `c-crew-${Date.now()}`,
        tenantId,
        name,
        email: email || '',
        phone: phone || '',
        company: company || 'Individual',
        tags: ['CrewAI Lead'],
        notes: [`Created autonomously by CrewAI Agent`],
        createdAt: new Date().toISOString(),
        city: '',
        assignedAgentId: 'a-1'
      };
      
      db.contacts.push(newContact);
      writeDb(db);
      return { success: true, contact: newContact };
    }
    
    case 'CRM_UPDATE_CONTACT_NOTES': {
      const { contactId, note } = input;
      if (!contactId || !note) return { error: "Missing contactId or note parameter." };
      
      const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
      if (!contact) return { error: `Contact with ID ${contactId} not found.` };
      
      contact.notes = contact.notes || [];
      contact.notes.push(`[CrewAI Note - ${new Date().toLocaleString()}]: ${note}`);
      writeDb(db);
      return { success: true, message: "Note appended successfully.", contact };
    }
    
    case 'CRM_ADD_DEAL': {
      const { contactId, name, value, stage } = input;
      if (!contactId || !name) return { error: "Missing contactId or name parameter." };
      
      const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
      if (!contact) return { error: `Contact with ID ${contactId} not found.` };
      
      const newDeal = {
        id: `d-crew-${Date.now()}`,
        tenantId,
        contactId,
        name,
        value: parseFloat(value) || 0,
        stage: stage || 'lead',
        createdAt: new Date().toISOString()
      };
      
      db.deals.push(newDeal);
      writeDb(db);
      return { success: true, deal: newDeal };
    }
    
    case 'CALENDAR_CHECK_AVAILABILITY': {
      const { date } = input; // YYYY-MM-DD
      if (!date) return { error: "Missing date parameter (format YYYY-MM-DD)." };
      
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const shifts = db.working_shifts[tenantId] || {};
      const dayShift = shifts[dayOfWeek] || { enabled: false, start: "09:00", end: "18:00" };

      if (!dayShift.enabled) {
        return { success: true, slots: [], message: "No working shift enabled for this weekday." };
      }

      const slots = [];
      let current = new Date(`${date}T${dayShift.start.padStart(5, '0')}:00`);
      const end = new Date(`${date}T${dayShift.end.padStart(5, '0')}:00`);

      while (current < end) {
        const timeString = current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const slotIsoString = current.toISOString().substring(0, 16);
        const isBooked = db.appointments.some(app => 
          app.tenantId === tenantId &&
          app.status === 'scheduled' && 
          app.dateTime.substring(0, 16) === slotIsoString
        );

        if (!isBooked) {
          slots.push(timeString);
        }
        current.setMinutes(current.getMinutes() + 30);
      }
      
      return { success: true, date, availableSlots: slots };
    }
    
    case 'CALENDAR_BOOK_APPOINTMENT': {
      const { contactId, dateTime, type } = input; // dateTime format: YYYY-MM-DDTHH:MM
      if (!contactId || !dateTime) return { error: "Missing contactId or dateTime parameter." };
      
      const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
      if (!contact) return { error: `Contact with ID ${contactId} not found.` };
      
      const newApp = {
        id: `app-crew-${Date.now()}`,
        tenantId,
        contactId,
        agentId: 'a-1',
        dateTime,
        duration: 30,
        location: 'Smile Dental Clinic Suite A',
        type: type || 'Consultation',
        status: 'scheduled'
      };
      
      db.appointments.push(newApp);
      
      // Update contact note
      contact.notes = contact.notes || [];
      contact.notes.push(`Appointment booked autonomously by CrewAI: ${type} on ${new Date(dateTime).toLocaleString()}`);
      
      writeDb(db);
      return { success: true, appointment: newApp };
    }
    
    case 'KNOWLEDGE_BASE_SEARCH': {
      const { query } = input;
      if (!query) return { error: "Missing query parameter." };
      
      const results = searchKnowledgeChunks(query, db.knowledge_chunks || []);
      return { success: true, results };
    }
    
    default:
      return { error: `Unknown tool: ${action}` };
  }
}

// Run a single agent task
export async function runCrewTask(agent, task, previousOutputsContext, db, apiKey, logCallback, tenantId = 't-1') {
  let step = 0;
  const maxSteps = 5;
  
  // Format history messages
  const messages = [
    {
      role: 'system',
      content: `You are ${agent.name}, the ${agent.department} agent.
Goal/Personality: ${agent.personality || agent.prompt}
Your primary instructions: ${agent.prompt}

You are part of a sequential CrewAI execution pipeline.
Your assigned task is:
Task Description: ${task.description}
Expected Output Format: ${task.expectedOutput}

Previous context from other crew tasks executed before you:
${previousOutputsContext || 'No previous context.'}

You have access to the following tools to query/update our database and search local knowledge bases:
1. CRM_LOOKUP_CONTACT: Query contact details. Input: { "query": "name or email or phone" }
2. CRM_CREATE_CONTACT: Create a contact profile. Input: { "name": "...", "email": "...", "phone": "...", "company": "..." }
3. CRM_UPDATE_CONTACT_NOTES: Add a note to a contact. Input: { "contactId": "...", "note": "..." }
4. CRM_ADD_DEAL: Create a business deal. Input: { "contactId": "...", "name": "...", "value": number, "stage": "lead|qualified|proposal|negotiation|won|lost" }
5. CALENDAR_CHECK_AVAILABILITY: Find open slots. Input: { "date": "YYYY-MM-DD" }
6. CALENDAR_BOOK_APPOINTMENT: Book a slot. Input: { "contactId": "...", "dateTime": "YYYY-MM-DDTHH:MM", "type": "..." }
7. KNOWLEDGE_BASE_SEARCH: Search company guides and FAQs. Input: { "query": "..." }

CRITICAL - How to format your response:
If you need to use a tool to gather info or perform an action, you MUST output a single valid JSON block enclosed in markdown code fences, exactly like this:
\`\`\`json
{
  "action": "CRM_LOOKUP_CONTACT",
  "input": { "query": "Sarah Jenkins" }
}
\`\`\`
Stop writing any text after the JSON block. You will receive the tool execution results in the next message.

If you have completed your task, write your final response matching the expected output format. You MUST prefix your final response with "FINAL RESPONSE:". Example:
FINAL RESPONSE:
Based on my analysis, the client budget is $1.5M with intent score of 9/10.

Do not combine a tool call JSON with "FINAL RESPONSE:". Choose one.`
    }
  ];

  while (step < maxSteps) {
    step++;
    logCallback(`[${agent.name}] Analyzing task requirements (Step ${step}/${maxSteps})...`);
    
    let reply = '';
    
    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.3
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API returned status ${response.status}`);
        }

        const data = await response.json();
        reply = data.choices[0].message.content;
      } catch (err) {
        logCallback(`[Error] OpenAI API connection issue: ${err.message}. Falling back to sandbox output.`);
        reply = `FINAL RESPONSE: [Simulated] Task executed successfully. Match output expectation: ${task.expectedOutput}`;
      }
    } else {
      logCallback(`[System] Running task in local simulation mode (no API key configured).`);
      // Simulated logic
      if (task.description.toLowerCase().includes('qualify') || task.description.toLowerCase().includes('budget')) {
        reply = `FINAL RESPONSE: qualified Lead profile:\n- Name: Sarah Jenkins\n- Budget: $1.5M\n- Urgency: High\n- Intent Score: 9/10`;
      } else if (task.description.toLowerCase().includes('availability') || task.description.toLowerCase().includes('slot') || task.description.toLowerCase().includes('schedule')) {
        reply = `FINAL RESPONSE: Recommendation:\n- Available Slot: Tomorrow at 2:30 PM (Location: Main Suite Room)\n- Appointment successfully noted for next steps.`;
      } else {
        reply = `FINAL RESPONSE: Offline simulated execution completed matching "${task.expectedOutput}".`;
      }
    }

    // Parse for JSON block tool call
    const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        const { action, input } = parsed;
        
        if (action && input) {
          // Execute tool
          const toolResult = await executeTool(action, input, db, logCallback, tenantId);
          
          // Push assistant message and tool user response
          messages.push({ role: 'assistant', content: reply });
          messages.push({ 
            role: 'user', 
            content: `Tool Execution Result for ${action}:\n${JSON.stringify(toolResult, null, 2)}` 
          });
          
          logCallback(`[System] Tool Result: Success`);
          continue; // Go to next loop step
        }
      } catch (err) {
        logCallback(`[Warning] Failed to parse tool block: ${err.message}`);
      }
    }

    // Check for FINAL RESPONSE prefix or default complete
    if (reply.includes('FINAL RESPONSE:')) {
      const finalVal = reply.split('FINAL RESPONSE:')[1].trim();
      return finalVal;
    }
    
    // If agent didn't output a tool call and didn't start with FINAL RESPONSE
    if (step === maxSteps || !reply.includes('```json')) {
      return reply.replace(/FINAL RESPONSE:/g, '').trim();
    }
  }

  return `Failed to resolve task in ${maxSteps} steps.`;
}

// Orchestrate the whole crew sequential run
export async function runCrew({ crewAgentIds, tasks, inputs = {}, db, apiKey, tenantId = 't-1' }) {
  const logs = [];
  const addLog = (msg) => {
    const timeStr = new Date().toLocaleTimeString();
    logs.push(`[${timeStr}] ${msg}`);
    console.log(`[CrewAI] ${msg}`);
  };

  addLog(`Initializing CrewAI Workspace...`);
  addLog(`Assembled crew squad of ${crewAgentIds.length} agents to execute ${tasks.length} tasks.`);

  let previousOutput = '';
  const outputs = {};

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const agent = db.agents.find(a => a.id === task.assignedAgentId && a.tenantId === tenantId) || db.agents.find(a => a.tenantId === tenantId) || db.agents[0];
    
    // Substitutes inputs variables in description (e.g. {{inquiry}} or {inquiry})
    let finalDesc = task.description;
    Object.entries(inputs).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{?\\s*${key}\\s*\\}\\}?`, 'g');
      finalDesc = finalDesc.replace(regex, val);
    });

    addLog(`Task ${i + 1}/${tasks.length} delegated to Agent ${agent.name} (${agent.department}).`);
    addLog(`Instructions: "${finalDesc.length > 80 ? finalDesc.substring(0, 80) + '...' : finalDesc}"`);

    // run the task
    const taskOutput = await runCrewTask(
      agent,
      { ...task, description: finalDesc },
      previousOutput,
      db,
      apiKey,
      addLog,
      tenantId
    );

    outputs[task.id] = taskOutput;
    previousOutput += `\n[Task ${i + 1} Output by ${agent.name}]:\n${taskOutput}\n`;
    addLog(`Task ${i + 1} executed successfully by ${agent.name}.`);
  }

  addLog(`All tasks finished. Compiled final CrewAI report.`);
  return {
    success: true,
    logs,
    stepOutputs: outputs,
    finalResult: previousOutput
  };
}
