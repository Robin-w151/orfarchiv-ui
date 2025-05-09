<script lang="ts">
  import AlertBox from '$lib/components/shared/content/AlertBox.svelte';
  import Modal from '$lib/components/shared/content/Modal.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import Link from '$lib/components/shared/controls/Link.svelte';
  import { aiModelConfigMap } from '$lib/configs/client';
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

    await aiSummaryState.initialize();
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
</script>

<Modal
  modalClass="w-full h-full sm:h-[max(60%,36rem)] lg:h-[max(60%,48rem)]"
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
            <span
              >Erstellt mit KI (Modell: <Link href={aiModelConfigMap.get($settings.aiModel)!.ref} target="_blank"
                >{$settings.aiModel}</Link
              >)</span
            >
          </p>
        </div>
        <h1>{aiSummaryState.aiSummary.title}</h1>
        <ul>
          {#each aiSummaryState.aiSummary.points as point, index (index)}
            <li>
              <strong>{point.title}</strong>: <span>{point.text}</span>
            </li>
          {/each}
        </ul>
        <h2>Zusammenfassung</h2>
        <p>{aiSummaryState.aiSummary.summary}</p>
      </article>
    </div>
  {/if}
</Modal>
