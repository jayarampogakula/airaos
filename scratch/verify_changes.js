// Verification test script for phone number validation
function validatePhoneNumber(phoneStr) {
  const clean = phoneStr.trim();
  const digits = clean.replace(/\D/g, '');
  
  let normalized = digits;
  if (normalized.startsWith('91') && normalized.length === 12) {
    normalized = normalized.substring(2);
  } else if (normalized.startsWith('0') && normalized.length === 11) {
    normalized = normalized.substring(1);
  }
  
  const startsWithIndianMobile = /^[6-9]/.test(normalized);
  const isIndian = clean.startsWith('+91') || clean.startsWith('91') || clean.startsWith('0') || startsWithIndianMobile;
  
  if (isIndian) {
    return normalized.length === 10;
  }
  return digits.length >= 7 && digits.length <= 15;
}

const testCases = [
  { input: "96312345612", expected: false }, // 11 digits, invalid Indian
  { input: "9631234561", expected: true },   // 10 digits, valid Indian
  { input: "+919631234561", expected: true }, // +91 prefix + 10 digits, valid Indian
  { input: "09631234561", expected: true },  // 0 prefix + 10 digits, valid Indian
  { input: "919631234561", expected: true },  // 91 prefix + 10 digits, valid Indian
  { input: "96546", expected: false },        // 5 digits, invalid Indian
  { input: "+15550192834", expected: true },  // US number, valid
  { input: "123", expected: false }           // too short
];

console.log("Running validatePhoneNumber verification tests...");
let passed = true;
for (const tc of testCases) {
  const result = validatePhoneNumber(tc.input);
  if (result !== tc.expected) {
    console.error(`FAIL: input="${tc.input}" expected=${tc.expected} got=${result}`);
    passed = false;
  } else {
    console.log(`PASS: input="${tc.input}" got=${result}`);
  }
}

if (passed) {
  console.log("All phone validation tests PASSED!");
} else {
  process.exit(1);
}
