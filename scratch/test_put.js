import { readDb, writeDb } from '../server/db.js';

const db = readDb();
const tenantId = 't-1';
const tenantIndex = db.tenants.findIndex(t => t.id === tenantId);

console.log("Before PUT simulation:");
console.log("Tenant:", db.tenants[tenantIndex]);

const reqBody = {
  websiteConfig: {
    businessName: "Smile Dental Clinic",
    slogan: "Gentle Care, Beautiful Smiles",
    description: "At Smile Dental Clinic, we provide state-of-the-art dental care for patients of all ages.",
    services: "Teeth Whitening, Dental Cleanings, Teeth Aligners",
    phone: "+1 (555) 019-2834",
    email: "hello@smiledentalclinic.com",
    theme: "sleek-clinic",
    isWebsiteGenerated: true,
    html: "<html><body>Test HTML</body></html>"
  }
};

db.tenants[tenantIndex] = {
  ...db.tenants[tenantIndex],
  ...reqBody,
  id: tenantId
};

writeDb(db);

console.log("After PUT simulation, reading DB again:");
const db2 = readDb();
const tenant2 = db2.tenants.find(t => t.id === tenantId);
console.log("Tenant websiteConfig:", tenant2.websiteConfig);
