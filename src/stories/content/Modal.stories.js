import ModalView from './ModalView.svelte';

const args = {
  isVisible: true,
  closeOnBackdropClick: false,
};

export default {
  title: 'Content/Modal',
  component: ModalView,
  args,
};

const Template = (args) => ({
  Component: ModalView,
  props: args,
});

export const Modal = Template.bind({});
