import { Duration } from 'effect';
import { createLogger, format, transports } from 'winston';

// Logger
const { combine, json, timestamp } = format;
export const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  transports: [new transports.Console()],
});

// Semantic search
export const NEWS_TITLE_VECTOR_INDEX = 'news_title_vector';
export const NEWS_TITLE_EMBEDDING_FIELD = 'titleEmbedding';
export const NEWS_TITLE_EMBEDDING_DIMENSIONS = 256;
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
