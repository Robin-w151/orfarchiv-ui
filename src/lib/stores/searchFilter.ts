import type { SearchFilter, SearchMatchMode } from '$lib/models/searchRequest';
import { DateTime, type DurationLike } from 'luxon';
import { BehaviorSubject, Observable } from 'rxjs';
import { type Readable, type Subscriber } from 'svelte/store';

export type InternalDateFilter = {
  from?: DateTime;
  to?: DateTime;
};

export interface InternalSearchFilter extends Omit<SearchFilter, 'dateFilter'> {
  tag?: string;
  dateFilter?: InternalDateFilter;
  matchMode?: SearchMatchMode;
}
export interface SearchFilterStoreProps extends InternalSearchFilter {
  temp?: Omit<InternalSearchFilter, 'tag'>;
}

export interface SearchFilterStore extends Readable<SearchFilterStoreProps> {
  get observable(): Observable<SearchFilterStoreProps>;
  setTextFilter: (textFilter: string | undefined) => void;
  setTag: (tag: string) => void;
  resetTag: () => void;
  setFrom: (fromDate: string | undefined) => void;
  setTo: (toDate: string | undefined) => void;
  setMatchMode: (matchMode: SearchMatchMode) => void;
  applyTempSearchFilter: () => void;
  resetTempFilters: () => void;
  resetAll: () => void;
  selectDateFilterToday: () => void;
  selectDateFilterLastWeek: () => void;
  selectDateFilterLastMonth: () => void;
  selectDateFilterLastYear: () => void;
}

const initialState = (): SearchFilterStoreProps => ({
  tag: undefined,
  textFilter: '',
  dateFilter: {
    from: undefined,
    to: undefined,
  },
  matchMode: 'anyOf',
  temp: {
    dateFilter: {
      from: undefined,
      to: undefined,
    },
    matchMode: 'anyOf',
  },
});

const subject = new BehaviorSubject<SearchFilterStoreProps>(initialState());

const subscribe = (run: Subscriber<SearchFilterStoreProps>) => {
  const subscription = subject.subscribe(run);
  return () => subscription.unsubscribe();
};

const update = (updater: (searchFilter: SearchFilterStoreProps) => SearchFilterStoreProps): void => {
  subject.next(updater(subject.value));
};

function setTextFilter(textFilter?: string): void {
  update((searchFilter) => ({ ...searchFilter, textFilter }));
}

function setTag(tag: string): void {
  update((searchFilter) => ({ ...searchFilter, tag }));
}

function resetTag(): void {
  update((searchFilter) => ({ ...searchFilter, tag: undefined }));
}

function setFrom(from?: string): void {
  const newFrom = from ? DateTime.fromISO(from).startOf('day') : undefined;
  update((searchFilter) => {
    const to = searchFilter.temp?.dateFilter?.to;
    const newTo = !to || !newFrom || newFrom <= to ? to : newFrom.endOf('day');
    return { ...searchFilter, temp: { ...searchFilter.temp, dateFilter: { from: newFrom, to: newTo } } };
  });
}

function setTo(to?: string): void {
  const newTo = to ? DateTime.fromISO(to).endOf('day') : undefined;
  update((searchFilter) => {
    const from = searchFilter.temp?.dateFilter?.from;
    const newFrom = !from || !newTo || from <= newTo ? from : newTo.startOf('day');
    return { ...searchFilter, temp: { ...searchFilter.temp, dateFilter: { from: newFrom, to: newTo } } };
  });
}

function setMatchMode(matchMode: SearchMatchMode): void {
  update((searchFilter) => ({ ...searchFilter, temp: { ...searchFilter.temp, matchMode } }));
}

function applyTempSearchFilter(): void {
  update((searchFilter) => ({ ...searchFilter, ...searchFilter.temp }));
}

function resetTempFilters(): void {
  update((searchFilter) => ({
    ...searchFilter,
    dateFilter: {
      from: undefined,
      to: undefined,
    },
    matchMode: 'anyOf',
    temp: {
      dateFilter: {
        from: undefined,
        to: undefined,
      },
      matchMode: 'anyOf',
    },
  }));
}

function resetAll(): void {
  update(() => initialState());
}

function selectDateFilterToday(): void {
  const [from, to] = dateRangeFromNow({});
  update((searchFilter) => ({
    ...searchFilter,
    temp: { ...searchFilter.temp, dateFilter: { from, to } },
  }));
}

function selectDateFilterLastWeek(): void {
  const [from, to] = dateRangeFromNow({ weeks: 1 });
  update((searchFilter) => ({
    ...searchFilter,
    temp: { ...searchFilter.temp, dateFilter: { from, to } },
  }));
}

function selectDateFilterLastMonth(): void {
  const [from, to] = dateRangeFromNow({ months: 1 });
  update((searchFilter) => ({
    ...searchFilter,
    temp: { ...searchFilter.temp, dateFilter: { from, to } },
  }));
}

function selectDateFilterLastYear(): void {
  const [from, to] = dateRangeFromNow({ years: 1 });
  update((searchFilter) => ({
    ...searchFilter,
    temp: { ...searchFilter.temp, dateFilter: { from, to } },
  }));
}

function dateRangeFromNow(duration: DurationLike): [DateTime, DateTime] {
  const now = DateTime.now();
  const from = now.minus(duration).startOf('day');
  const to = now.endOf('day');
  return [from, to];
}

export default {
  get observable(): Observable<SearchFilterStoreProps> {
    return subject.asObservable();
  },
  subscribe,
  setTextFilter,
  setTag,
  resetTag,
  setFrom,
  setTo,
  setMatchMode,
  applyTempSearchFilter,
  resetTempFilters,
  resetAll,
  selectDateFilterToday,
  selectDateFilterLastWeek,
  selectDateFilterLastMonth,
  selectDateFilterLastYear,
} satisfies SearchFilterStore;
