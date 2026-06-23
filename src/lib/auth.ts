import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_jwt_key_123456";

export interface UserJWTPayload {
  userId: string;
  email: string;
  name: string;
  role: "FOUNDER" | "CO-FOUNDER" | "MANAGER" | "EDITOR" | "PHOTOGRAPHER" | "VIDEOGRAPHER" | "INTERN";
}

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Bytes(ascii: string): number[] {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let words: number[] = [];
  const asciiLength = ascii.length * 8;
  
  let asciiPadded = ascii + '\x80';
  while (asciiPadded.length % 64 - 56) asciiPadded += '\x00';
  for (i = 0; i < asciiPadded.length; i++) {
    j = asciiPadded.charCodeAt(i);
    words[i >> 2] |= j << (24 - (i % 4) * 8);
  }
  words.push(Math.floor(asciiLength / maxWord));
  words.push(asciiLength | 0);
  
  const w: number[] = [];
  for (i = 0; i < words.length; i += 16) {
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3], e = hash[4], f = hash[5], g = hash[6], h = hash[7];
    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j];
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      const temp1 = (h + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & f) ^ (~e & g)) + k[j] + w[j]) | 0;
      const temp2 = ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }
  
  const bytes: number[] = [];
  for (i = 0; i < 8; i++) {
    const val = hash[i];
    bytes.push((val >>> 24) & 255);
    bytes.push((val >>> 16) & 255);
    bytes.push((val >>> 8) & 255);
    bytes.push(val & 255);
  }
  return bytes;
}

function base64urlEncodeBytes(bytes: number[]): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlEncodeString(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const arr: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    arr.push(bytes[i]);
  }
  return base64urlEncodeBytes(arr);
}

function base64urlDecodeString(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function hmacSha256(message: string, key: string): number[] {
  let keyBytes: number[] = [];
  for (let i = 0; i < key.length; i++) {
    keyBytes.push(key.charCodeAt(i));
  }
  if (keyBytes.length > 64) {
    keyBytes = sha256Bytes(key);
  }
  while (keyBytes.length < 64) {
    keyBytes.push(0);
  }
  const ipad = new Array(64);
  const opad = new Array(64);
  for (let i = 0; i < 64; i++) {
    ipad[i] = keyBytes[i] ^ 0x36;
    opad[i] = keyBytes[i] ^ 0x5c;
  }
  
  let innerMsg = "";
  for (let i = 0; i < 64; i++) {
    innerMsg += String.fromCharCode(ipad[i]);
  }
  innerMsg += message;
  const innerHash = sha256Bytes(innerMsg);
  
  let outerMsg = "";
  for (let i = 0; i < 64; i++) {
    outerMsg += String.fromCharCode(opad[i]);
  }
  for (let i = 0; i < innerHash.length; i++) {
    outerMsg += String.fromCharCode(innerHash[i]);
  }
  return sha256Bytes(outerMsg);
}

export function signJWT(payload: UserJWTPayload): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlEncodeString(JSON.stringify(header));
  const expPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days
  };
  const encodedPayload = base64urlEncodeString(JSON.stringify(expPayload));
  const sigBytes = hmacSha256(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);
  const encodedSignature = base64urlEncodeBytes(sigBytes);
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export function verifyJWT(token: string): UserJWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const sigBytes = hmacSha256(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);
    const computedSignature = base64urlEncodeBytes(sigBytes);
    
    if (computedSignature !== encodedSignature) {
      return null;
    }
    const payload = JSON.parse(base64urlDecodeString(encodedPayload));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    return payload as UserJWTPayload;
  } catch (err) {
    return null;
  }
}

export function getAuthUser(req: NextRequest): UserJWTPayload | null {
  const cookieToken = req.cookies.get("token")?.value;
  if (!cookieToken) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return verifyJWT(authHeader.substring(7));
    }
    return null;
  }
  return verifyJWT(cookieToken);
}

export function hasPermission(
  userRole: string,
  requiredRoles: ("FOUNDER" | "CO-FOUNDER" | "MANAGER" | "EDITOR" | "PHOTOGRAPHER" | "VIDEOGRAPHER" | "INTERN")[]
): boolean {
  return requiredRoles.includes(userRole as any);
}
