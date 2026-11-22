import { InvalidSyncSecretError, SyncDecryptError } from '#lib/errors/errors.ts';
import { Effect, Result } from 'effect';
import { describe, expect, it } from 'vitest';
import { decrypt, deriveSyncKeys, encrypt, normalizeSecret } from './syncCrypto';

const SECRET = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const OTHER_SECRET = '9b2c6e1a-7d4f-4a3b-8c5e-1f0a2b3c4d5e';
const SECRET_ROOM_ID = '26146a110074103efbc227ab1949f0eb629219cf4e4403415363c4224a5d831c';
const OTHER_SECRET_ROOM_ID = '4dec31ee85a3fdfbb56f31ec6c3ce2f07530995d2d5852a8b9a8e0e0f6ce8401';
const SECRET_PAYLOAD_VECTOR = 'AAECAwQFBgcICQoLuCE8ETBDdiKbZ6QOTcys3OWjn5EWgaZ6d6M';
const PAYLOAD_VECTOR_ADDITIONAL_DATA = 'orfarchiv-sync/v1|test';
const PAYLOAD_VECTOR_PLAINTEXT = 'hallo welt';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const plaintext = encoder.encode('{"type":"hello","deviceName":"Android · Chrome"}');
const additionalData = encoder.encode('orfarchiv-sync/v1|room|peer-a|peer-b');

function run<A, E>(effect: Effect.Effect<A, E>) {
  return Effect.runPromise(Effect.result(effect));
}

function getOrThrow<A, E>(result: Result.Result<A, E>) {
  if (Result.isFailure(result)) {
    throw new Error('Expected success');
  }
  return result.success;
}

function getFailure<A, E>(result: Result.Result<A, E>) {
  if (Result.isSuccess(result)) {
    throw new Error('Expected failure');
  }
  return result.failure;
}

function flipByte(payload: string, index: number) {
  const bytes = Uint8Array.from(Buffer.from(payload, 'base64url'));
  bytes[index] ^= 0x01;
  return Buffer.from(bytes).toString('base64url');
}

