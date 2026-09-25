/**
 * WebAuthn (FIDO2) client utility helper for RailMate.
 * Uses W3C Web Authentication API (navigator.credentials.create & get).
 */

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Convert base64url string to Uint8Array
export function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Convert ArrayBuffer to base64url string
export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export interface RegisterChallengeData {
  challenge: string;
  rp_id: string;
  rp_name: string;
  user_id: string;
  user_name: string;
  user_display_name: string;
}

export interface RegisterResult {
  credential_id: string;
  public_key: string;
  transports: string;
  device_name: string;
}

export async function registerBiometricsWithBrowser(
  data: RegisterChallengeData
): Promise<RegisterResult> {
  if (!isWebAuthnSupported()) {
    throw new Error('Biometric authentication is not supported on this browser or platform.');
  }

  const challenge = base64UrlToUint8Array(data.challenge);
  const userId = new TextEncoder().encode(data.user_id);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge.buffer as ArrayBuffer,
    rp: {
      name: data.rp_name || 'RailOne',
      id: window.location.hostname === 'localhost' ? 'localhost' : undefined,
    },
    user: {
      id: userId.buffer as ArrayBuffer,
      name: data.user_name,
      displayName: data.user_display_name || data.user_name,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },  // ES256
      { alg: -257, type: 'public-key' } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Windows Hello, Touch ID, Face ID, Android Biometric
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: 60000,
    attestation: 'none',
  };

  const credential = (await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  })) as PublicKeyCredential;

  if (!credential) {
    throw new Error('Failed to create biometric credential.');
  }

  const rawId = arrayBufferToBase64Url(credential.rawId);
  const response = credential.response as AuthenticatorAttestationResponse;
  const publicKey = response.getPublicKey
    ? arrayBufferToBase64Url(response.getPublicKey()!)
    : rawId;

  // Detect platform device name
  let deviceName = 'Platform Authenticator';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) deviceName = 'Android Fingerprint / Face';
  else if (/iPhone|iPad|Macintosh/i.test(ua)) deviceName = 'Apple Touch ID / Face ID';
  else if (/Windows/i.test(ua)) deviceName = 'Windows Hello';

  return {
    credential_id: rawId,
    public_key: publicKey,
    transports: 'internal',
    device_name: deviceName,
  };
}

export interface LoginChallengeData {
  challenge: string;
  rp_id: string;
}

export interface LoginResult {
  credential_id: string;
  authenticator_data?: string;
  client_data_json?: string;
  signature?: string;
}

export async function authenticateBiometricsWithBrowser(
  data: LoginChallengeData
): Promise<LoginResult> {
  if (!isWebAuthnSupported()) {
    throw new Error('Biometric authentication is not supported on this browser.');
  }

  const challenge = base64UrlToUint8Array(data.challenge);

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge.buffer as ArrayBuffer,
    rpId: window.location.hostname === 'localhost' ? 'localhost' : undefined,
    userVerification: 'required',
    timeout: 60000,
  };

  const assertion = (await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions,
  })) as PublicKeyCredential;

  if (!assertion) {
    throw new Error('Biometric authentication cancelled or failed.');
  }

  const rawId = arrayBufferToBase64Url(assertion.rawId);
  const response = assertion.response as AuthenticatorAssertionResponse;

  return {
    credential_id: rawId,
    authenticator_data: arrayBufferToBase64Url(response.authenticatorData),
    client_data_json: arrayBufferToBase64Url(response.clientDataJSON),
    signature: arrayBufferToBase64Url(response.signature),
  };
}
