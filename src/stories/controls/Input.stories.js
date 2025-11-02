import InputComponent from '$lib/components/shared/controls/Input.svelte';

const args = {
  id: 'input',
  value: '',
  placeholder: 'Enter text here',
  shortcutKeys: ['Ctrl', 'K'],
};

export default {
  title: 'Controls/Input',
  component: InputComponent,
  args,
  argTypes: {
    id: {
      type: 'string',
      description: 'Element id attribute',
      control: 'text',
    },
    value: {
      type: 'string',
      description: 'Current value of the input control',
      control: 'text',
    },
    placeholder: {
      type: 'string',
      description: 'Placeholder text of the input control',
      control: 'text',
    },
    shortcutKeys: {
      type: 'array',
      description: 'Shortcut keys of the input control',
      control: 'array',
    },
    onchange: {
      action: 'change',
      description: 'Called when the value of the input control is changed',
    },
  },
};

export const Input = (args) => ({
  Component: InputComponent,
  props: args,
  on: {
    onchange: args.onchange,
  },
});