describe('syncCrypto', () => {
  describe('normalizeSecret', () => {
    it.each([
      [' 3F2504E0-4F89-41D3-9A0C-0305E82C3301 ', SECRET],
      [SECRET, SECRET],
      ['\n9B2C6E1A-7d4f-4a3b-8C5E-1f0a2b3c4d5e\t', OTHER_SECRET],
    ])('normalizes %j', async (input, expected) => {
      expect(getOrThrow(await run(normalizeSecret(input)))).toBe(expected);
    });

    it.each([
      ['abc', 'not a uuid'],
      ['', 'empty'],
      ['6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'v1 uuid'],
      ['3f2504e0-4f89-51d3-9a0c-0305e82c3301', 'v5 uuid'],
      ['3f2504e0-4f89-41d3-7a0c-0305e82c3301', 'wrong variant'],
      ['00000000-0000-0000-0000-000000000000', 'nil uuid'],
      ['3f2504e04f8941d39a0c0305e82c3301', 'missing dashes'],
      ['3f2504e0-4f89-41d3-9a0c-0305e82c33011', 'too long'],
    ])('rejects %j (%s)', async (input) => {
      expect(getFailure(await run(normalizeSecret(input)))).toBeInstanceOf(InvalidSyncSecretError);
    });

    it('does not include the input in the error', async () => {
      const input = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
      const error = getFailure(await run(normalizeSecret(input)));
      expect(JSON.stringify(error)).not.toContain(input);
      expect(String(error)).not.toContain(input);
    });
  });

  describe('deriveSyncKeys', () => {
    it.each([
      [SECRET, SECRET_ROOM_ID],
      [OTHER_SECRET, OTHER_SECRET_ROOM_ID],
      [' 3F2504E0-4F89-41D3-9A0C-0305E82C3301 ', SECRET_ROOM_ID],
    ])('derives the fixed room id for %j', async (secret, roomId) => {
      expect(getOrThrow(await run(deriveSyncKeys(secret))).roomId).toBe(roomId);
    });

    it('derives a key matching the fixed payload vector', async () => {
      const { key } = getOrThrow(await run(deriveSyncKeys(SECRET)));
      const decrypted = getOrThrow(
        await run(decrypt(key, SECRET_PAYLOAD_VECTOR, encoder.encode(PAYLOAD_VECTOR_ADDITIONAL_DATA))),
      );
      expect(decoder.decode(decrypted)).toBe(PAYLOAD_VECTOR_PLAINTEXT);
    });

    it('derives a non-extractable AES-GCM-256 key', async () => {
      const { key } = getOrThrow(await run(deriveSyncKeys(SECRET)));
      expect(key.extractable).toBe(false);
      expect(key.algorithm).toEqual({ name: 'AES-GCM', length: 256 });
      expect([...key.usages].sort()).toEqual(['decrypt', 'encrypt']);
    });

    it('fails for an invalid secret', async () => {
      expect(getFailure(await run(deriveSyncKeys('abc')))).toBeInstanceOf(InvalidSyncSecretError);
    });

    it('derives equal room ids and compatible keys on two devices with the same secret', async () => {
      const deviceA = getOrThrow(await run(deriveSyncKeys(SECRET)));
      const deviceB = getOrThrow(await run(deriveSyncKeys(SECRET.toUpperCase())));
      expect(deviceA.roomId).toBe(deviceB.roomId);

      const payload = getOrThrow(await run(encrypt(deviceA.key, plaintext, additionalData)));
      const decrypted = getOrThrow(await run(decrypt(deviceB.key, payload, additionalData)));
      expect(decrypted).toEqual(plaintext);
    });

    it('derives different room ids and incompatible keys for different secrets', async () => {
      const deviceA = getOrThrow(await run(deriveSyncKeys(SECRET)));
      const deviceB = getOrThrow(await run(deriveSyncKeys(OTHER_SECRET)));
      expect(deviceA.roomId).not.toBe(deviceB.roomId);

      const payload = getOrThrow(await run(encrypt(deviceA.key, plaintext, additionalData)));
      const error = getFailure(await run(decrypt(deviceB.key, payload, additionalData)));
      expect(error).toBeInstanceOf(SyncDecryptError);
      expect(error.reason).toBe('authentication-failed');
    });
  });

  describe('encrypt / decrypt', () => {
    async function encryptWithSecret() {
      const { key } = getOrThrow(await run(deriveSyncKeys(SECRET)));
      const payload = getOrThrow(await run(encrypt(key, plaintext, additionalData)));
      return { key, payload };
    }

    it('encodes iv, ciphertext and tag as unpadded base64url', async () => {
      const { payload } = await encryptWithSecret();
      expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(Buffer.from(payload, 'base64url')).toHaveLength(12 + plaintext.length + 16);
    });

    it('uses a fresh iv for every call', async () => {
      const { key, payload } = await encryptWithSecret();
      const secondPayload = getOrThrow(await run(encrypt(key, plaintext, additionalData)));
      expect(secondPayload).not.toBe(payload);
      expect(Buffer.from(secondPayload, 'base64url').subarray(0, 12)).not.toEqual(
        Buffer.from(payload, 'base64url').subarray(0, 12),
      );
    });

    it('round-trips an empty plaintext', async () => {
      const { key } = getOrThrow(await run(deriveSyncKeys(SECRET)));
      const payload = getOrThrow(await run(encrypt(key, new Uint8Array(), additionalData)));
      expect(getOrThrow(await run(decrypt(key, payload, additionalData)))).toEqual(new Uint8Array());
    });

    it.each([
      [0, 'iv start'],
      [11, 'iv end'],
      [12, 'ciphertext start'],
      [20, 'ciphertext middle'],
      [-17, 'ciphertext end'],
      [-16, 'tag start'],
      [-1, 'tag end'],
    ])('fails for a flipped byte at %i (%s)', async (position, _label) => {
      const { key, payload } = await encryptWithSecret();
      const length = Buffer.from(payload, 'base64url').length;
      const tampered = flipByte(payload, position < 0 ? length + position : position);

      const error = getFailure(await run(decrypt(key, tampered, additionalData)));
      expect(error).toBeInstanceOf(SyncDecryptError);
      expect(error.reason).toBe('authentication-failed');
    });

    it('fails with different additional data', async () => {
      const { key, payload } = await encryptWithSecret();
      const otherAdditionalData = encoder.encode('orfarchiv-sync/v1|room|peer-c|peer-b');

      const error = getFailure(await run(decrypt(key, payload, otherAdditionalData)));
      expect(error).toBeInstanceOf(SyncDecryptError);
      expect(error.reason).toBe('authentication-failed');
    });

    it.each([
      ['not base64url!', 'invalid-encoding'],
      ['abc+def/', 'invalid-encoding'],
      ['abcde', 'invalid-encoding'],
      ['', 'too-short'],
      ['AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBka', 'too-short'],
    ])('fails for malformed payload %j with reason %s', async (payload, reason) => {
      const { key } = await encryptWithSecret();

      const error = getFailure(await run(decrypt(key, payload, additionalData)));
      expect(error).toBeInstanceOf(SyncDecryptError);
      expect(error.reason).toBe(reason);
    });
  });
});
