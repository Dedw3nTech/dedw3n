// Password migration script to convert all existing passwords to enhanced pepper-based security
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const PASSWORD_PEPPER = 'DedW3nSecurePepper2025!@#';

// Known passwords for existing users
const USER_PASSWORDS = {
  'admin': 'admin123',
  'Da Costa': 'test123', 
  'Serruti': 'test123'
};

async function hashPasswordWithPepper(password) {
  const pepperedPassword = password + PASSWORD_PEPPER;
  const salt = randomBytes(16).toString("hex");
  const keylen = 32;
  
  const buf = await scryptAsync(pepperedPassword, salt, keylen);
  return `${buf.toString("hex")}.${salt}`;
}

async function generateNewPasswords() {
  console.log('Generating enhanced pepper-based password hashes...');
  
  for (const [username, password] of Object.entries(USER_PASSWORDS)) {
    const hashedPassword = await hashPasswordWithPepper(password);
    console.log(`UPDATE users SET password = '${hashedPassword}' WHERE username = '${username}';`);
  }
}

generateNewPasswords().catch(console.error);