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

function datesEqual(date1?: DateTime, date2?: DateTime): boolean {
  if (!date1 && !date2) {
    return true;
  }
  if (!date1 || !date2) {
    return false;
  }
  return date1.equals(date2);
}

function sourcesEqual(sources1?: string[], sources2?: string[]): boolean {
  if (!sources1 && !sources2) {
    return true;
  }
  if (!sources1 || !sources2) {
    return false;
  }
  if (sources1.length !== sources2.length) {
    return false;
  }

  const sources1Set = new Set(sources1);
  const sources2Set = new Set(sources2);

  if (typeof Set.prototype.isSubsetOf === 'function' && typeof Set.prototype.isSupersetOf === 'function') {
    return sources1Set.isSubsetOf(sources2Set) && sources1Set.isSupersetOf(sources2Set);
  } else {
    return (
      sources1Set.values().every((source) => sources2Set.has(source)) &&
      sources2Set.values().every((source) => sources1Set.has(source))
    );
  }
}

const initialState = {};
const subject = new BehaviorSubject<SearchRequestParameters>(initialState);

searchFilter.observable
  .pipe(
    combineLatestWith(settings.observable.pipe(map((settings) => settings.sources))),
    distinctUntilChanged((previous, current) => {
      const [previousSearchFilter, previousSources] = previous;
      const [currentSearchFilter, currentSources] = current;
      return (
        searchFilterStorePropsEqual(previousSearchFilter, currentSearchFilter) &&
        sourcesEqual(previousSources, currentSources)
      );
    }),
    map(([searchFilter, sources]) => {
      const { textFilter, tag, dateFilter } = searchFilter ?? {};
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
