import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { readDb, writeDb } from './db.js';
import { runCrew } from './crewEngine.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// RAG Grounding Search Helper
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

// ----------------------------------------
// CRM Pipeline Endpoints
// ----------------------------------------
app.get('/api/contacts', (req, res) => {
  const db = readDb();
  res.json(db.contacts || []);
});

app.post('/api/contacts', (req, res) => {
  const db = readDb();
  const newContact = {
    id: `c-${Date.now()}`,
    createdAt: new Date().toISOString(),
    tags: req.body.tags || ['New Lead'],
    notes: req.body.notes || [],
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    company: req.body.company || 'Individual',
    city: req.body.city || '',
    assignedAgentId: req.body.assignedAgentId || 'a-1'
  };

  db.contacts.push(newContact);
  writeDb(db);
  res.status(201).json(newContact);
});

app.put('/api/contacts/:id', (req, res) => {
  const db = readDb();
  const contactIndex = db.contacts.findIndex(c => c.id === req.params.id);
  if (contactIndex === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  db.contacts[contactIndex] = {
    ...db.contacts[contactIndex],
    ...req.body
  };
  writeDb(db);
  res.json(db.contacts[contactIndex]);
});

app.get('/api/deals', (req, res) => {
  const db = readDb();
  res.json(db.deals || []);
});

app.post('/api/deals', (req, res) => {
  const db = readDb();
  const newDeal = {
    id: `d-${Date.now()}`,
    createdAt: new Date().toISOString(),
    contactId: req.body.contactId,
    name: req.body.name,
    value: parseFloat(req.body.value) || 0,
    stage: req.body.stage || 'lead'
  };

  db.deals.push(newDeal);
  writeDb(db);
  res.status(201).json(newDeal);
});

app.put('/api/deals/:id', (req, res) => {
  const db = readDb();
  const dealIndex = db.deals.findIndex(d => d.id === req.params.id);
  if (dealIndex === -1) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  db.deals[dealIndex] = {
    ...db.deals[dealIndex],
    ...req.body
  };
  writeDb(db);
  res.json(db.deals[dealIndex]);
});

app.get('/api/conversations', (req, res) => {
  const db = readDb();
  res.json(db.conversations || []);
});

app.post('/api/conversations', (req, res) => {
  const db = readDb();
  const existingIndex = db.conversations.findIndex(c => c.id === req.body.id);
  if (existingIndex !== -1) {
    db.conversations[existingIndex] = {
      ...db.conversations[existingIndex],
      ...req.body
    };
    writeDb(db);
    return res.json(db.conversations[existingIndex]);
  }

  const newConv = {
    id: req.body.id || `conv-${Date.now()}`,
    contactId: req.body.contactId,
    status: req.body.status || 'ai_active',
    channel: req.body.channel || 'web',
    messages: req.body.messages || [],
    lastMessageText: req.body.lastMessageText || '',
    lastMessageTime: req.body.lastMessageTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    assignedAgentId: req.body.assignedAgentId || 'a-1',
    unreadCount: req.body.unreadCount || 0
  };

  db.conversations.push(newConv);
  writeDb(db);
  res.status(201).json(newConv);
});

// ----------------------------------------
// Calendar Scheduler Endpoints
// ----------------------------------------
app.get('/api/appointments', (req, res) => {
  const db = readDb();
  res.json(db.appointments || []);
});

app.post('/api/appointments', (req, res) => {
  const db = readDb();
  const newApp = {
    id: req.body.id || `app-${Date.now()}`,
    contactId: req.body.contactId,
    agentId: req.body.agentId || 'a-1',
    dateTime: req.body.dateTime, // Format: YYYY-MM-DDTHH:MM
    duration: parseInt(req.body.duration) || 30,
    location: req.body.location || 'Default Suite Office',
    type: req.body.type || 'Consultation',
    status: 'scheduled'
  };

  db.appointments.push(newApp);

  // Sync to contact profile notes
  const contact = db.contacts.find(c => c.id === newApp.contactId);
  if (contact) {
    const timeStr = new Date(newApp.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    contact.notes.push(`Calendar Scheduler Slot Booked: ${newApp.type} on ${new Date(newApp.dateTime).toLocaleDateString()} at ${timeStr}`);
  }

  writeDb(db);
  res.status(201).json(newApp);
});

app.delete('/api/appointments/:id', (req, res) => {
  const db = readDb();
  const appIndex = db.appointments.findIndex(a => a.id === req.params.id);
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  db.appointments[appIndex].status = 'cancelled';
  writeDb(db);
  res.json(db.appointments[appIndex]);
});

// Availability generator
app.get('/api/availability', (req, res) => {
  const db = readDb();
  const { tenantId = 't-1', date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Date query param required (YYYY-MM-DD)' });
  }

  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  // Load working shifts for tenant
  const shifts = db.working_shifts[tenantId] || {};
  const dayShift = shifts[dayOfWeek] || { enabled: false, start: "09:00", end: "18:00" };

  if (!dayShift.enabled) {
    return res.json([]);
  }

  // Parse start/end hours
  const [startHour, startMin] = dayShift.start.split(':').map(Number);
  const [endHour, endMin] = dayShift.end.split(':').map(Number);

  const slots = [];
  let current = new Date(`${date}T${dayShift.start.padStart(5, '0')}:00`);
  const end = new Date(`${date}T${dayShift.end.padStart(5, '0')}:00`);

  while (current < end) {
    const timeString = current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Check if slot is already booked
    const slotIsoString = current.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
    const isBooked = db.appointments.some(app => 
      app.status === 'scheduled' && 
      app.dateTime.substring(0, 16) === slotIsoString
    );

    if (!isBooked) {
      slots.push(timeString);
    }
    // Add 30 minutes
    current.setMinutes(current.getMinutes() + 30);
  }

  res.json(slots);
});

app.get('/api/working-shift/:tenantId', (req, res) => {
  const db = readDb();
  res.json(db.working_shifts[req.params.tenantId] || {});
});

app.put('/api/working-shift/:tenantId', (req, res) => {
  const db = readDb();
  db.working_shifts[req.params.tenantId] = req.body;
  writeDb(db);
  res.json({ success: true });
});

// ----------------------------------------
// Settings / Integrations Endpoints
// ----------------------------------------
app.get('/api/integrations', (req, res) => {
  const db = readDb();
  res.json(db.integrations || {});
});

app.put('/api/integrations', (req, res) => {
  const db = readDb();
  db.integrations = {
    ...(db.integrations || {}),
    ...req.body
  };
  writeDb(db);
  res.json(db.integrations);
});

// ----------------------------------------
// AI Brain chat endpoint
// ----------------------------------------
app.post('/api/chat', async (req, res) => {
  const db = readDb();
  const { message, history = [], tenantId = 't-1', agentId = 'a-1' } = req.body;

  const agent = db.agents.find(a => a.id === agentId) || db.agents[0];
  const integrations = db.integrations || {};

  // Retrieve relevant knowledge grounding chunks (RAG)
  const groundingContext = searchKnowledgeChunks(message, db.knowledge_chunks || []);

  const apiKey = integrations.difyApiKey || process.env.OPENAI_API_KEY;

  if (apiKey) {
    // Call live OpenAI
    try {
      const messages = [
        {
          role: 'system',
          content: `${agent.prompt}\n\nGrounding Context Knowledge:\n${groundingContext.join('\n')}\n\nConstraint: If scheduling a calendar slot, insert a tag like "[BOOK: YYYY-MM-DDTHH:MM]" in the text when appointment details are confirmed.`
        },
        ...history.map(msg => ({
          role: msg.sender === 'customer' || msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text || msg.content
        })),
        { role: 'user', content: message }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.5
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API responded with ${response.status}`);
      }

      const resData = await response.json();
      const reply = resData.choices[0].message.content;
      
      return res.json({
        text: reply,
        reasoning: `Retrieved ${groundingContext.length} knowledge chunks.\nOpenAI API Call executed successfully.`
      });
    } catch (err) {
      console.error('Error during OpenAI Call:', err);
    }
  }

  // Fallback reasoning simulation
  setTimeout(() => {
    let reply = `I am ${agent.name}, your virtual coordinator. I received your message: "${message}".`;
    let reasoning = `Retrieved ${groundingContext.length} knowledge chunks.\nSimulated offline fallback.`;

    const textLower = message.toLowerCase();
    if (textLower.includes('hour') || textLower.includes('open') || textLower.includes('time')) {
      reply = `We are open Monday to Friday, 9:00 AM to 6:00 PM. Would you like to schedule a slot during these hours?`;
    } else if (textLower.includes('book') || textLower.includes('appointment') || textLower.includes('schedule')) {
      reply = `I can help you schedule that! We have open slots tomorrow morning at 10:00 AM or tomorrow afternoon at 2:30 PM. Which one works for you?`;
    } else if (groundingContext.length > 0) {
      reply = `Based on our guides: "${groundingContext[0].substring(0, 150)}..." How can I help you further with this?`;
    }

    res.json({ text: reply, reasoning });
  }, 1000);
});

// ----------------------------------------
// CrewAI Native Execution Route
// ----------------------------------------
app.post('/api/crew/run', async (req, res) => {
  const db = readDb();
  const { crewAgents, tasks, inputs = {} } = req.body;

  if (!crewAgents || !tasks || !Array.isArray(crewAgents) || !Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Parameters crewAgents and tasks are required and must be arrays.' });
  }

  const apiKey = db.integrations?.difyApiKey || process.env.OPENAI_API_KEY;

  try {
    const result = await runCrew({
      crewAgentIds: crewAgents,
      tasks,
      inputs,
      db,
      apiKey
    });
    res.json(result);
  } catch (err) {
    console.error('CrewAI Execution Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------
// Twilio Voice AI Gateway
// ----------------------------------------

// Inbound Voice webhook
app.post('/api/voice/inbound', (req, res) => {
  const db = readDb();
  const caller = req.body.From || 'Unknown Phone';
  const called = req.body.To || 'Attendant';

  // Find or create contact
  let contact = db.contacts.find(c => c.phone === caller);
  if (!contact) {
    contact = {
      id: `c-voice-${Date.now()}`,
      name: `Call Customer (${caller.substring(caller.length - 4)})`,
      email: '',
      phone: caller,
      company: 'Individual',
      tags: ['Voice Lead', 'Inbound Call'],
      notes: [`Created via inbound call to ${called}.`],
      createdAt: new Date().toISOString(),
      city: 'Inbound Call',
      assignedAgentId: 'a-1'
    };
    db.contacts.push(contact);
  }

  // Create conversation log
  const convId = `conv-voice-${Date.now()}`;
  const welcomeText = "Hello! Thank you for calling. I am Sarah, your AI coordinator. How can I help you today?";
  
  const newConv = {
    id: convId,
    contactId: contact.id,
    status: 'ai_active',
    channel: 'voice',
    messages: [
      { id: `m-welcome-${Date.now()}`, sender: 'ai', text: welcomeText, timestamp: new Date().toISOString() }
    ],
    lastMessageText: welcomeText,
    lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    assignedAgentId: 'a-1',
    unreadCount: 0
  };
  db.conversations.push(newConv);
  writeDb(db);

  // Return welcome TwiML response
  res.type('text/xml');
  res.send(`
    <Response>
      <Say voice="Polly.Kimberly">${welcomeText}</Say>
      <Gather input="speech" action="/api/voice/gather?convId=${convId}&amp;contactId=${contact.id}" timeout="3" speechModel="phone_call" />
    </Response>
  `);
});

// Voice gather loop webhook
app.post('/api/voice/gather', async (req, res) => {
  const db = readDb();
  const convId = req.query.convId;
  const contactId = req.query.contactId;
  const speechInput = req.body.SpeechResult;

  if (!speechInput) {
    res.type('text/xml');
    return res.send(`
      <Response>
        <Say voice="Polly.Kimberly">I didn't catch that. Could you please repeat?</Say>
        <Gather input="speech" action="/api/voice/gather?convId=${convId}&amp;contactId=${contactId}" timeout="3" speechModel="phone_call" />
      </Response>
    `);
  }

  const convIndex = db.conversations.findIndex(c => c.id === convId);
  const contactIndex = db.contacts.findIndex(c => c.id === contactId);

  // Log user utterance
  if (convIndex !== -1) {
    db.conversations[convIndex].messages.push({
      id: `m-usr-${Date.now()}`,
      sender: 'customer',
      text: speechInput,
      timestamp: new Date().toISOString()
    });
  }

  // Generate response from AI Chat completions
  const agent = db.agents[0];
  const history = convIndex !== -1 ? db.conversations[convIndex].messages : [];
  
  let replyText = "I am processing your request. Please hold on.";
  const groundingContext = searchKnowledgeChunks(speechInput, db.knowledge_chunks || []);
  const apiKey = db.integrations?.difyApiKey || process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const messages = [
        {
          role: 'system',
          content: `${agent.prompt}\n\nGrounding Context Knowledge:\n${groundingContext.join('\n')}\n\nConstraint: If booking is completed, output the tag "[BOOK: YYYY-MM-DDTHH:MM]" matching tomorrow afternoon or target time.`
        },
        ...history.slice(-6).map(msg => ({
          role: msg.sender === 'customer' ? 'user' : 'assistant',
          content: msg.text
        })),
        { role: 'user', content: speechInput }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.5
        })
      });

      if (response.ok) {
        const resData = await response.json();
        replyText = resData.choices[0].message.content;
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    // Simulated offline fallback response
    const textLower = speechInput.toLowerCase();
    if (textLower.includes('hour') || textLower.includes('open')) {
      replyText = "We are open Monday to Friday from 9 AM to 6 PM. Would you like to schedule an appointment?";
    } else if (textLower.includes('book') || textLower.includes('appointment')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().substring(0, 10) + 'T14:30';
      replyText = `I can book that for you. I've set you up for tomorrow at 2:30 PM. [BOOK: ${tomorrowStr}]`;
    } else {
      replyText = "Thank you. Let me check our guides for that information. What else can I help you with?";
    }
  }

  // Check if AI output includes the appointment booking tag
  // Pattern: [BOOK: YYYY-MM-DDTHH:MM]
  const bookRegex = /\[BOOK:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})\]/i;
  const match = replyText.match(bookRegex);

  if (match && match[1]) {
    const dateTimeStr = match[1];
    // Create actual appointment slot in database
    const newApp = {
      id: `app-voice-${Date.now()}`,
      contactId,
      agentId: 'a-1',
      dateTime: dateTimeStr,
      duration: 30,
      location: 'Smile Dental Clinic Office',
      type: 'Voice AI Phone Booking',
      status: 'scheduled'
    };
    db.appointments.push(newApp);

    // Save note to contact
    if (contactIndex !== -1) {
      db.contacts[contactIndex].notes.push(`Booked slot via Phone Call: tomorrow at ${new Date(dateTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }

    // Strip out the bracket tag from spoken speech reply
    replyText = replyText.replace(bookRegex, '').trim();
  }

  // Log AI response in conversation
  if (convIndex !== -1) {
    db.conversations[convIndex].messages.push({
      id: `m-ai-${Date.now()}`,
      sender: 'ai',
      text: replyText,
      timestamp: new Date().toISOString()
    });
    db.conversations[convIndex].lastMessageText = replyText;
    db.conversations[convIndex].lastMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  writeDb(db);

  // Return TwiML with next speech gather
  res.type('text/xml');

  // If conversation is wrapping up
  const isGoodbye = speechInput.toLowerCase().includes('goodbye') || speechInput.toLowerCase().includes('thank you, bye');
  if (isGoodbye) {
    return res.send(`
      <Response>
        <Say voice="Polly.Kimberly">${replyText}</Say>
        <Hangup />
      </Response>
    `);
  }

  res.send(`
    <Response>
      <Say voice="Polly.Kimberly">${replyText}</Say>
      <Gather input="speech" action="/api/voice/gather?convId=${convId}&amp;contactId=${contactId}" timeout="3" speechModel="phone_call" />
    </Response>
  `);
});

// Outbound Connect Webhook (TwiML response when answered)
app.post('/api/voice/outbound-connect', (req, res) => {
  const { tenantId = 't-1', agentId = 'a-1', goal = 'Follow up' } = req.query;
  const db = readDb();
  const agent = db.agents.find(a => a.id === agentId) || db.agents[0];

  const welcomeText = `Hello! This is ${agent.name} calling from ${db.tenants.find(t => t.id === tenantId)?.name || 'Smile Dental'}. I am calling to discuss: ${goal}. How are you doing today?`;

  const contactPhone = req.body.To || 'Unknown';
  let contact = db.contacts.find(c => c.phone === contactPhone);
  if (!contact) {
    contact = {
      id: `c-voice-${Date.now()}`,
      name: `Campaign Call (${contactPhone.substring(contactPhone.length - 4)})`,
      email: '',
      phone: contactPhone,
      company: 'Campaign Outbound',
      tags: ['Voice Lead', 'Outbound Campaign'],
      notes: [`Outbound campaign call initiated for ${goal}`],
      createdAt: new Date().toISOString(),
      city: 'Outbound',
      assignedAgentId: agentId
    };
    db.contacts.push(contact);
  }

  const convId = `conv-voice-ob-${Date.now()}`;
  const newConv = {
    id: convId,
    contactId: contact.id,
    status: 'ai_active',
    channel: 'voice',
    messages: [
      { id: `m-welcome-${Date.now()}`, sender: 'ai', text: welcomeText, timestamp: new Date().toISOString() }
    ],
    lastMessageText: welcomeText,
    lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    assignedAgentId: agentId,
    unreadCount: 0
  };
  db.conversations.push(newConv);
  writeDb(db);

  res.type('text/xml');
  res.send(`
    <Response>
      <Say voice="Polly.Kimberly">${welcomeText}</Say>
      <Gather input="speech" action="/api/voice/gather?convId=${convId}&amp;contactId=${contact.id}" timeout="3" speechModel="phone_call" />
    </Response>
  `);
});

// Outbound trigger REST endpoint
app.post('/api/voice/outbound', async (req, res) => {
  const db = readDb();
  const { phone, tenantId = 't-1', agentId = 'a-1', goal = 'Confirmation follow up' } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone parameter is required' });
  }

  const twilioSid = db.integrations?.twilioAccountSid;
  const twilioToken = db.integrations?.twilioAuthToken;
  const twilioNumber = db.integrations?.twilioPhoneNumber;

  if (!twilioSid || !twilioToken || !twilioNumber) {
    return res.status(400).json({ error: 'Twilio configurations are not set in Integration settings.' });
  }

  try {
    // Dynamic import to avoid crash if twilio module is not loaded yet
    const { default: twilio } = await import('twilio');
    const client = twilio(twilioSid, twilioToken);
    
    // Construct local base URL (using public URL if deployed or request headers host)
    const host = req.get('host');
    const protocol = req.protocol;
    const connectUrl = `${protocol}://${host}/api/voice/outbound-connect?tenantId=${tenantId}&agentId=${agentId}&goal=${encodeURIComponent(goal)}`;

    const call = await client.calls.create({
      url: connectUrl,
      to: phone,
      from: twilioNumber
    });

    res.json({ success: true, callSid: call.sid });
  } catch (err) {
    console.error('Twilio Outbound Dial Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend dist static assets in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`AiraOS custom production backend running on port ${PORT}`);
});
