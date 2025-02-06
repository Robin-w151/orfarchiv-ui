import SelectView from './SelectView.svelte';

const args = {
  id: 'select',
  value: '1',
  placeholder: 'Enter text here',
};

export default {
  title: 'Controls/Select',
  component: SelectView,
  args,
  argTypes: {
    id: {
      type: 'string',
      description: 'Element id attribute',
      control: 'text',
    },
    value: {
      type: 'string',
      description: 'Current value of the select control',
      control: 'text',
    },
    placeholder: {
      type: 'string',
      description: 'Placeholder text of the select control',
      control: 'text',
    },
    onchange: {
      action: 'change',
      description: 'Called when the value of the select control is changed',
    },
  },
};

export const Select = (args) => ({
  Component: SelectView,
  props: args,
  on: {
    onchange: args.onchange,
  },
});
