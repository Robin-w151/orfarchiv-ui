import SpinningDotsLoadingIndicatorView from './SpinningDotsLoadingIndicatorView.svelte';

const args = {
  showLoadingIndicator: false,
  delay: 0,
};

export default {
  title: 'Loading/SpinningDots',
  component: SpinningDotsLoadingIndicatorView,
  args,
};

const Template = (args) => ({
  Component: SpinningDotsLoadingIndicatorView,
  props: args,
  on: {
    change: args.onChange,
  },
});

export const SpinningDots = Template.bind({});
