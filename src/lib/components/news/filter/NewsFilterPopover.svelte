<script lang="ts">
  import Popover from '$lib/components/shared/content/Popover.svelte';
  import PopoverContent from '$lib/components/shared/content/PopoverContent.svelte';
  import TextGradient from '$lib/components/shared/content/TextGradient.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import DatePicker from '$lib/components/shared/controls/DatePicker.svelte';
  import CalendarIcon from '$lib/components/shared/icons/outline/CalendarIcon.svelte';
  import FunnelIcon from '$lib/components/shared/icons/outline/FunnelIcon.svelte';
  import type { DateTime } from 'luxon';

  interface Props {
    from?: DateTime;
    to?: DateTime;
    onFromChange?: (from?: string) => void;
    onToChange?: (to?: string) => void;
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
    onFromChange,
    onToChange,
    onApply,
    onReset,
    onSelectToday,
    onSelectLastWeek,
    onSelectLastMonth,
    onSelectLastYear,
  }: Props = $props();

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

  function handleFromChange(from?: DateTime) {
    onFromChange?.(from?.startOf('day').toISO() ?? undefined);
  }

  function handleToChange(to?: DateTime) {
    onToChange?.(to?.endOf('day').toISO() ?? undefined);
  }

  function handleApplyClick() {
    onApply?.();
  }

  function handleResetClick() {
    onReset?.();
  }

  function handleSelectTodayClick() {
    onSelectToday?.();
  }

  function handleSelectLastWeekClick() {
    onSelectLastWeek?.();
  }

  function handleSelectLastMonthClick() {
    onSelectLastMonth?.();
  }

  function handleSelectLastYearClick() {
    onSelectLastYear?.();
  }
</script>

<Popover btnType="secondary" iconOnly title="Weitere Filter-Optionen" placement="bottom-end">
  {#snippet buttonContent()}
    <FunnelIcon />
  {/snippet}
  {#snippet popoverContent(onClose)}
    <PopoverContent class={menuClass}>
      <section class={menuSectionClass}>
        <span class={menuSectionTitleClass}>
          <CalendarIcon />
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
