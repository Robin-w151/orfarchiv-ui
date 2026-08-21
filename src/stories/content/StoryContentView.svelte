<script lang="ts">
  import NewsList from '$lib/components/news/NewsList.svelte';
  import type { NewsBucket } from '$lib/models/news';
  import type { Story, StoryContent as StoryContentModel } from '$lib/models/story';
  import contentStore from '$lib/stores/content';
  import settings from '$lib/stores/settings';
  import { onMount, tick } from 'svelte';

  interface Props {
    aiSummaryEnabled: boolean;
    audioEnabled: boolean;
  }

  let { aiSummaryEnabled = false, audioEnabled = false }: Props = $props();

  let listRef: HTMLElement | undefined = $state();

  const story: Story = {
    id: 'news:33172938',
    title: 'Alles, was ein Artikel zu bieten hat',
    category: 'Chronik',
    url: 'https://orf.at/stories/3311767/',
    timestamp: '2023-04-06T17:55:33.000Z',
    source: 'news',
  };

  const content = `
    <h1>Alles, was ein Artikel zu bieten hat</h1>

    <div class="fact">
      <h2>Die Zahlen im Überblick</h2>
      <p>Rund <strong>1,2 Millionen</strong> Menschen waren im Vorjahr betroffen – ein Plus von 4,3 Prozent
      gegenüber dem Jahr davor.</p>
    </div>

    <p>Dieser Beispielartikel enthält <strong>fetten</strong> und <em>kursiven</em> Text, einen
    <a href="https://orf.at">Link auf orf.at</a> sowie <span class="keyword">hervorgehobene Schlagwörter</span>.
    Der Fließtext läuft über mehrere Absätze, damit Zeilenabstände, Umbrüche und die Umflussung der
    Faktenbox sichtbar werden.</p>

    <p>Ein zweiter Absatz zeigt, wie sich längere Passagen verhalten. Auch <code>Codefragmente</code> und
    Abkürzungen wie <abbr title="Österreichischer Rundfunk">ORF</abbr> kommen vor. Mit einem Zeilenumbruch<br />
    geht es direkt in der nächsten Zeile weiter.</p>

    <h2>Bild mit Bildunterschrift</h2>
    <figure>
      <div class="image-container">
        <img
          src="https://images.pexels.com/photos/28719602/pexels-photo-28719602/free-photo-of-historic-tower-in-italian-city-at-sunset.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Historischer Turm bei Sonnenuntergang"
        />
        <span class="image-credit-tag">Foto: Pexels</span>
      </div>
      <figcaption>Ein historischer Turm in einer italienischen Stadt bei Sonnenuntergang</figcaption>
    </figure>

    <h2>Bild, das nicht geladen werden kann</h2>
    <figure>
      <div class="image-container">
        <img
          src="https://images.example.invalid/nicht-vorhanden.jpg"
          width="1280"
          height="720"
          alt="Bild, das nicht geladen werden kann"
        />
        <span class="image-credit-tag">Foto: Pexels</span>
      </div>
      <figcaption>Die Bildunterschrift bleibt auch bei einem fehlerhaften Bild erhalten</figcaption>
    </figure>

    <h2>Zitat</h2>
    <blockquote>
      &quot;Die Entwicklung der vergangenen Monate zeigt deutlich, dass wir umdenken müssen&quot;, sagte die
      Sprecherin am Donnerstag.
    </blockquote>

    <h2>Aufzählungen</h2>
    <h3>Ungeordnete Liste</h3>
    <ul>
      <li>Erster Punkt der Aufzählung</li>
      <li>Zweiter Punkt mit einem <a href="https://orf.at">Link</a> darin</li>
      <li>
        Dritter Punkt mit verschachtelter Liste
        <ul>
          <li>Untergeordneter Punkt eins</li>
          <li>Untergeordneter Punkt zwei</li>
        </ul>
      </li>
    </ul>

    <h3>Geordnete Liste</h3>
    <ol>
      <li>Zuerst die Voraussetzungen prüfen</li>
      <li>Danach den Antrag einbringen</li>
      <li>Zuletzt die Bestätigung abwarten</li>
    </ol>

    <h2>Tabelle</h2>
    <table>
      <thead>
        <tr>
          <th>Bundesland</th>
          <th>Fälle</th>
          <th>Veränderung</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Wien</td>
          <td>412.300</td>
          <td>+5,1 %</td>
        </tr>
        <tr>
          <td>Niederösterreich</td>
          <td>287.900</td>
          <td>+3,4 %</td>
        </tr>
        <tr>
          <td>Oberösterreich</td>
          <td>243.100</td>
          <td>-1,2 %</td>
        </tr>
        <tr>
          <td>Burgenland</td>
          <td>61.700</td>
          <td>+0,8 %</td>
        </tr>
      </tbody>
    </table>

    <h2>Tabelle ohne Kopfzeile</h2>
    <table>
      <tr>
        <td>Wien</td>
        <td>412.300</td>
        <td>+5,1 %</td>
      </tr>
      <tr>
        <td>Niederösterreich</td>
        <td>287.900</td>
        <td>+3,4 %</td>
      </tr>
      <tr>
        <td>Oberösterreich</td>
        <td>243.100</td>
        <td>-1,2 %</td>
      </tr>
      <tr>
        <td>Burgenland</td>
        <td>61.700</td>
        <td>+0,8 %</td>
      </tr>
    </table>

    <h2>Zweites Bild</h2>
    <figure>
      <img
        src="https://images.pexels.com/photos/28518085/pexels-photo-28518085/free-photo-of-colorful-european-houses-with-tiled-roofs.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        alt="Bunte Häuser mit Ziegeldächern"
      />
      <figcaption>Bunte europäische Häuser mit Ziegeldächern - anklickbar für den Bildbetrachter</figcaption>
    </figure>

    <h2>Video</h2>
    <video controls poster="https://images.pexels.com/photos/28518085/pexels-photo-28518085/free-photo-of-colorful-european-houses-with-tiled-roofs.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&dpr=1">
      <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
    </video>

    <div class="story-footer">
      <p>Mehr dazu in <a href="https://orf.at/stories/3311767/">einem weiteren Artikel</a>.</p>
    </div>

    <p class="byline">Von Max Mustermann, ORF.at</p>
    <p class="tv-notice">Sendungshinweis: &quot;ZIB 2&quot;, 6.4.2023, 22.00 Uhr, ORF2</p>
  `;

  const storyContent: StoryContentModel = {
    contentHtml: content,
    contentChapters: [
      { segments: ['Ein einleitender Absatz ohne Überschrift.', 'Ein weiterer Satz der Einleitung.'] },
      { title: 'Reaktionen aus der Politik', segments: ['Reaktionen aus der Politik. Ein erster Abschnitt.'] },
      { title: 'Ausblick', segments: ['Ausblick. Ein zweiter Abschnitt.', 'Und noch ein Satz dazu.'] },
    ],
    id: story.id,
    timestamp: story.timestamp,
    source: { name: 'news', url: story.url },
  };

  const newsBucket: NewsBucket = {
    name: 'Donnerstag, 06.04.2023',
    date: '2023-04-06',
    stories: [story],
  };

  // Preseed the cache so StoryContent renders without hitting the backend.
  contentStore.setContent(story.id, storyContent);

  onMount(async () => {
    // Story renders its content collapsed, so expand it the way a user would.
    await tick();
    listRef?.querySelector<HTMLElement>('header[role="button"]')?.click();
  });

  $effect(() => {
    settings.setAiSummaryEnabled(aiSummaryEnabled);
  });

  $effect(() => {
    settings.setAudioEnabled(audioEnabled);
  });
</script>

<div class="w-full max-w-screen-lg" bind:this={listRef}>
  <NewsList storyBuckets={[newsBucket]} />
</div>
