import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DB_FILE = path.join(__dirname, 'db.json');

function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      tenants: [],
      agents: [],
      contacts: [],
      deals: [],
      conversations: [],
      appointments: [],
      working_shifts: {},
      knowledge_chunks: []
    }, null, 2), 'utf8');
  }
}

export function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return {
      tenants: [],
      agents: [],
      contacts: [],
      deals: [],
      conversations: [],
      appointments: [],
      working_shifts: {},
      knowledge_chunks: []
    };
  }
}

export function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}
