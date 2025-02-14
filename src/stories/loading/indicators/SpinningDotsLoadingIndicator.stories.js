import SpinningDotsLoadingIndicatorView from './SpinningDotsLoadingIndicatorView.svelte';

const args = {
  showLoadingIndicator: false,
  delay: 0,
  onchange: (event) => {
    console.log('change event', event);
  },
  onclick: (event) => {
    console.log('click event', event);
  },
  onkeydown: (event) => {
    console.log('keydown event', event);
  },
};

export default {
  title: 'Loading/Indicators/SpinningDots',
  component: SpinningDotsLoadingIndicatorView,
  args,
};

const Template = (args) => ({
  Component: SpinningDotsLoadingIndicatorView,
  props: args,
  on: {
    change: args.onchange,
    click: args.onclick,
    keydown: args.onkeydown,
  },
});

export const SpinningDots = Template.bind({});
