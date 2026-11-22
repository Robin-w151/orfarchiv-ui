import { SYNC_HKDF_INFO } from '#lib/configs/client.ts';
import { InvalidSyncSecretError, SyncDecryptError, SyncDecryptErrorReasons } from '#lib/errors/errors.ts';
import { SyncSecret } from '#lib/models/sync.ts';
import { fromBase64Url, toBase64Url } from '#lib/utils/base64url.ts';
import { Effect, Schema } from 'effect';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ROOM_ID_BITS = 256;

const textEncoder = new TextEncoder();
const isSyncSecret = Schema.is(SyncSecret);

export function normalizeSecret(input: string) {
  const secret = input.trim().toLowerCase();
  if (!isSyncSecret(secret)) {
    return Effect.fail(new InvalidSyncSecretError({ message: 'Sync secret must be a UUIDv4' }));
  }
  return Effect.succeed(secret);
}

export function deriveSyncKeys(secret: string) {
  return Effect.gen(function* () {
    const normalizedSecret = yield* normalizeSecret(secret);
    return yield* Effect.promise(async () => {
      const keyMaterial = await crypto.subtle.importKey('raw', textEncoder.encode(normalizedSecret), 'HKDF', false, [
        'deriveBits',
        'deriveKey',
      ]);
      const roomIdBits = await crypto.subtle.deriveBits(hkdfParams(SYNC_HKDF_INFO.room), keyMaterial, ROOM_ID_BITS);
      const key = await crypto.subtle.deriveKey(
        hkdfParams(SYNC_HKDF_INFO.key),
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      );
      return { roomId: toHex(new Uint8Array(roomIdBits)), key };
    });
  });
}

export function encrypt(key: CryptoKey, plaintext: Uint8Array<ArrayBuffer>, additionalData: Uint8Array<ArrayBuffer>) {
  return Effect.promise(async () => {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, plaintext),
    );
    const payload = new Uint8Array(IV_LENGTH + ciphertext.length);
    payload.set(iv);
    payload.set(ciphertext, IV_LENGTH);
    return toBase64Url(payload);
  });
}

export function decrypt(key: CryptoKey, payload: string, additionalData: Uint8Array<ArrayBuffer>) {
  return Effect.gen(function* () {
    const bytes = fromBase64Url(payload);
    if (!bytes) {
      return yield* Effect.fail(new SyncDecryptError({ reason: SyncDecryptErrorReasons.invalidEncoding }));
    }
    if (bytes.length < IV_LENGTH + TAG_LENGTH) {
      return yield* Effect.fail(new SyncDecryptError({ reason: SyncDecryptErrorReasons.tooShort }));
    }

    const plaintext = yield* Effect.tryPromise({
      try: () =>
        crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: bytes.subarray(0, IV_LENGTH), additionalData },
          key,
          bytes.subarray(IV_LENGTH),
        ),
      catch: (cause) => new SyncDecryptError({ reason: SyncDecryptErrorReasons.authenticationFailed, cause }),
    });
    return new Uint8Array(plaintext);
  });
}

function hkdfParams(info: string) {
  return { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: textEncoder.encode(info) } satisfies HkdfParams;
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
