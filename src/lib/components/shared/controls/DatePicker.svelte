<script lang="ts" module>
  type DatePickerState = 'datePicker' | 'monthPicker' | 'yearPicker';
  type Day = { day: number; monthRelation: 'current' | 'next' | 'previous' };
  type Week = [number, Array<Day>];
  type DaysOfMonth = Array<Week>;
  type Month = { month: number; monthLong: string };

  const months: Array<Month> = [
    {
      month: 1,
      monthLong: 'Januar',
    },
    {
      month: 2,
      monthLong: 'Februar',
    },
    {
      month: 3,
      monthLong: 'März',
    },
    {
      month: 4,
      monthLong: 'April',
    },
    {
      month: 5,
      monthLong: 'Mai',
    },
    {
      month: 6,
      monthLong: 'Juni',
    },
    {
      month: 7,
      monthLong: 'Juli',
    },
    {
      month: 8,
      monthLong: 'August',
    },
    {
      month: 9,
      monthLong: 'September',
    },
    {
      month: 10,
      monthLong: 'Oktober',
    },
    {
      month: 11,
      monthLong: 'November',
    },
    {
      month: 12,
      monthLong: 'Dezember',
    },
  ];
</script>

<script lang="ts">
  import { DateTime } from 'luxon';
  import Popover from '../content/Popover.svelte';
  import Input from './Input.svelte';
  import { untrack } from 'svelte';
  import PopoverContent from '../content/PopoverContent.svelte';
  import { ChevronLeft, ChevronRight } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  interface Props {
    id: string;
    value?: DateTime;
    placeholder?: string;
    onchange?: (value?: DateTime) => void;
    onclear?: () => void;
  }

  let { id, value = $bindable(), placeholder, onchange, onclear }: Props = $props();

  let datePickerState = $state<DatePickerState>('datePicker');
  let today = DateTime.now().startOf('day');
  let firstDayOfMonth = $state<DateTime>(DateTime.now().startOf('month'));
  let inputValue = $state<string>('');
  let inputRef = $state<Input | undefined>(undefined);
  let popoverRef = $state<Popover | undefined>(undefined);

  const month = $derived(firstDayOfMonth.month);
  const monthName = $derived(firstDayOfMonth.monthLong);
  const year = $derived(firstDayOfMonth.year);
  const daysOfMonth = $derived(calculateDaysOfMonthGroupedByWeek(month, year));

  const containerClass = [
    'flex flex-col gap-2 md:gap-4 p-2 md:p-4 w-[316px] md:w-[400px]',
    'text-black dark:text-white bg-gray-100 dark:bg-gray-800',
    'rounded-lg',
  ];
  const headerClass = ['flex justify-between items-center gap-2 md:gap-4 h-10'];
  const baseButtonClass = [
    'flex items-center justify-center p-2 ',
    'hover:text-fuchsia-600 hover:bg-gray-200 dark:hover:text-fuchsia-400 dark:hover:bg-gray-700',
    'focus:text-fuchsia-600 dark:focus:text-fuchsia-400 focus:outline-none focus:ring-2 ring-blue-700 dark:ring-blue-500',
    'transition-[background-color] duration-100',
  ];
  const buttonClass = [...baseButtonClass, 'rounded-md'];
  const roundButtonClass = [...baseButtonClass, 'w-8 h-8', 'rounded-full'];
  const datePickerClass = {
    table: ['grid grid-cols-8 gap-1 md:gap-3'],
    tableHeader: ['grid grid-cols-subgrid col-span-full'],
    tableBody: ['grid grid-cols-subgrid col-span-full gap-1 md:gap-3'],
    tableRow: ['grid grid-cols-subgrid col-span-full justify-items-center'],
    tableWeek: ['flex justify-center items-center', 'text-gray-500'],
    tableDayButton: ({ day, monthRelation }: Day) => [
      ...roundButtonClass,
      (monthRelation === 'previous' || monthRelation === 'next') && 'text-gray-500',
      monthRelation === 'current' &&
        day === value?.day &&
        month === value?.month &&
        year === value?.year &&
        'font-bold text-white bg-blue-700 dark:bg-blue-600',
      monthRelation === 'current' &&
        !(value?.day === today.day && value?.month === today.month && value?.year === today.year) &&
        day === today.day &&
        month === today.month &&
        year === today.year &&
        'bg-blue-700/30 dark:bg-blue-600/30',
    ],
  };
  const monthPickerClass = {
    grid: ['grid grid-cols-3 gap-1 md:gap-3'],
  };
  const yearPickerClass = {
    grid: ['grid grid-cols-3 gap-1 md:gap-3'],
  };

  $effect(() => {
    const currentValue = value;
    untrack(() => {
      if (currentValue) {
        const newInputValue = currentValue.toFormat('dd.MM.yyyy');
        if (newInputValue && newInputValue !== inputValue) {
          inputValue = newInputValue;
          firstDayOfMonth = currentValue.startOf('month');
        }
      } else {
        inputValue = '';
        firstDayOfMonth = DateTime.now().startOf('month');
      }
    });
  });

  function handleDayClick({ day, monthRelation }: Day, event: Event): void {
    switch (monthRelation) {
      case 'previous':
        selectPreviousMonth();
        break;
      case 'next':
        selectNextMonth();
        break;
    }

    value = DateTime.fromObject({ day, month, year });
    inputValue = value.toFormat('dd.MM.yyyy');
    onchange?.(value);

    (event.target as HTMLElement).blur();
    popoverRef?.setOpen(false);
  }

  function handleMonthClick({ month }: Month): void {
    const newFirstDayOfMonth = DateTime.fromObject({ month, year });
    if (newFirstDayOfMonth.isValid && firstDayOfMonth !== newFirstDayOfMonth) {
      firstDayOfMonth = newFirstDayOfMonth;
    }

    datePickerState = 'datePicker';
  }

  function handleYearClick(year: number): void {
    const newFirstDayOfMonth = DateTime.fromObject({ month: 1, year });
    if (newFirstDayOfMonth.isValid && firstDayOfMonth !== newFirstDayOfMonth) {
      firstDayOfMonth = newFirstDayOfMonth;
    }

    datePickerState = 'monthPicker';
  }

  function handlePreviousMonthClick(): void {
    selectPreviousMonth();
  }

  function handleNextMonthClick(): void {
    selectNextMonth();
  }

  function handlePreviousYearClick(): void {
    firstDayOfMonth = DateTime.fromObject({ month: 1, year: year - 1 });
  }

  function handleNextYearClick(): void {
    firstDayOfMonth = DateTime.fromObject({ month: 1, year: year + 1 });
  }

  function handlePreviousYearsClick(): void {
    firstDayOfMonth = DateTime.fromObject({ month: 1, year: year - 12 });
  }

  function handleNextYearsClick(): void {
    firstDayOfMonth = DateTime.fromObject({ month: 1, year: year + 12 });
  }

  function handleMonthPickerClick(): void {
    datePickerState = 'monthPicker';
  }

  function handleYearPickerClick(): void {
    datePickerState = 'yearPicker';
  }

  function handleInputSubmit(newInputValue: string | undefined): void {
    setValue(newInputValue);
  }

  function handleInputClear(): void {
    setValue(undefined);
    onclear?.();
    onchange?.(undefined);
  }

  function handleInputBlur(): void {
    setValue(inputValue);
  }

  function handleInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
    }
  }

  function handleVisibleChange(visible: boolean): void {
    if (visible) {
      datePickerState = 'datePicker';
      if (value?.isValid) {
        firstDayOfMonth = value.startOf('month');
      } else {
        firstDayOfMonth = DateTime.now().startOf('month');
      }
    }
  }

  function setValue(newInputValue: string | undefined): void {
    if (newInputValue) {
      const date = DateTime.fromFormat(newInputValue, 'd.M.y');
      if (date.isValid) {
        value = date;
        firstDayOfMonth = date.startOf('month');
      } else {
        value = undefined;
      }
    } else {
      value = undefined;
      firstDayOfMonth = DateTime.now().startOf('month');
    }

    onchange?.(value);
  }

  function selectPreviousMonth(): void {
    firstDayOfMonth = firstDayOfMonth.minus({ month: 1 });
  }

  function selectNextMonth(): void {
    firstDayOfMonth = firstDayOfMonth.plus({ month: 1 });
  }

  function calculateDaysOfMonthGroupedByWeek(month: number, year: number): DaysOfMonth {
    const firstDay = DateTime.fromObject({ month, year });
    const firstDayNextMonth = firstDay.plus({ month: 1 });
    const firstWeekday = firstDay.weekday - 1;
    const lastDay = firstDay.endOf('month');
    const lastDayPreviousMonth = lastDay.minus({ month: 1 });
    const days = firstDayNextMonth.diff(firstDay, 'days').days;

    const daysOfMonthPadded: Array<Day> = [];

    if (firstWeekday > 0) {
      for (let day = lastDayPreviousMonth.day - firstWeekday + 1; day <= lastDayPreviousMonth.day; day++) {
        daysOfMonthPadded.push({ day, monthRelation: 'previous' });
      }
    }

    for (let day = 1; day <= days; day++) {
      daysOfMonthPadded.push({ day, monthRelation: 'current' });
    }

    for (let day = 1; daysOfMonthPadded.length < 42; day++) {
      daysOfMonthPadded.push({ day, monthRelation: 'next' });
    }

    const weeks: Array<[number, Array<Day>]> = [];
    for (let i = 0, week = firstDay.weekNumber; i < daysOfMonthPadded.length; i += 7, week++) {
      weeks.push([week, daysOfMonthPadded.slice(i, i + 7)]);
    }

    return weeks;
  }

  function calculateYears(year: number): Array<number> {
    return Array.from({ length: 12 }, (_, i) => year - 7 + i);
  }
