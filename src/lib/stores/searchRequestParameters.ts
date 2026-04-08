import type { SearchRequestParameters } from '$lib/models/searchRequest';
import { DateTime } from 'luxon';
import { BehaviorSubject, combineLatestWith, distinctUntilChanged, map } from 'rxjs';
import searchFilter, { type SearchFilterStoreProps } from './searchFilter';
import settings from './settings';

function searchFilterStorePropsEqual(p1?: SearchFilterStoreProps, p2?: SearchFilterStoreProps): boolean {
  return (
    p1?.textFilter === p2?.textFilter &&
    p1?.tag === p2?.tag &&
    datesEqual(p1?.dateFilter?.from, p2?.dateFilter?.from) &&
    datesEqual(p1?.dateFilter?.to, p2?.dateFilter?.to)
  );
}

function datesEqual(d1?: DateTime, d2?: DateTime): boolean {
  if (!d1 && !d2) {
    return true;
  }
  if (!d1 || !d2) {
    return false;
  }
  return d1.equals(d2);
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
