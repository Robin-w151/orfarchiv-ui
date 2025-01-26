import NewsListView from './NewsListView.svelte';

const args = {
  isLoading: false,
  forceReducedMotion: false,
};

export default {
  title: 'Content/NewsList',
  component: NewsListView,
  args,
};

const Template = (args) => ({
  Component: NewsListView,
  props: args,
});

export const NewsList = Template.bind({});
