import { readDb, writeDb } from '../server/db.js';

console.log("Reading DB...");
const db = readDb();
const tenant = db.tenants.find(t => t.id === 't-1');
console.log("Current tenant websiteConfig:", tenant.websiteConfig);

console.log("Adding mock websiteConfig...");
tenant.websiteConfig = {
  businessName: "Smile Dentals",
  slogan: "Slogan Test",
  html: "<h1>Test HTML</h1>",
  isWebsiteGenerated: true
};

console.log("Writing DB...");
writeDb(db);

console.log("Reading DB again to verify...");
const db2 = readDb();
const tenant2 = db2.tenants.find(t => t.id === 't-1');
console.log("Verified tenant websiteConfig:", tenant2.websiteConfig);

console.log("Cleaning up mock websiteConfig...");
delete tenant2.websiteConfig;
writeDb(db2);
console.log("Done!");
