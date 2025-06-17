const crypto = require('crypto');
// Reference: https://nodejs.org/api/crypto.html


// Encryption algorithm 
const algorithm = 'aes-256-cbc';

// Encryption key from env file
const secretKey = process.env.ENCRYPTION_KEY;

// Define the length of the initialization vector -- REMEMBER always 16 when using AES
// https://crypto.stackexchange.com/questions/50782/what-size-of-initialization-vector-iv-is-needed-for-aes-encryption
const ivLength = 16;

console.log( 'Key:', secretKey);
console.log('Length:', secretKey.length);

//
// Encrypts a plain text string using AES-256-CBC.
// Returns a base64-encoded string
//
exports.encrypt = (text) => {
  // Generate a new random IV (Initialization Vector) for this encryption operation
  const iv = crypto.randomBytes(ivLength);

  // Create a Cipher object using the AES algorithm, the secret key, and the IV
  // https://nodejs.org/api/crypto.html#cryptocreatecipherivalgorithm-key-iv-options
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);

  // Encrypt the plain text,
  // and output it as base64 string
  // https://nodejs.org/api/crypto.html#cipherupdatedata-inputencoding-outputencoding
  let encrypted = cipher.update(text, 'utf-8', 'base64');

  
  encrypted += cipher.final('base64');

  // Convert the IV to base64 string format for storing/transmitting alongside the encrypted text
  const ivBase64 = iv.toString('base64');

  // Return the IV and encrypted text separated by a colon
  // To easily split them later for decryption
  return `${ivBase64}:${encrypted}`;

  
};

//
//Decrypts a base64-encoded string that was encrypted using the encrypt() function above
//
exports.decrypt = (encrypted) => {
  // Split the encrypted string into IV and encrypted data parts using the colon as delimiter
  const [ivBase64, encryptedText] = encrypted.split(':');

  // Convert the IV back from base64 string to a buffer
  const iv = Buffer.from(ivBase64, 'base64');

  // Create a Decipher object using the same algorithm, secret key, and IV
  // Works just like the to the Cipher object used in encryption
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);

  // Output the encrypted text, outputting as UTF-8 string
  let decrypted = decipher.update(encryptedText, 'base64', 'utf-8');

  decrypted += decipher.final('utf-8');

  // Return the original decrypted text
  return decrypted;
};