</script>

<Popover
  containerClass="w-full"
  openOnFocus
  openOnKeyboardClick={false}
  onVisibleChange={handleVisibleChange}
  bind:this={popoverRef}
>
  {#snippet anchorContent(props)}
    <div class="w-full" {...props}>
      <Input
        {id}
        {placeholder}
        bind:value={inputValue}
        bind:this={inputRef}
        onchange={handleInputSubmit}
        onclear={handleInputClear}
        onblur={handleInputBlur}
        onkeydown={handleInputKeydown}
      />
    </div>
  {/snippet}
  {#snippet popoverContent()}
    <PopoverContent>
      {#if datePickerState === 'datePicker'}
        <div class={containerClass}>
          <div class={headerClass}>
            <button class={roundButtonClass} title="Vorheriger Monat" onclick={handlePreviousMonthClick}>
              <Icon src={ChevronLeft} theme="outlined" class="size-6" />
            </button>
            <button class={buttonClass} title="Monatsauswahl" onclick={handleMonthPickerClick}
              >{monthName} {year}</button
            >
            <button class={roundButtonClass} title="Nächster Monat" onclick={handleNextMonthClick}>
              <Icon src={ChevronRight} theme="outlined" class="size-6" />
            </button>
          </div>
          <table class={datePickerClass.table}>
            <thead class={datePickerClass.tableHeader}>
              <tr class={datePickerClass.tableRow}>
                <th><span class="sr-only">Kalenderwoche</span></th>
                <th>Mo</th>
                <th>Di</th>
                <th>Mi</th>
                <th>Do</th>
                <th>Fr</th>
                <th>Sa</th>
                <th>So</th>
              </tr>
            </thead>
            <tbody class={datePickerClass.tableBody}>
              {#each daysOfMonth as [week, days] (week)}
                <tr class={datePickerClass.tableRow}>
                  <td class={datePickerClass.tableWeek}>{week}</td>
                  {#each days as day (day.day)}
                    <td>
                      <button
                        class={datePickerClass.tableDayButton(day)}
                        title="Tag auswählen"
                        onclick={(event) => handleDayClick(day, event)}>{day.day}</button
                      >
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if datePickerState === 'monthPicker'}
        <div class={containerClass}>
          <div class={headerClass}>
            <button class={roundButtonClass} title="Vorheriges Jahr" onclick={handlePreviousYearClick}>
              <Icon src={ChevronLeft} theme="outlined" class="size-6" />
            </button>
            <button class={buttonClass} title="Jahresauswahl" onclick={handleYearPickerClick}>{year}</button>
            <button class={roundButtonClass} title="Nächstes Jahr" onclick={handleNextYearClick}>
              <Icon src={ChevronRight} theme="outlined" class="size-6" />
            </button>
          </div>
          <div class={monthPickerClass.grid}>
            {#each months as month (month.month)}
              <button class={buttonClass} title="Monat auswählen" onclick={() => handleMonthClick(month)}
                >{month.monthLong}</button
              >
            {/each}
          </div>
        </div>
      {:else if datePickerState === 'yearPicker'}
        {@const years = calculateYears(year)}
        <div class={containerClass}>
          <div class={headerClass}>
            <button class={roundButtonClass} title="Vorherige Jahre" onclick={handlePreviousYearsClick}>
              <Icon src={ChevronLeft} theme="outlined" class="size-6" />
            </button>
            <span>{years[0]} - {years[years.length - 1]}</span>
            <button class={roundButtonClass} title="Nächste Jahre" onclick={handleNextYearsClick}>
              <Icon src={ChevronRight} theme="outlined" class="size-6" />
            </button>
          </div>
          <div class={yearPickerClass.grid}>
            {#each years as y (y)}
              <button class={buttonClass} title="Jahr auswählen" onclick={() => handleYearClick(y)}>{y}</button>
            {/each}
          </div>
        </div>
      {/if}
    </PopoverContent>
  {/snippet}
</Popover>
