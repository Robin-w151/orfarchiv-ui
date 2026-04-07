import type { SearchRequestParameters } from '$lib/models/searchRequest';
import { BehaviorSubject, combineLatestWith, distinctUntilChanged, map } from 'rxjs';
import searchFilter, { type SearchFilterStoreProps } from './searchFilter';
import settings from './settings';

function searchFilterStorePropsEqual(p1?: SearchFilterStoreProps, p2?: SearchFilterStoreProps): boolean {
  return (
    p1?.textFilter === p2?.textFilter &&
    p1?.tag === p2?.tag &&
    p1?.dateFilter?.from === p2?.dateFilter?.from &&
    p1?.dateFilter?.to === p2?.dateFilter?.to
  );
}

const initialState = {};
const subject = new BehaviorSubject<SearchRequestParameters>(initialState);

searchFilter.observable
  .pipe(
    distinctUntilChanged(searchFilterStorePropsEqual),
    combineLatestWith(settings.observable),
    map(([searchFilter, settings]) => {
      const { textFilter, tag, dateFilter } = searchFilter ?? {};
      const { sources } = settings;
      return {
        textFilter: [textFilter, tag].filter((t) => !!t).join(' '),
        dateFilter: {
          from: dateFilter?.from?.toISO() ?? undefined,
          to: dateFilter?.to?.toISO() ?? undefined,
        },
        sources,
      };
    }),
  )
  .subscribe((searchRequestParameters) => subject.next(searchRequestParameters));

export default subject;
