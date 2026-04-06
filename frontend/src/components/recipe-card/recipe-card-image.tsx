import { useEffect, useRef, useState } from 'react';

import style from './recipe-card-image.module.css';

export type RecipeCardImageProps = {
  filename: string;
  title: string;
};

export function RecipeCardImage({
  filename,
  title,
}: RecipeCardImageProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const placeholderImageRef = useRef<PlaceholderImage | null>(null);

  useEffect(() => {
    async function loadImage(filename: string) {
      setImageLoading(true);
      const image = await createPlaceholderImage(200, 150);
      placeholderImageRef.current = image;
      setImageSource(image.url());
      setImageLoading(false);
    }

    loadImage(filename);

    return () => {
      if (placeholderImageRef.current) {
        placeholderImageRef.current.destroy();
        placeholderImageRef.current = null;
      }
    };
  }, [filename]);

  if (imageLoading) {
    return (
      <div className={style.root}>
        <span className={style.placeholderText}>
          Loading...
        </span>
      </div>
    );
  }

  if (!imageSource) {
    return (
      <div className={style.root}>
        <span className={style.placeholderText}>
          Image not available
        </span>
      </div>
    );
  }

  return (
    <div className={style.root}>
      <img src={imageSource} alt={title} />
    </div>
  );
}

function fakeFilenameToUrl(filename: string): Promise<string> {
  return fakePromise('https://placehold.co/400x300', 500);
}

function fakePromise<T extends any>(result: T, delay = 500): Promise<T> {
  return new Promise(done => {
    setTimeout(() => done(result), delay);
  });
}

type PlaceholderImage = {
  blob: Blob;
  url: () => string;
  destroy: () => void;
};

async function createPlaceholderImage(
  width: number,
  height: number,
): Promise<PlaceholderImage> {
  let url: string | null = null;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#cccccc';
  ctx.fillRect(0, 0, width, height);

  ctx.font = '64px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${width} x ${height}`, width / 2, height / 2);

  const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });
  
  return {
    blob,
    url: () => {
      if (!url) {
        url = URL.createObjectURL(blob);
      }
      return url;
    },
    destroy: () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    },
  };
}