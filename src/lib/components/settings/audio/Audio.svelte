<script lang="ts">
  import Section from '$lib/components/shared/content/Section.svelte';
  import SectionList from '$lib/components/shared/content/SectionList.svelte';
  import SimpleItem from '$lib/components/shared/content/SimpleItem.svelte';
  import Checkbox from '$lib/components/shared/controls/Checkbox.svelte';
  import Label from '$lib/components/shared/controls/Label.svelte';
  import Select from '$lib/components/shared/controls/Select.svelte';
  import { getAudioStore } from '$lib/stores/runes/audio.svelte';
  import settings from '$lib/stores/settings';

  const audioStore = getAudioStore();

  function handleAudioEnabledChange(event: Event & { currentTarget: HTMLInputElement }): void {
    settings.setAudioEnabled(event.currentTarget.checked);
  }

  function handleVoiceChange(voiceURI: string | undefined): void {
    settings.setAudioVoice(voiceURI);
  }
</script>

<Section title="Audio">
  <SectionList>
    <SimpleItem>
      <Checkbox
        id="audio-enabled-checkbox"
        label="Sprachausgabe aktivieren"
        checked={$settings.audioEnabled}
        onchange={handleAudioEnabledChange}
      />
    </SimpleItem>
    {#if $settings.audioEnabled}
      <SimpleItem>
        <Label label="Stimme für Sprachausgabe">
          <Select id="audio-voice-select" value={audioStore.voice?.voiceURI} onchange={handleVoiceChange}>
            {#each audioStore.voices as voice (voice.voiceURI)}
              <option value={voice.voiceURI}>{voice.name}</option>
            {/each}
          </Select>
        </Label>
      </SimpleItem>
    {/if}
  </SectionList>
</Section>
