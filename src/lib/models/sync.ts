import { SYNC_DEVICE_NAME_MAX_LENGTH } from '#lib/configs/client.ts';
import { Schema } from 'effect';

export const SyncSecret = Schema.String.check(Schema.isUUID(4), Schema.isLowercased());
export type SyncSecret = typeof SyncSecret.Type;

export const SyncDeviceName = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isMinLength(1),
  Schema.isMaxLength(SYNC_DEVICE_NAME_MAX_LENGTH),
);
export type SyncDeviceName = typeof SyncDeviceName.Type;

export const SyncSettings = Schema.Struct({
  secret: Schema.optional(SyncSecret),
  deviceName: SyncDeviceName,
});
export type SyncSettings = typeof SyncSettings.Type;

export interface SyncKeys {
  readonly roomId: string;
  readonly key: CryptoKey;
}
