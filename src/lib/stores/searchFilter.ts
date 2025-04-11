import type { SearchFilter } from '$lib/models/searchRequest';
import debounce from 'lodash.debounce';
import { DateTime, type DurationLike } from 'luxon';
import { writable, type Readable } from 'svelte/store';

export type InternalDateFilter = {
  from?: DateTime;
  to?: DateTime;
};

export interface SearchFilterStoreProps extends Omit<SearchFilter, 'dateFilter'> {
  dateFilter?: InternalDateFilter;
  tempDateFilter?: InternalDateFilter;
}

export interface SearchFilterStore extends Readable<SearchFilterStoreProps>, Partial<SearchFilterStoreProps> {
  setTextFilter: (textFilter: string | undefined) => void;
  setFrom: (fromDate: string | undefined) => void;
  setTo: (toDate: string | undefined) => void;
  applyTempSearchFilter: () => void;
  resetDateFilter: () => void;
  resetAll: () => void;
  selectDateFilterToday: () => void;
  selectDateFilterLastWeek: () => void;
  selectDateFilterLastMonth: () => void;
  selectDateFilterLastYear: () => void;
}

const initialState = (): SearchFilterStoreProps => ({
  textFilter: '',
  dateFilter: {
    from: undefined,
    to: undefined,
  },
  tempDateFilter: {
    from: undefined,
    to: undefined,
  },
});
const { subscribe, update } = writable<SearchFilterStoreProps>(initialState());
const debouncedUpdate = debounce(update, 250, { leading: false, trailing: true });

function setTextFilter(textFilter?: string): void {
  debouncedUpdate((searchFilter) => ({ ...searchFilter, textFilter }));
}

function setFrom(from?: string): void {
  const newFrom = from ? DateTime.fromISO(from).startOf('day') : undefined;
  update((searchFilter) => {
    const to = searchFilter.tempDateFilter?.to;
    const newTo = !to || !newFrom || newFrom <= to ? to : newFrom.endOf('day');
    return { ...searchFilter, tempDateFilter: { from: newFrom, to: newTo } };
  });
}

function setTo(to?: string): void {
  const newTo = to ? DateTime.fromISO(to).endOf('day') : undefined;
  update((searchFilter) => {
    const from = searchFilter.tempDateFilter?.from;
    const newFrom = !from || !newTo || from <= newTo ? from : newTo.startOf('day');
    return { ...searchFilter, tempDateFilter: { from: newFrom, to: newTo } };
  });
}

function applyTempSearchFilter(): void {
  update((searchFilter) => ({ ...searchFilter, dateFilter: searchFilter.tempDateFilter }));
}

function resetDateFilter(): void {
  update((searchFilter) => ({
    ...searchFilter,
    dateFilter: {},
    tempDateFilter: {},
  }));
}

function resetAll(): void {
  update((searchFilter) => ({ ...searchFilter, ...initialState() }));
}

function selectDateFilterToday(): void {
  const [from, to] = dateRangeFromNow({});
  update((searchFilter) => ({
    ...searchFilter,
    tempDateFilter: { from, to },
  }));
}

function selectDateFilterLastWeek(): void {
  const [from, to] = dateRangeFromNow({ weeks: 1 });
  update((searchFilter) => ({
    ...searchFilter,
    tempDateFilter: { from, to },
  }));
}

function selectDateFilterLastMonth(): void {
  const [from, to] = dateRangeFromNow({ months: 1 });
  update((searchFilter) => ({
    ...searchFilter,
    tempDateFilter: { from, to },
  }));
}

function selectDateFilterLastYear(): void {
  const [from, to] = dateRangeFromNow({ years: 1 });
  update((searchFilter) => ({
    ...searchFilter,
    tempDateFilter: { from, to },
  }));
}

function dateRangeFromNow(duration: DurationLike): [DateTime, DateTime] {
  const now = DateTime.now();
  const from = now.minus(duration).startOf('day');
  const to = now.endOf('day');
  return [from, to];
}

export default {
  subscribe,
  setTextFilter,
  setFrom,
  setTo,
  applyTempSearchFilter,
  resetDateFilter,
  resetAll,
  selectDateFilterToday,
  selectDateFilterLastWeek,
  selectDateFilterLastMonth,
  selectDateFilterLastYear,
} as SearchFilterStore;
