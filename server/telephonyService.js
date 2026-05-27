import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import { readDb, writeDb } from './db.js';
import { decryptCredentials } from './vault.js';
import { getRedisClient } from './redisClient.js';

// In-memory fallback if Redis is unavailable
const memorySessions = new Map();

// Helper to manage call sessions
async function getCallSession(callSid) {
  try {
    const redis = await getRedisClient();
    const data = await redis.get(`call_session:${callSid}`);
    return data ? JSON.parse(data) : memorySessions.get(callSid) || null;
  } catch (err) {
    return memorySessions.get(callSid) || null;
  }
}

async function saveCallSession(callSid, sessionObj) {
  try {
    const redis = await getRedisClient();
    await redis.set(`call_session:${callSid}`, JSON.stringify(sessionObj), { EX: 3600 });
    memorySessions.set(callSid, sessionObj);
  } catch (err) {
    memorySessions.set(callSid, sessionObj);
  }
}

async function deleteCallSession(callSid) {
  try {
    const redis = await getRedisClient();
    await redis.del(`call_session:${callSid}`);
    memorySessions.delete(callSid);
  } catch (err) {
    memorySessions.delete(callSid);
  }
}

// Low-latency LLM streaming function supporting OpenAI, Gemini, and DeepSeek
async function callModelStream(provider, apiKey, messages, onChunk, onDone, onError, temperature = 0.5) {
  try {
    let url = 'https://api.openai.com/v1/chat/completions';
    let headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    let body = {};

    if (provider === 'gemini') {
      const systemMessage = messages.find(m => m.role === 'system');
      const systemPrompt = systemMessage ? systemMessage.content : '';
      
      const geminiContents = [];
      messages.forEach(msg => {
        if (msg.role === 'system') return;
        const role = (msg.role === 'user') ? 'user' : 'model';
        if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === role) {
          geminiContents[geminiContents.length - 1].parts[0].text += '\n' + msg.content;
        } else {
          geminiContents.push({
            role: role,
            parts: [{ text: msg.content }]
          });
        }
      });

      if (geminiContents.length > 0 && geminiContents[0].role === 'model') {
        geminiContents.shift();
      }
      if (geminiContents.length === 0) {
        geminiContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
      }

      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      body = {
        contents: geminiContents,
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
        generationConfig: { temperature }
      };
    } else if (provider === 'deepseek') {
      url = 'https://api.deepseek.com/chat/completions';
      body = {
        model: 'deepseek-chat',
        messages,
        temperature,
        stream: true
      };
    } else {
      // Default: OpenAI
      body = {
        model: 'gpt-4o-mini',
        messages,
        temperature,
        stream: true
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM API returned status ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep partial line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (provider === 'gemini') {
          // Gemini streaming response parser
          try {
            const data = JSON.parse(trimmed);
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
              const text = data.candidates[0].content.parts[0].text;
              fullText += text;
              onChunk(text);
            }
          } catch (e) {
            // Ignore incomplete chunks
          }
        } else {
          // OpenAI / DeepSeek SSE Stream parser
          if (trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.slice(6);
              const data = JSON.parse(jsonStr);
              if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                const text = data.choices[0].delta.content;
                fullText += text;
                onChunk(text);
              }
            } catch (e) {
              // Ignore incomplete JSON
            }
          }
        }
      }
    }
    onDone(fullText);
  } catch (err) {
    onError(err);
  }
}

