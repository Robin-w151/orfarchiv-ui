<script lang="ts">
  import Item from '$lib/components/shared/content/Item.svelte';
  import Section from '$lib/components/shared/content/Section.svelte';
  import SectionList from '$lib/components/shared/content/SectionList.svelte';
  import Select from '$lib/components/shared/controls/Select.svelte';
  import { audioStore } from '$lib/stores/runes/audio.svelte';
  import settings from '$lib/stores/settings';

  function handleVoiceChange(voiceURI: string | undefined): void {
    settings.setAudioVoice(voiceURI);
  }
</script>

<Section title="Audio">
  <SectionList>
    <Item noColumn>
      <span>Stimme für Sprachausgabe</span>
      <Select id="audio-voice-select" value={audioStore.voice?.voiceURI} onchange={handleVoiceChange}>
        {#each audioStore.voices as voice}
          <option value={voice.voiceURI}>{voice.name}</option>
        {/each}
      </Select>
    </Item>
  </SectionList>
</Section>
