import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Obtiene la clave de encriptación desde la variable de entorno.
 * Lanza error si no está configurada.
 */
function getEncryptionKey(): string {
  const key = process.env.AFIP_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error(
      'AFIP_ENCRYPTION_KEY no está configurada o es demasiado corta. '
      + 'Debe tener al menos 32 caracteres. '
      + 'Generá una con: openssl rand -hex 32'
    );
  }
  return key;
}

/**
 * Encripta texto usando AES-256-GCM con salt aleatorio.
 * Retorna: salt:iv:authTag:ciphertext (todo en hex, separado por ':')
 */
export function encryptText(plaintext: string): string {
  const masterKey = getEncryptionKey();
  const salt = randomBytes(SALT_LENGTH);
  const key = scryptSync(masterKey, salt, KEY_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return [
    salt.toString('hex'),
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted,
  ].join(':');
}

/**
 * Desencripta texto encriptado con encryptText().
 * Espera formato: salt:iv:authTag:ciphertext (todo en hex)
 */
export function decryptText(encryptedData: string): string {
  const masterKey = getEncryptionKey();
  const parts = encryptedData.split(':');

  if (parts.length !== 4) {
    throw new Error('Formato de datos encriptados inválido');
  }

  const [saltHex, ivHex, authTagHex, ciphertext] = parts;

  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = scryptSync(masterKey, salt, KEY_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Verifica que los datos encriptados se pueden desencriptar correctamente.
 * Útil para validar que la clave de encriptación es correcta.
 */
export function verifyEncryption(encryptedData: string): boolean {
  try {
    decryptText(encryptedData);
    return true;
  } catch {
    return false;
  }
}
