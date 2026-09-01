import { isIsoDateTime } from '$lib/models/checks';
import { PageKey } from '$lib/models/pageKey';
import { Schema } from 'effect';

export const DateFilter = Schema.Struct({
  from: Schema.optional(Schema.String.check(isIsoDateTime)),
  to: Schema.optional(Schema.String.check(isIsoDateTime)),
});
export type DateFilter = typeof DateFilter.Type;

export const KeywordSearchMatchMode = Schema.Literals(['anyOf', 'allOf']);
export type KeywordSearchMatchMode = typeof KeywordSearchMatchMode.Type;

export const SemanticSearchMatchMode = Schema.Literal('semantic');
export type SemanticSearchMatchMode = typeof SemanticSearchMatchMode.Type;

export const SearchMatchMode = Schema.Literals([...KeywordSearchMatchMode.literals, SemanticSearchMatchMode.literal]);
export type SearchMatchMode = typeof SearchMatchMode.Type;

export const SearchFilter = Schema.Struct({
  tag: Schema.optional(Schema.String),
  textFilter: Schema.optional(Schema.String),
  dateFilter: Schema.optional(DateFilter),
  matchMode: Schema.optional(SearchMatchMode),
});
export type SearchFilter = typeof SearchFilter.Type;

export const SearchRequestParameters = Schema.Struct({
  ...SearchFilter.fields,
  sources: Schema.optional(Schema.Array(Schema.String)),
});
export type SearchRequestParameters = typeof SearchRequestParameters.Type;

export const KeywordSearchRequestParameters = Schema.Struct({
  ...SearchRequestParameters.fields,
  matchMode: Schema.optional(KeywordSearchMatchMode),
});
export type KeywordSearchRequestParameters = typeof KeywordSearchRequestParameters.Type;

export const SemanticSearchRequestParameters = Schema.Struct({
  ...SearchRequestParameters.fields,
  textFilter: Schema.String,
  matchMode: SemanticSearchMatchMode,
});
export type SemanticSearchRequestParameters = typeof SemanticSearchRequestParameters.Type;

export const SearchRequest = Schema.Struct({
  searchRequestParameters: SearchRequestParameters,
  pageKey: Schema.optional(PageKey),
});
export type SearchRequest = typeof SearchRequest.Type;

export const KeywordSearchRequest = Schema.Struct({
  ...SearchRequest.fields,
  searchRequestParameters: KeywordSearchRequestParameters,
});
export type KeywordSearchRequest = typeof KeywordSearchRequest.Type;
