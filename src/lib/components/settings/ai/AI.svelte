<script lang="ts">
  import Item from '$lib/components/shared/content/Item.svelte';
  import Section from '$lib/components/shared/content/Section.svelte';
  import SectionList from '$lib/components/shared/content/SectionList.svelte';
  import SimpleItem from '$lib/components/shared/content/SimpleItem.svelte';
  import Checkbox from '$lib/components/shared/controls/Checkbox.svelte';
  import Input from '$lib/components/shared/controls/Input.svelte';
  import Label from '$lib/components/shared/controls/Label.svelte';
  import Select from '$lib/components/shared/controls/Select.svelte';
  import { AiModels } from '$lib/models/ai';
  import settings from '$lib/stores/settings';

  function handleAiSummaryEnabledChange(event: Event & { currentTarget: HTMLInputElement }): void {
    settings.setAiSummaryEnabled(event.currentTarget.checked);
  }

  function handleAiModelChange(value?: string): void {
    settings.setAiModel(value ?? 'gemini-2.0-flash');
  }

  function handleGeminiApiKeyChange(value?: string): void {
    settings.setGeminiApiKey(value);
  }
</script>

<Section title="Künstliche Intelligenz">
  <SectionList>
    <SimpleItem>
      <Checkbox
        id="ai-summary"
        label="KI-Zusammenfassung aktivieren"
        checked={$settings.aiSummaryEnabled}
        onchange={handleAiSummaryEnabledChange}
      />
    </SimpleItem>
    {#if $settings.aiSummaryEnabled}
      <Item>
        <Label label="KI-Modell">
          <Select id="ai-model" value={$settings.aiModel} onchange={handleAiModelChange} placeholder="KI-Modell">
            {#each AiModels as model (model)}
              <option value={model}>{model}</option>
            {/each}
          </Select>
        </Label>
      </Item>
      <Item>
        <Label label="Gemini API-Key">
          <Input
            id="gemini-api-key"
            value={$settings.geminiApiKey}
            onValueChange={handleGeminiApiKeyChange}
            placeholder="Gemini API-Key"
          />
        </Label>
      </Item>
    {/if}
  </SectionList>
</Section>
