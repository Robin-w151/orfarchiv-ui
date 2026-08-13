import { Predicate } from 'effect';

export function injectSlideShowImages(optimizedDocument: Document, originalDocument: Document): void {
  const slideShowRegexp = /^fotostrecke mit/i;
  const slideShowElements = [...originalDocument.querySelectorAll('.oon-slideshow')] as Array<HTMLElement>;
  const slideShowHeaders = [...optimizedDocument.querySelectorAll('h3')].filter((header) =>
    slideShowRegexp.test(header.textContent ?? ''),
  );

  if (slideShowElements.length !== slideShowHeaders.length) {
    return;
  }

  for (let i = 0; i < slideShowElements.length; i++) {
    const slideShowSection = slideShowElements[i];
    const slideShowHeader = slideShowHeaders[i];

    if (slideShowHeader.parentElement?.querySelector('h3 + div')) {
      continue;
    }

    const slideShowList = slideShowSection.querySelector('.oon-slideshow-list');
    slideShowList?.removeAttribute('class');
    slideShowList?.setAttribute('class', 'slideshow');

    const footers = [...slideShowSection.querySelectorAll('figure > footer')];
    for (const footer of footers) {
      footer.remove();
    }

    const images = [...slideShowSection.querySelectorAll('img')];
    for (const image of images) {
      image.src = image.dataset.src ?? '';
      image.srcset = image.dataset.srcset ?? '';
      image.removeAttribute('class');
      image.setAttribute('loading', 'lazy');
    }

    if (slideShowList) {
      slideShowHeader.after(slideShowList);
    }
  }
}

export function adjustImages(optimizedDocument: Document, originalDocument: Document): void {
  const originalImages = mapImagesByUrl(originalDocument);

  for (const image of optimizedDocument.querySelectorAll('img')) {
    if (Number(image.getAttribute('width')) > 0 && Number(image.getAttribute('height')) > 0) {
      continue;
    }

    const size = findImageSize(image, originalImages);
    if (size) {
      image.setAttribute('width', `${size.width}`);
      image.setAttribute('height', `${size.height}`);
    }
  }
}

function mapImagesByUrl(originalDocument: Document): Map<string, HTMLImageElement> {
  const images = new Map<string, HTMLImageElement>();
  for (const image of originalDocument.querySelectorAll('img')) {
    for (const url of findImageUrls(image)) {
      if (!images.has(url)) {
        images.set(url, image);
      }
    }
  }

  return images;
}

function findImageUrls(image: HTMLImageElement): Array<string> {
  const sources = [image.getAttribute('src'), image.dataset.src, image.getAttribute('srcset'), image.dataset.srcset];
  return sources
    .filter((source): source is string => Predicate.isNotNullable(source) && !source.startsWith('data:'))
    .flatMap((source) => source.split(',').map((candidate) => candidate.trim().split(/\s+/)[0]))
    .filter((url) => !!url);
}

function findImageSize(
  image: HTMLImageElement,
  originalImages: Map<string, HTMLImageElement>,
): { width: number; height: number } | undefined {
  const originalImage = findImageUrls(image)
    .map((url) => originalImages.get(url))
    .find((image) => Predicate.isNotNullable(image));

  return (
    findImageSizeFromAttributes(originalImage) ??
    findImageSizeFromCropUrl(image) ??
    findImageSizeFromPlaceholder(originalImage)
  );
}

function findImageSizeFromAttributes(image?: HTMLImageElement): { width: number; height: number } | undefined {
  const width = Number(image?.getAttribute('width'));
  const height = Number(image?.getAttribute('height'));
  return width > 0 && height > 0 ? { width, height } : undefined;
}

function findImageSizeFromPlaceholder(image?: HTMLImageElement): { width: number; height: number } | undefined {
  const placeholder = image?.getAttribute('src');
  if (!placeholder?.startsWith('data:image/svg+xml')) {
    return undefined;
  }

  const viewBox = /viewBox=['"]?\d+[ %]+\d+[ %]+(\d+)[ %]+(\d+)/i.exec(decodePlaceholder(placeholder));
  if (!viewBox) {
    return undefined;
  }

  const width = Number(viewBox[1]);
  const height = Number(viewBox[2]);
  return width > 0 && height > 0 ? { width, height } : undefined;
}

function decodePlaceholder(placeholder: string): string {
  try {
    return decodeURIComponent(placeholder);
  } catch {
    return placeholder;
  }
}

function findImageSizeFromCropUrl(image: HTMLImageElement): { width: number; height: number } | undefined {
  const source = image.getAttribute('src') ?? '';
  const width = Number(/[/,]w=(\d+)/.exec(source)?.[1]);
  const height = Number(/[/,]h=(\d+)/.exec(source)?.[1]);
  return width > 0 && height > 0 ? { width, height } : undefined;
}