export function initTelephonyService(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const parsedUrl = url.parse(request.url, true);
    if (parsedUrl.pathname === '/api/voice/stream') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (connection, req) => {
    console.log('[TELEPHONY] Incoming voice WebSocket stream connection established.');

    const parsedUrl = url.parse(req.url, true);
    const tenantId = parsedUrl.query.tenantId || 't-1';
    const agentId = parsedUrl.query.agentId || 'a-1';
    const contactId = parsedUrl.query.contactId;
    const convId = parsedUrl.query.convId;

    // Load credentials from database
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId);
    const integrations = decryptCredentials({ 
      ...(db.integrations || {}), 
      ...(tenant?.integrations || {}), 
      ...(tenant?.settings || {}) 
    });

    const activeProvider = integrations.activeModelProvider || 'openai';
    let apiKey = '';
    if (activeProvider === 'gemini') {
      apiKey = integrations.geminiApiKey || process.env.GEMINI_API_KEY;
    } else if (activeProvider === 'deepseek') {
      apiKey = integrations.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    } else {
      apiKey = integrations.openaiApiKey || process.env.OPENAI_API_KEY;
    }

    const deepgramApiKey = integrations.deepgramApiKey || process.env.DEEPGRAM_API_KEY;
    const cartesiaApiKey = integrations.cartesiaApiKey;
    const elevenLabsApiKey = integrations.elevenLabsApiKey;
    const cartesiaVoiceId = integrations.cartesiaVoiceId || 'e58c8ca2-5959-450f-90e8-6af5d99f7a62'; // default sonic
    const elevenLabsVoiceId = integrations.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM'; // default Rachel

    const agent = db.agents.find(a => a.id === agentId && a.tenantId === tenantId) || db.agents[0];

    // Build context
    const allChunks = db.knowledge_chunks || [];
    const tenantChunks = allChunks.filter(chunk => {
      const chunkTenantId = chunk.tenantId || (
        (chunk.sourceId === 'ks-5' || chunk.sourceId === 'ks-6') ? 't-2' : 
        (chunk.sourceId === 'ks-7') ? 't-3' : 't-1'
      );
      return chunkTenantId === tenantId;
    });

    let streamSid = '';
    let callSid = '';
    let isSpeaking = false;
    let deepgramSocket = null;
    let textBuffer = '';
    let ttsQueue = [];
    let llmController = null;
    let ttsSockets = [];

    // Interruption / Barge-in trigger
    const triggerInterruption = () => {
      if (isSpeaking) {
        console.log('[TELEPHONY] Interruption detected. Clearing Twilio buffer and active generation.');
        
        // Stop current LLM generation
        if (llmController) {
          llmController.abort();
        }

        // Close all active TTS stream sockets
        ttsSockets.forEach(socket => {
          try { socket.close(); } catch (e) {}
        });
        ttsSockets = [];

        // Clear Twilio buffer
        if (streamSid) {
          connection.send(JSON.stringify({
            event: 'clear',
            streamSid: streamSid
          }));
        }

        isSpeaking = false;
        ttsQueue = [];
      }
    };

    // Deepgram Streaming Speech-to-Text Connection
    if (deepgramApiKey) {
      const deepgramUrl = 'wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000&channels=1&interim_results=true&endpointing=300';
      deepgramSocket = new WebSocket(deepgramUrl, {
        headers: {
          Authorization: `Token ${deepgramApiKey}`
        }
      });

      deepgramSocket.on('open', () => {
        console.log('[DEEPGRAM] Connected to Deepgram Streaming API.');
      });

      deepgramSocket.on('message', async (data) => {
        try {
          const response = JSON.parse(data.toString());
          const transcript = response.channel?.alternatives[0]?.transcript || '';
          
          if (transcript.trim()) {
            console.log(`[DEEPGRAM] Transcript: "${transcript}" (is_final: ${response.is_final})`);
            
            // Check for interruption early
            if (isSpeaking) {
              triggerInterruption();
            }

            if (response.is_final) {
              // Complete utterance detected
              textBuffer += ' ' + transcript;
              
              // debounce or immediately invoke LLM
              const fullSpeech = textBuffer.trim();
              textBuffer = '';

              if (fullSpeech) {
                console.log(`[TELEPHONY] User complete speech: "${fullSpeech}"`);
                
                // Save to database conversation history
                const currentDb = readDb();
                const convIndex = currentDb.conversations.findIndex(c => c.id === convId);
                if (convIndex !== -1) {
                  currentDb.conversations[convIndex].messages.push({
                    id: `m-usr-${Date.now()}`,
                    sender: 'customer',
                    text: fullSpeech,
                    timestamp: new Date().toISOString()
                  });
                  writeDb(currentDb);
                }

                // Generate agent response
                await generateAgentReply(fullSpeech);
              }
            }
          }
        } catch (e) {
          console.error('[DEEPGRAM] Error parsing message:', e);
        }
      });

      deepgramSocket.on('error', (err) => {
        console.error('[DEEPGRAM] WebSocket error:', err);
      });

      deepgramSocket.on('close', () => {
        console.log('[DEEPGRAM] Closed connection.');
      });

      // Keepalive timer
      const keepAliveInterval = setInterval(() => {
        if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
          deepgramSocket.send(JSON.stringify({ type: 'KeepAlive' }));
        }
      }, 10000);

      connection.on('close', () => {
        clearInterval(keepAliveInterval);
        try { deepgramSocket.close(); } catch (e) {}
      });
    } else {
      console.warn('[TELEPHONY] Deepgram API Key not configured. STT will be unavailable.');
    }

    // TTS Stream client
    const playAudioChunk = (base64Audio) => {
      if (connection.readyState === WebSocket.OPEN && streamSid) {
        connection.send(JSON.stringify({
          event: 'media',
          streamSid: streamSid,
          media: {
            payload: base64Audio
          }
        }));
      }
    };

    // Cartesia low-latency websocket streaming
    const streamCartesiaTTS = (text) => {
      if (!cartesiaApiKey) return;
      
      const cartesiaWsUrl = `wss://api.cartesia.ai/tts/websocket?v=1&api_key=${cartesiaApiKey}`;
      const ws = new WebSocket(cartesiaWsUrl);
      ttsSockets.push(ws);

      ws.on('open', () => {
        isSpeaking = true;
        ws.send(JSON.stringify({
          model_id: 'sonic-english',
          transcript: text,
          voice: {
            mode: 'id',
            id: cartesiaVoiceId
          },
          output_format: {
            container: 'raw',
            encoding: 'mulaw',
            sample_rate: 8000
          }
        }));
      });

      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.data) {
            playAudioChunk(response.data);
          }
        } catch (e) {}
      });

      ws.on('close', () => {
        const idx = ttsSockets.indexOf(ws);
        if (idx > -1) ttsSockets.splice(idx, 1);
      });
    };

    // ElevenLabs low-latency HTTP chunk-based stream
    const streamElevenLabsTTS = async (text) => {
      if (!elevenLabsApiKey) return;
      try {
        isSpeaking = true;
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}/stream?output_format=ulaw_8000`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsApiKey
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });

        if (!response.ok) return;
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // value is Uint8Array of mulaw audio. Convert to base64
          const base64Audio = Buffer.from(value).toString('base64');
          playAudioChunk(base64Audio);
        }
      } catch (err) {
        console.error('[ELEVENLABS] Streaming error:', err);
      }
    };

    // Fallback: OpenAI TTS
    const streamOpenAITTS = async (text) => {
      if (!apiKey) return;
      try {
        isSpeaking = true;
        // Fetch raw PCM/MP3 from OpenAI TTS
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: 'alloy',
            response_format: 'pcm' // Raw 24kHz PCM
          })
        });

        if (!response.ok) return;
        const arrayBuffer = await response.arrayBuffer();
        const pcmBuffer = Buffer.from(arrayBuffer);

        // Simple PCM downsampling (24kHz to 8kHz) and Mu-Law encoding
        const mulawPayload = encodeMuLaw8k(pcmBuffer);
        playAudioChunk(mulawPayload.toString('base64'));
      } catch (err) {
        console.error('[OPENAI TTS] Streaming error:', err);
      }
    };

    // Helper: PCM 24kHz 16-bit to Mu-Law 8kHz mono encoder
    function encodeMuLaw8k(buffer) {
      const sampleRatio = 3; // 24000 / 8000
      const outSamples = Math.floor(buffer.length / (2 * sampleRatio));
      const outBuffer = Buffer.alloc(outSamples);

      for (let i = 0; i < outSamples; i++) {
        const srcIdx = i * sampleRatio * 2;
        if (srcIdx + 1 >= buffer.length) break;
        
        // Read 16-bit linear PCM sample
        const sample = buffer.readInt16LE(srcIdx);
        
        // Encode sample to Mu-Law byte
        outBuffer[i] = linearToMuLaw(sample);
      }
      return outBuffer;
    }

    function linearToMuLaw(sample) {
      const BIAS = 0x84;
      const CLIP = 32635;
      let sign = (sample >> 16) & 0x80;
      if (sample < 0) {
        sample = -sample;
        sign = 0x80;
      }
      if (sample > CLIP) sample = CLIP;
      sample += BIAS;
      let exponent = 7;
      for (let mask = 0x4000; (sample & mask) === 0; sample <<= 1) {
        exponent--;
        if (exponent === 0) break;
      }
      const mantissa = (sample >> (exponent + 3)) & 0x0F;
      const mulaw = ~(sign | (exponent << 4) | mantissa);
      return mulaw & 0xFF;
    }

    // Direct audio streaming selector
    const speakText = (text) => {
      console.log(`[TELEPHONY] Bot starting to speak: "${text}"`);
      if (cartesiaApiKey) {
        streamCartesiaTTS(text);
      } else if (elevenLabsApiKey) {
        streamElevenLabsTTS(text);
      } else {
        streamOpenAITTS(text);
      }
    };

    // Retrieve grounding context from Knowledge chunks
    const searchKnowledgeChunks = (query, chunks) => {
      const qLower = query.toLowerCase();
      const hits = [];
      for (const chunk of chunks) {
        if (!chunk.content) continue;
        const text = chunk.content.toLowerCase();
        let score = 0;
        const words = qLower.split(/\s+/);
        for (const word of words) {
          if (word.length > 3 && text.includes(word)) {
            score++;
          }
        }
        if (score > 0) {
          hits.push({ chunk, score });
        }
      }
      hits.sort((a, b) => b.score - a.score);
      return hits.slice(0, 3).map(h => h.chunk.content);
    };

    // Master function generating AI Response
    const generateAgentReply = async (userInput) => {
      llmController = new AbortController();
      const currentDb = readDb();
      const convIndex = currentDb.conversations.findIndex(c => c.id === convId);
      const history = convIndex !== -1 ? currentDb.conversations[convIndex].messages : [];

      const groundingContext = searchKnowledgeChunks(userInput, tenantChunks);
      const systemPrompt = `${agent.prompt}\n\nGrounding Context Knowledge:\n${groundingContext.join('\n')}\n\nConstraint: Keep responses conversational, concise, and straight to the point. If booking is completed, output the tag "[BOOK: YYYY-MM-DDTHH:MM]" matching tomorrow afternoon or target time.`;

      const apiHistory = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-8).map(msg => ({
          role: msg.sender === 'customer' ? 'user' : 'assistant',
          content: msg.text
        }))
      ];

      let sentenceBuffer = '';
      
      const onChunk = (text) => {
        sentenceBuffer += text;
        
        // Find sentence boundaries to send chunks to TTS
        const sentenceBoundary = /[.!?\n]/;
        if (sentenceBoundary.test(sentenceBuffer)) {
          const parts = sentenceBuffer.split(sentenceBoundary);
          const finishedSentence = parts.shift().trim();
          sentenceBuffer = parts.join(' ');

          if (finishedSentence.length > 0) {
            speakText(finishedSentence);
          }
        }
      };

      const onDone = (fullResponse) => {
        // Send any remaining characters in the sentence buffer
        const remaining = sentenceBuffer.trim();
        if (remaining.length > 0) {
          speakText(remaining);
        }

        console.log(`[TELEPHONY] LLM streaming completed. Full response: "${fullResponse}"`);

        // Check for appointments
        const bookRegex = /\[BOOK:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})\]/i;
        const match = fullResponse.match(bookRegex);

        let finalCleanText = fullResponse;
        if (match && match[1]) {
          const dateTimeStr = match[1];
          const newApp = {
            id: `app-voice-${Date.now()}`,
            tenantId,
            contactId,
            agentId,
            dateTime: dateTimeStr,
            duration: 30,
            location: 'Company Phone Routing Scheduler',
            type: 'Voice AI Phone Booking',
            status: 'scheduled'
          };
          
          const saveDb = readDb();
          saveDb.appointments.push(newApp);
          
          const contactIndex = saveDb.contacts.findIndex(c => c.id === contactId);
          if (contactIndex !== -1) {
            saveDb.contacts[contactIndex].notes.push(`Booked slot via real-time phone stream: ${new Date(dateTimeStr).toLocaleString()}`);
          }
          writeDb(saveDb);

          finalCleanText = finalCleanText.replace(bookRegex, '').trim();
        }

        // Save bot response to database history
        const finalDb = readDb();
        const finalConvIndex = finalDb.conversations.findIndex(c => c.id === convId);
        if (finalConvIndex !== -1) {
          finalDb.conversations[finalConvIndex].messages.push({
            id: `m-ai-${Date.now()}`,
            sender: 'ai',
            text: finalCleanText,
            timestamp: new Date().toISOString()
          });
          finalDb.conversations[finalConvIndex].lastMessageText = finalCleanText;
          finalDb.conversations[finalConvIndex].lastMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          writeDb(finalDb);
        }
      };

      const onError = (err) => {
        console.error('[TELEPHONY] LLM streaming error:', err);
      };

      await callModelStream(activeProvider, apiKey, apiHistory, onChunk, onDone, onError);
    };

    // Receive message packets from Twilio connection stream
    connection.on('message', async (message) => {
      try {
        const msg = JSON.parse(message.toString());
        
        switch (msg.event) {
          case 'start':
            streamSid = msg.start.streamSid;
            callSid = msg.start.callSid;
            console.log(`[TELEPHONY] Call stream started: StreamSid ${streamSid}, CallSid ${callSid}`);
            
            // Save call context
            await saveCallSession(callSid, {
              tenantId,
              agentId,
              contactId,
              convId,
              streamSid
            });
            
            // Play initial greeting
            const welcomeText = `Hello! Thank you for calling. I am ${agent.name}, your virtual assistant. How can I help you today?`;
            speakText(welcomeText);
            break;

          case 'media':
            // Direct audio chunk from caller. Send to Deepgram Streaming API
            if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
              const buffer = Buffer.from(msg.media.payload, 'base64');
              deepgramSocket.send(buffer);
            }
            break;

          case 'stop':
            console.log(`[TELEPHONY] Call stream stop event received for streamSid ${streamSid}`);
            await deleteCallSession(callSid);
            break;
        }
      } catch (err) {
        console.error('[TELEPHONY] Error parsing incoming media message:', err);
      }
    });

    connection.on('close', async () => {
      console.log('[TELEPHONY] WebSocket connection closed.');
      if (callSid) {
        await deleteCallSession(callSid);
      }
    });
  });
}
