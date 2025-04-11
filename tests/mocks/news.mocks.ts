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
      source: 'news',
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
  content: `<div><p>${contentMockText}</p></div>`,
  contentText: contentMockText,
};
