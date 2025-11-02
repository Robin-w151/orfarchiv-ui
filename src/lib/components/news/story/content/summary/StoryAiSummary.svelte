<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import AlertBox from '$lib/components/shared/content/AlertBox.svelte';
  import Modal from '$lib/components/shared/content/Modal.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import ButtonLink from '$lib/components/shared/controls/ButtonLink.svelte';
  import Link from '$lib/components/shared/controls/Link.svelte';
  import { AI_MODEL_CONFIG_MAP } from '$lib/configs/client';
  import { StoryContent } from '$lib/models/story';
  import settings from '$lib/stores/settings';
  import { ArrowPath, ExclamationCircle } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { onDestroy, onMount } from 'svelte';
  import StoryAiSummarySkeleton from './StoryAiSummarySkeleton.svelte';
  import { StoryAiSummaryState } from './StoryAiSummaryState.svelte';

  interface Props {
    storyContent: StoryContent;
    onClose?: () => void;
  }

  let { storyContent, onClose }: Props = $props();

  const aiSummaryState = new StoryAiSummaryState(storyContent);

  onMount(async () => {
    const contentText = storyContent?.contentText;
    if (!contentText) {
      onClose?.();
      return;
    }

    await aiSummaryState.generateAiSummary();
  });

  onDestroy(async () => {
    aiSummaryState.destroy();
  });

  async function handleAiSummaryClose(): Promise<void> {
    onClose?.();
  }

  async function handleAiSummaryRegenerate(): Promise<void> {
    await aiSummaryState.generateAiSummary();
  }

  async function handleAiSummarySettings(event: Event): Promise<void> {
    event.preventDefault();
    onClose?.();
    await goto(resolve('/settings'));
  }
</script>

<Modal
  class="w-full h-full sm:h-[max(80%,36rem)] lg:h-[max(60%,48rem)]"
  label="KI-Zusammenfassung"
  onClose={handleAiSummaryClose}
>
  {#if aiSummaryState.aiSummaryError}
    <AlertBox
      title={aiSummaryState.aiSummaryError.title}
      message={aiSummaryState.aiSummaryError.message}
      icon={ExclamationCircle}
      boxPadding="p-4 sm:p-8"
    >
      {#snippet actionsContent()}
        <Button class="w-max" btnType="secondary" onclick={handleAiSummaryRegenerate}>Erneut versuchen</Button>
        <ButtonLink class="w-max" href={resolve('/settings')} onclick={handleAiSummarySettings}
          >Zu den Einstellungen</ButtonLink
        >
      {/snippet}
    </AlertBox>
  {:else if aiSummaryState.aiSummaryLoading}
    <StoryAiSummarySkeleton />
  {:else if aiSummaryState.aiSummary}
    <div class="flex flex-col items-center gap-4 pb-4">
      <article class="story-content" data-testid="ai-summary">
        <div class="byline">
          <p class="flex items-center gap-2">
            <Button btnType="secondary" title="Erneut generieren" iconOnly round onclick={handleAiSummaryRegenerate}>
              <Icon src={ArrowPath} class="h-4 w-4" />
            </Button>
            <span>
              <span>Erstellt mit KI</span>
              <span class="inline-block">
                (Modell: <Link href={AI_MODEL_CONFIG_MAP[$settings.aiModel].ref} target="_blank"
                  >{AI_MODEL_CONFIG_MAP[$settings.aiModel].name}</Link
                >)
              </span>
            </span>
          </p>
        </div>
        <h1>{aiSummaryState.aiSummary.title}</h1>
        <div>
          {#each aiSummaryState.aiSummary.points as point, index (index)}
            <h2>{point.title}</h2>
            <p>{point.text}</p>
          {/each}
        </div>
      </article>
    </div>
  {/if}
</Modal>
