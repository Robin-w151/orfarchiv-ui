import { Schema } from 'effect';
import { DateTime } from 'luxon';

const ISO_OFFSET = /(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

export const isUrl = Schema.makeFilter<string>(
  (value) => URL.canParse(value) || 'must be a valid URL',
  undefined,
  true,
);

export const isIsoDateTime = Schema.makeFilter<string>(
  (value) => (ISO_OFFSET.test(value) && DateTime.fromISO(value).isValid) || 'must be an ISO 8601 date-time with offset',
);
