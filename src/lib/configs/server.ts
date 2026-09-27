import { Duration } from 'effect';
import type { MongoClientOptions } from 'mongodb';
import { createLogger, format, transports } from 'winston';

// Logger
const { combine, json, timestamp } = format;
export const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  transports: [new transports.Console()],
});

// Database
export const DB_NAME = 'orfarchiv';
export const DB_NEWS_COLLECTION = 'news';
export const DB_QUERY_TIMEOUT = Duration.seconds(5);
export const DB_TARGET_COOLDOWN = Duration.seconds(30);
export const DB_CLIENT_OPTIONS: MongoClientOptions = {
  appName: 'orfarchiv-ui',
  serverSelectionTimeoutMS: 3000,
  connectTimeoutMS: 3000,
  retryReads: true,
  maxPoolSize: 2,
};

// Semantic search
export const SEMANTIC_SEARCH_NUM_CANDIDATES = 3000;
export const SEMANTIC_SEARCH_CANDIDATE_LIMIT = 300;
export const SEMANTIC_SEARCH_MIN_SCORE = 0.79;
export const SEMANTIC_SEARCH_RECENCY_WEIGHT = 0;
export const SEMANTIC_SEARCH_RECENCY_DECAY_MS = Duration.toMillis(Duration.days(30));
export const SEMANTIC_SEARCH_MIN_NOUN_LENGTH = 4;

export const SEMANTIC_SEARCH_DEFAULT_RATE_LIMIT = 60;
export const SEMANTIC_SEARCH_DEFAULT_RATE_WINDOW = Duration.minutes(1);
export const SEMANTIC_SEARCH_ACRONYM_MAX_LENGTH = 7;
export const SEMANTIC_SEARCH_TIMEOUT = Duration.seconds(10);
export const SEMANTIC_SEARCH_CACHE_MAX = 500;
export const SEMANTIC_SEARCH_CACHE_TTL = Duration.toMillis(Duration.minutes(30));
export const SEMANTIC_SEARCH_CATEGORY_CACHE_TTL = Duration.hours(1);

// Story
export const STORY_CONTENT_READ_MORE_REGEXPS = [/mehr\s+(\w+\s+)*in/i, /lesen\s+(\w+\s+)*mehr/i];
export const STORY_CONTENT_DEFAULT_MAXAGE = 21600;
export const STORY_CONTENT_NEW_STORY_MAXAGE = 3600;
export const STORY_CONTENT_NEW_STORY_THRESHOLD = 4;
