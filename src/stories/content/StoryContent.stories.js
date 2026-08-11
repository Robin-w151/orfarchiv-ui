import StoryContentView from './StoryContentView.svelte';

const args = {
  aiSummaryEnabled: false,
  audioEnabled: false,
};

export default {
  title: 'Content/StoryContent',
  component: StoryContentView,
  args,
};

const Template = (args) => ({
  Component: StoryContentView,
  props: args,
});

export const StoryContent = Template.bind({});

export const WithActions = Template.bind({});
WithActions.args = {
  aiSummaryEnabled: true,
  audioEnabled: true,
};
