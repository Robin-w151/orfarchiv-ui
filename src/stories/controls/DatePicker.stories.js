import DatePickerComponent from '$lib/components/shared/controls/DatePicker.svelte';
import { Settings } from 'luxon';

Settings.defaultLocale = 'de';

const args = {
  id: 'date-picker',
  value: '',
  placeholder: 'Select a date',
};

export default {
  title: 'Controls/DatePicker',
  component: DatePickerComponent,
  args,
};

export const DatePicker = (args) => ({
  Component: DatePickerComponent,
  props: args,
  on: {
    onchange: args.onchange,
    onclear: args.onclear,
  },
});
