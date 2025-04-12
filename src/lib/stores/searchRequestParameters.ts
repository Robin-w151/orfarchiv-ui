import type { SearchRequestParameters } from '$lib/models/searchRequest';
import { derived, type Readable } from 'svelte/store';
import searchFilter, { type SearchFilterStoreProps } from './searchFilter';
import settings from './settings';
import { distinctUntilChanged } from './utils';

export type SearchRequestParametersStore = Readable<SearchRequestParameters>;

function searchFilterStorePropsNotEqual(p1?: SearchFilterStoreProps, p2?: SearchFilterStoreProps): boolean {
  return (
    p1?.textFilter !== p2?.textFilter ||
    p1?.dateFilter?.from !== p2?.dateFilter?.from ||
    p1?.dateFilter?.to !== p2?.dateFilter?.to
  );
}

const searchFilterChanged = distinctUntilChanged(searchFilter, searchFilterStorePropsNotEqual);

const searchRequestParameters = derived([searchFilterChanged, settings], ([$searchFilterStoreProps, $settings]) => {
  const { textFilter, dateFilter } = $searchFilterStoreProps;
  const { sources } = $settings;
  return {
    textFilter,
    dateFilter: {
      from: dateFilter?.from?.toISO() ?? undefined,
      to: dateFilter?.to?.toISO() ?? undefined,
    },
    sources,
  } satisfies SearchRequestParameters;
}) as SearchRequestParametersStore;

export default searchRequestParameters;
