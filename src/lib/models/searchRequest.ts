import { PageKey } from '$lib/models/pageKey';
import { z } from 'zod';

export const DateFilter = z.object({
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});
export type DateFilter = z.infer<typeof DateFilter>;

export const SearchFilter = z.object({
  tag: z.string().optional(),
  textFilter: z.string().optional(),
  dateFilter: DateFilter.optional(),
});
export type SearchFilter = z.infer<typeof SearchFilter>;

export const SearchMatchMode = z.enum(['anyOf', 'allOf']);
export type SearchMatchMode = z.infer<typeof SearchMatchMode>;

export const SearchRequestParameters = SearchFilter.extend({
  sources: z.array(z.string()).optional(),
  matchMode: SearchMatchMode.optional(),
});
export type SearchRequestParameters = z.infer<typeof SearchRequestParameters>;

export const SearchRequest = z.object({
  searchRequestParameters: SearchRequestParameters,
  pageKey: PageKey.optional(),
});
export type SearchRequest = z.infer<typeof SearchRequest>;
