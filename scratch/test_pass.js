import { verifyPassword } from '../server/auth.js';
import { readDb } from '../server/db.js';

const db = readDb();
const adminUser = db.users.find(u => u.email === 'admin@gatidesk.com');

if (adminUser) {
  const result = verifyPassword('password123', adminUser.passwordHash);
  console.log('Admin password verification result (expected true):', result);
} else {
  console.log('Admin user not found!');
}

const dentalUser = db.users.find(u => u.email === 'dental@gatidesk.com');
if (dentalUser) {
  const result = verifyPassword('smile123', dentalUser.passwordHash);
  console.log('Dental password verification result (expected true):', result);
} else {
  console.log('Dental user not found!');
}
