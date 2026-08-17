import { JSDOM } from 'jsdom';

export function createDom(data: string, url: string): Document {
  return new JSDOM(data, { url }).window.document;
}
