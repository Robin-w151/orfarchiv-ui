import { readFile, writeFile } from 'fs/promises';
import { JSDOM } from 'jsdom';
import crypto from 'crypto';

const INPUT_FILE = 'src/app.html';
const OUTPUT_FILE = 'csp-script-hashes.js';
const ENCODING = 'utf-8';
const HASH_ALGORITHM = 'SHA-256';

main().catch(console.error);

async function main() {
  try {
    const scriptHashes = await calculateScriptHashes();
    if (scriptHashes.length === 0) {
      console.warn('No script tags found in the HTML file');
    }
    const scriptHashesString = scriptHashes.map((s) => `'${s}'`).join(', ');
    await writeFile(OUTPUT_FILE, `export default [${scriptHashesString}];\n`);
    console.log(`Successfully generated ${scriptHashes.length} script hashes`);
  } catch (error) {
    console.error('Failed to generate CSP script hashes:', error);
    process.exit(1);
  }
}

async function calculateScriptHashes() {
  const decoder = new TextDecoder(ENCODING);
  let appHtml;

  try {
    appHtml = decoder.decode(await readFile(INPUT_FILE));
  } catch (error) {
    throw new Error(`Failed to read HTML file ${INPUT_FILE}: ${error.message}`);
  }

  const appDocument = new JSDOM(appHtml).window.document;
  const scriptHashes = [];

  for (const script of appDocument.getElementsByTagName('script')) {
    const content = script.textContent;
    if (content) {
      try {
        scriptHashes.push(await calculateScriptHash(content));
      } catch (error) {
        console.error(`Failed to calculate hash for script: ${content.substring(0, 50)}...`, error);
      }
    }
  }

  return scriptHashes;
}

async function calculateScriptHash(scriptText) {
  if (!scriptText) {
    throw new Error('Script text cannot be empty');
  }

  try {
    const textEncoder = new TextEncoder();
    const encoded = textEncoder.encode(scriptText);
    const hashBuffer = await crypto.subtle.digest(HASH_ALGORITHM, encoded);
    const hashString = Buffer.from(hashBuffer).toString('base64');

    return `sha256-${hashString}`;
  } catch (error) {
    throw new Error(`Hash calculation failed: ${error.message}`);
  }
}
