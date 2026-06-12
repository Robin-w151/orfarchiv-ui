<script lang="ts">
  import Popover from '$lib/components/shared/content/Popover.svelte';
  import PopoverContent from '$lib/components/shared/content/PopoverContent.svelte';
  import TextGradient from '$lib/components/shared/content/TextGradient.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import DatePicker from '$lib/components/shared/controls/DatePicker.svelte';
  import Select from '$lib/components/shared/controls/Select.svelte';
  import { SearchMatchMode } from '$lib/models/searchRequest';
  import { Calendar, Funnel, MagnifyingGlass } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { DateTime } from 'luxon';

  interface Props {
    from?: DateTime;
    to?: DateTime;
    matchMode?: SearchMatchMode;
    onFromChange?: (from?: string) => void;
    onToChange?: (to?: string) => void;
    onMatchModeChange?: (matchMode: SearchMatchMode) => void;
    onApply?: () => void;
    onReset?: () => void;
    onSelectToday?: () => void;
    onSelectLastWeek?: () => void;
    onSelectLastMonth?: () => void;
    onSelectLastYear?: () => void;
  }

  let {
    from,
    to,
    matchMode,
    onFromChange,
    onToChange,
    onMatchModeChange,
    onApply,
    onReset,
    onSelectToday,
    onSelectLastWeek,
    onSelectLastMonth,
    onSelectLastYear,
  }: Props = $props();

  const searchModeOptions: Array<{ label: string; value: SearchMatchMode }> = [
    {
      label: 'Mindestens eines',
      value: 'anyOf',
    },
    {
      label: 'Alle',
      value: 'allOf',
    },
  ];

  const menuClass = `
    flex flex-col items-center gap-5
    p-3 w-80
    text-blue-700 dark:text-blue-500
  `;
  const menuSectionClass = `flex flex-col gap-3 w-full`;
  const menuSectionTitleClass = `flex gap-2 text-lg text-fuchsia-600 dark:text-fuchsia-400`;
  const menuSectionItemClass = `flex flex-col items-center gap-1 w-full`;
  const menuActionsClass = `grid grid-cols-2 gap-x-3 gap-y-2 w-full`;
  const menuButtonClass = `!w-full`;

  function handleFromChange(from?: DateTime): void {
    onFromChange?.(from?.startOf('day').toISO() ?? undefined);
  }

  function handleToChange(to?: DateTime): void {
    onToChange?.(to?.endOf('day').toISO() ?? undefined);
  }

  function handleMatchModeChange(matchMode?: string): void {
    const parsedMatchMode = SearchMatchMode.safeParse(matchMode);
    onMatchModeChange?.(parsedMatchMode?.data ?? 'anyOf');
  }

  function handleApplyClick(): void {
    onApply?.();
  }

  function handleResetClick(): void {
    onReset?.();
  }

  function handleSelectTodayClick(): void {
    onSelectToday?.();
  }

  function handleSelectLastWeekClick(): void {
    onSelectLastWeek?.();
  }

  function handleSelectLastMonthClick(): void {
    onSelectLastMonth?.();
  }

  function handleSelectLastYearClick(): void {
    onSelectLastYear?.();
  }
</script>

<Popover btnType="secondary" iconOnly title="Weitere Filter-Optionen" placement="bottom-end" appendTo="body">
  {#snippet buttonContent()}
    <Icon src={Funnel} theme="outlined" class="size-6" />
  {/snippet}
  {#snippet popoverContent({ onClose, transformOrigin })}
    <PopoverContent class={menuClass} {transformOrigin}>
      <section class={menuSectionClass}>
        <span class={menuSectionTitleClass}>
          <Icon src={Calendar} theme="outlined" class="size-6" />
          <TextGradient>Zeitraum</TextGradient>
        </span>
        <div class={menuActionsClass}>
          <Button class={menuButtonClass} btnType="secondary" size="small" onclick={handleSelectTodayClick}
            >Heute</Button
          >
          <Button class={menuButtonClass} btnType="secondary" size="small" onclick={handleSelectLastWeekClick}
            >Letzte Woche</Button
          >
          <Button class={menuButtonClass} btnType="secondary" size="small" onclick={handleSelectLastMonthClick}
            >Letzter Monat</Button
          >
          <Button class={menuButtonClass} btnType="secondary" size="small" onclick={handleSelectLastYearClick}
            >Letztes Jahr</Button
          >
        </div>
        <div class={menuSectionItemClass}>
          <label for="from-input">Von</label>
          <DatePicker id="from-input" value={from} placeholder="Von" onchange={handleFromChange} />
        </div>
        <div class={menuSectionItemClass}>
          <label for="to-input">Bis</label>
          <DatePicker id="to-input" value={to} placeholder="Bis" onchange={handleToChange} />
        </div>
      </section>
      <section class={menuSectionClass}>
        <span class={menuSectionTitleClass}>
          <Icon src={MagnifyingGlass} theme="outlined" class="size-6" />
          <TextGradient>Suchmodus</TextGradient>
        </span>
        <Select id="search-mode" value={matchMode} onchange={handleMatchModeChange} placeholder="Suchmodus">
          {#each searchModeOptions as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </Select>
      </section>
      <div class={menuActionsClass}>
        <Button
          class={menuButtonClass}
          btnType="secondary"
          onclick={() => {
            handleResetClick();
            onClose();
          }}>Zurücksetzen</Button
        >
        <Button
          class={menuButtonClass}
          onclick={() => {
            handleApplyClick();
            onClose();
          }}>Anwenden</Button
        >
      </div>
    </PopoverContent>
  {/snippet}
</Popover>
