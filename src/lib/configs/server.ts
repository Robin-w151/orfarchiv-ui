import { env } from '$env/dynamic/private';
import { createLogger, format, transports } from 'winston';

// Database
export const ORFARCHIV_DB_URL = (): string => env.ORFARCHIV_DB_URL?.trim() || 'mongodb://localhost';

// Logger
const { combine, json, timestamp } = format;
export const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  transports: [new transports.Console()],
});

// Query
export const NEWS_QUERY_PAGE_LIMIT = 100;

// Story
export const STORY_CONTENT_READ_MORE_REGEXPS = [/mehr\s+(\w+\s+)*in/i, /lesen\s+(\w+\s+)*mehr/i];
export const STORY_CONTENT_DEFAULT_MAXAGE = 21600;
export const STORY_CONTENT_NEW_STORY_MAXAGE = 3600;
export const STORY_CONTENT_NEW_STORY_THRESHOLD = 4;
