import { PageKey } from '$lib/models/pageKey';
import { z } from 'zod';

export const DateFilter = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});
export type DateFilter = z.infer<typeof DateFilter>;

export const SearchFilter = z.object({
  textFilter: z.string().optional(),
  dateFilter: DateFilter.optional(),
});
export type SearchFilter = z.infer<typeof SearchFilter>;

export const SearchRequestParameters = SearchFilter.extend({
  sources: z.array(z.string()).optional(),
});
export type SearchRequestParameters = z.infer<typeof SearchRequestParameters>;

export const SearchRequest = z.object({
  searchRequestParameters: SearchRequestParameters,
  pageKey: PageKey.optional(),
});
export type SearchRequest = z.infer<typeof SearchRequest>;
