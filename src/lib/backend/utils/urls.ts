import { URL_ORF_REGEXP, URL_ORF_STORY_REGEXP } from '$lib/configs/server';

export function isOrfUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  return URL_ORF_REGEXP.test(url);
}

export function isOrfStoryUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  return URL_ORF_STORY_REGEXP.test(url);
}
