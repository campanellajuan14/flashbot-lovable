
import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts"

/**
 * Verifies that a webhook request is coming from Meta by checking the signature
 */
export async function verifySignature(payload: string, signature: string, appSecret: string): Promise<boolean> {
  try {
    const signatureParts = signature.split('=');
    if (signatureParts.length !== 2) return false;
    
    const algorithm = signatureParts[0];
    const expectedSignature = signatureParts[1];
    
    if (algorithm !== 'sha256') return false;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    
    const actualSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(actualSignature));
    const actualHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return actualHex === expectedSignature;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}
