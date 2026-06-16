/**
 * VoiceProvider Abstraction Layer
 * Defines a provider-agnostic voice carrier interface and registry.
 */

export class VoiceProvider {
  constructor(name) {
    this.name = name;
    this.credentials = {};
  }

  async connect(credentials) {
    this.credentials = credentials;
    console.log(`[VoiceProvider:${this.name}] Connected with configurations.`);
    return true;
  }

  async disconnect() {
    console.log(`[VoiceProvider:${this.name}] Disconnected.`);
    return true;
  }

  async makeCall(params) {
    const { from, to, webhookUrl } = params;
    console.log(`[VoiceProvider:${this.name}] Initiating outbound call from ${from} to ${to} using handler: ${webhookUrl}`);
    const callSid = `call-${this.name.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return { callSid, status: 'queued' };
  }

  async answerCall(callSid, responseInstructions) {
    console.log(`[VoiceProvider:${this.name}] Answering call ${callSid} with instructions:`, responseInstructions);
    return { status: 'answered' };
  }

  async endCall(callSid) {
    console.log(`[VoiceProvider:${this.name}] Ending active call ${callSid}`);
    return true;
  }

  async transferCall(callSid, targetNumber) {
    console.log(`[VoiceProvider:${this.name}] Transferring call ${callSid} to target: ${targetNumber}`);
    return true;
  }

  async streamAudio(callSid, wsUrl) {
    console.log(`[VoiceProvider:${this.name}] Streaming audio for ${callSid} to websocket target: ${wsUrl}`);
  }

  async getRecording(callSid) {
    console.log(`[VoiceProvider:${this.name}] Retrieving recording for ${callSid}`);
    return { duration: 120, recordingUrl: `https://storage.gatidesk.com/recordings/${callSid}.mp3` };
  }

  async getTranscript(callSid) {
    console.log(`[VoiceProvider:${this.name}] Fetching provider transcript for ${callSid}`);
    return [];
  }

  async getCallStatus(callSid) {
    return 'completed';
  }

  async isHealthy() {
    return true;
  }
}

// Twilio Concrete Provider
export class TwilioVoiceProvider extends VoiceProvider {
  constructor() {
    super('Twilio');
  }

  async makeCall(params) {
    const { from, to, webhookUrl } = params;
    console.log(`[Twilio] Outbound Call SID generated.`);
    const callSid = `call-twilio-${Date.now()}`;
    return { callSid, status: 'ringing' };
  }
}

// Exotel Concrete Provider
export class ExotelVoiceProvider extends VoiceProvider {
  constructor() {
    super('Exotel');
  }
}

// Plivo Concrete Provider
export class PlivoVoiceProvider extends VoiceProvider {
  constructor() {
    super('Plivo');
  }
}

// Telnyx Concrete Provider
export class TelnyxVoiceProvider extends VoiceProvider {
  constructor() {
    super('Telnyx');
  }
}

// Vonage Concrete Provider
export class VonageVoiceProvider extends VoiceProvider {
  constructor() {
    super('Vonage');
  }
}

// Generic SIP Provider
export class SipVoiceProvider extends VoiceProvider {
  constructor() {
    super('SIP');
  }
}

// Provider Factory Registry
export class VoiceProviderFactory {
  static registry = new Map();

  static register(name, provider) {
    this.registry.set(name.toLowerCase(), provider);
  }

  static get(name) {
    const provider = this.registry.get(name.toLowerCase());
    if (!provider) {
      throw new Error(`Voice carrier provider not found in registry: ${name}`);
    }
    return provider;
  }

  static async routeCallWithFailover(dialParams, preferredProviders = ['twilio', 'exotel', 'plivo', 'sip', 'telnyx', 'vonage']) {
    for (const providerName of preferredProviders) {
      try {
        const provider = this.get(providerName);
        if (await provider.isHealthy()) {
          console.log(`[VoiceProviderFactory] Selected provider "${providerName}" for call routing.`);
          return await provider.makeCall(dialParams);
        }
      } catch (error) {
        console.warn(`[VoiceProviderFactory] Failover triggered: preferred provider "${providerName}" failed or is unhealthy: ${error.message}`);
      }
    }
    throw new Error('All voice carrier providers failed to route outbound call.');
  }
}

// Register default providers
VoiceProviderFactory.register('twilio', new TwilioVoiceProvider());
VoiceProviderFactory.register('exotel', new ExotelVoiceProvider());
VoiceProviderFactory.register('plivo', new PlivoVoiceProvider());
VoiceProviderFactory.register('telnyx', new TelnyxVoiceProvider());
VoiceProviderFactory.register('vonage', new VonageVoiceProvider());
VoiceProviderFactory.register('sip', new SipVoiceProvider());
