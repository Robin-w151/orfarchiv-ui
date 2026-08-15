import { isIsoDateTime } from '$lib/models/checks';
import { PageKey } from '$lib/models/pageKey';
import { Schema } from 'effect';

export const DateFilter = Schema.Struct({
  from: Schema.optional(Schema.String.check(isIsoDateTime)),
  to: Schema.optional(Schema.String.check(isIsoDateTime)),
});
export type DateFilter = typeof DateFilter.Type;

export const SearchMatchMode = Schema.Literals(['anyOf', 'allOf']);
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

export const SearchRequest = Schema.Struct({
  searchRequestParameters: SearchRequestParameters,
  pageKey: Schema.optional(PageKey),
});
export type SearchRequest = typeof SearchRequest.Type;
