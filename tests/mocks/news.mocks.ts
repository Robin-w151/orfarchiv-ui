export const newsMock = {
  stories: [
    {
      id: 'news:3284304',
      title: 'Frankfurt geht bei CL-Debüt baden',
      category: 'Sport',
      url: 'https://orf.at/stories/3284304/',
      timestamp: '2022-09-07T18:47:35.000Z',
      source: 'news',
    },
    {
      id: 'news:3284303',
      title: 'WIFO-Ökonom Böheim zu Strompreisbremse',
      category: 'Medien',
      url: 'https://orf.at/stories/3284303/',
      timestamp: '2022-09-06T18:20:50.000Z',
      source: 'news',
    },
    {
      id: 'news:3284215',
      title: 'Die Abrechnung des John Malkovich',
      category: 'Kultur',
      url: 'https://orf.at/stories/3284215/',
      timestamp: '2022-09-05T18:06:00.000Z',
      source: 'news',
    },
    {
      id: 'news:3284302',
      title: 'OMV: „Kein einklagbares Fehlverhalten“ bei Ex-Chef Seele',
      category: 'Wirtschaft',
      url: 'https://orf.at/stories/3284302/',
      timestamp: '2022-09-04T17:57:19.000Z',
      source: 'steiermark',
    },
    {
      id: 'news:3284301',
      title: 'Bolsonaro nutzt Unabhängigkeitstag für Wahlkampf',
      category: 'Ausland',
      url: 'https://orf.at/stories/3284301/',
      timestamp: '2022-09-03T17:37:36.000Z',
      source: 'news',
    },
  ],
  prevKey: {
    id: 'news:3284304',
    timestamp: '2022-09-07T18:47:35.000Z',
    type: 'prev',
  },
  nextKey: {
    id: 'news:3284301',
    timestamp: '2022-09-03T17:37:36.000Z',
    type: 'next',
  },
};

export const newsMockMore = {
  stories: [
    {
      id: 'noe:3172657',
      title: 'E-Bike-Lenker fuhr gegen Lkw und starb',
      category: 'Chronik',
      url: 'https://noe.orf.at/stories/3172657/',
      timestamp: '2022-09-03T16:33:49.000Z',
      source: 'noe',
    },
  ],
  nextKey: {
    id: 'noe:3172657',
    timestamp: '2022-09-03T16:33:49.000Z',
    type: 'next',
  },
};

export const newsMockUpdate = {
  stories: [
    {
      id: 'news:3284305',
      title: 'ÖFB-Spielerinnen hoffen auf größeres Stadion',
      category: 'Sport',
      url: 'https://orf.at/stories/3284305/',
      timestamp: '2022-09-07T19:06:29.000Z',
      source: 'news',
    },
  ],
  prevKey: {
    id: 'news:3284305',
    timestamp: '2022-09-07T19:06:29.000Z',
    type: 'prev',
  },
};

export const newsMockEmptyUpdate = {
  stories: [],
  prevKey: null,
};

export const newsMockWithFilter = {
  stories: [
    {
      id: 'news:3284304',
      title: 'Frankfurt geht bei CL-Debüt baden',
      category: 'Sport',
      url: 'https://orf.at/stories/3284304/',
      timestamp: '2022-09-07T18:47:35.000Z',
      source: 'news',
    },
    {
      id: 'news:3284302',
      title: 'OMV: „Kein einklagbares Fehlverhalten“ bei Ex-Chef Seele',
      category: 'Wirtschaft',
      url: 'https://orf.at/stories/3284302/',
      timestamp: '2022-09-07T17:57:19.000Z',
      source: 'news',
    },
  ],
  prevKey: {
    id: 'news:3284304',
    timestamp: '2022-09-07T18:47:35.000Z',
    type: 'prev',
  },
  nextKey: {
    id: 'news:3284302',
    timestamp: '2022-09-07T17:57:19.000Z',
    type: 'next',
  },
};

export const newsMockNoContent = {
  stories: [],
  prevKey: null,
  nextKey: null,
};

export const contentMockText =
  'Sporting Lissabon hat gestern das Debüt von Eintracht Frankfurt und Trainer Oliver Glasner in der UEFA Champions League verpatzt. Der portugiesische Vizemeister gewann beim regierenden Europa-League-Sieger durch Tore nach der Pause mit 3:0 (0:0). Im zweiten Spiel am frühen Abend fertigte Ajax Amsterdam die Glasgow Rangers 4:0 (3:0) ab.';

export const contentMock = {
  contentHtml: `<div><p>${contentMockText}</p></div>`,
  contentChapters: [{ segments: [contentMockText] }],
};

export const imageMockBaseUrl = 'https://images.test';
export const imageMockSources = {
  first: `${imageMockBaseUrl}/first.jpg`,
  broken: `${imageMockBaseUrl}/broken.jpg`,
  last: `${imageMockBaseUrl}/last.jpg`,
  small: `${imageMockBaseUrl}/small.jpg`,
  withoutSize: `${imageMockBaseUrl}/without-size.jpg`,
};
export const imageMockWidth = 1280;
export const imageMockHeight = 720;
export const imageMockSmallWidth = 240;
export const imageMockSmallHeight = 160;
export const imageMockCaption = 'Bildunterschrift des fehlerhaften Bildes';
export const imageMockCredit = 'Foto: Testquelle';
export const imageMockErrorMessage = 'Bild konnte nicht geladen werden';

export const contentMockWithImages = {
  contentHtml: `<div>
    <p>${contentMockText}</p>
    <figure>
      <div class="image-container">
        <img
          src="${imageMockSources.first}"
          width="${imageMockWidth}"
          height="${imageMockHeight}"
          alt="Erstes Bild"
        />
        <span class="image-credit-tag">Foto: Erste Testquelle</span>
      </div>
      <figcaption>Bildunterschrift des ersten Bildes</figcaption>
    </figure>
    <figure>
      <div class="image-container">
        <img
          src="${imageMockSources.broken}"
          width="${imageMockWidth}"
          height="${imageMockHeight}"
          alt="Fehlerhaftes Bild"
        />
        <span class="image-credit-tag">${imageMockCredit}</span>
      </div>
      <figcaption>${imageMockCaption}</figcaption>
    </figure>
    <img src="${imageMockSources.last}" width="${imageMockWidth}" height="${imageMockHeight}" alt="Letztes Bild" />
    <img
      src="${imageMockSources.small}"
      width="${imageMockSmallWidth}"
      height="${imageMockSmallHeight}"
      alt="Kleines Bild"
    />
    <img src="${imageMockSources.withoutSize}" alt="Bild ohne Abmessungen" />
  </div>`,
  contentChapters: [{ segments: [contentMockText] }],
};

export const newsMockSemantic = {
  stories: [
    {
      id: 'news:3284215',
      title: 'Die Abrechnung des John Malkovich',
      category: 'Kultur',
      url: 'https://orf.at/stories/3284215/',
      timestamp: '2022-09-05T18:06:00.000Z',
      source: 'news',
    },
    {
      id: 'news:3284304',
      title: 'Frankfurt geht bei CL-Debüt baden',
      category: 'Sport',
      url: 'https://orf.at/stories/3284304/',
      timestamp: '2022-09-07T18:47:35.000Z',
      source: 'news',
    },
    {
      id: 'news:3284303',
      title: 'WIFO-Ökonom Böheim zu Strompreisbremse',
      category: 'Medien',
      url: 'https://orf.at/stories/3284303/',
      timestamp: '2022-09-06T18:20:50.000Z',
      source: 'news',
    },
  ],
  ordering: 'relevance',
  prevKey: null,
  nextKey: null,
};
