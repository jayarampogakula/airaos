import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.alloc(32, process.env.ENCRYPTION_KEY || 'aira-os-telephony-encryption-key-32');
const IV_LENGTH = 16;

const SENSITIVE_KEYS = [
  'openaiApiKey',
  'difyApiKey',
  'geminiApiKey',
  'deepseekApiKey',
  'twilioAuthToken',
  'byoSipPassword',
  'twentyApiKey',
  'deepgramApiKey',
  'cartesiaApiKey',
  'elevenLabsApiKey',
  'cartesiaVoiceId',
  'elevenLabsVoiceId'
];

export function encrypt(text) {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (err) {
    console.error('[VAULT] Encryption failed:', err);
    return text;
  }
}

export function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    // Return original text if decryption fails (assumed unencrypted)
    return text;
  }
}

export function encryptCredentials(config) {
  if (!config) return config;
  const encrypted = { ...config };
  for (const key of SENSITIVE_KEYS) {
    if (encrypted[key] && !encrypted[key].includes(':')) {
      encrypted[key] = encrypt(encrypted[key]);
    }
  }
  return encrypted;
}

export function decryptCredentials(config) {
  if (!config) return config;
  const decrypted = { ...config };
  for (const key of SENSITIVE_KEYS) {
    if (decrypted[key]) {
      decrypted[key] = decrypt(decrypted[key]);
    }
  }
  return decrypted;
}
