import { useEffect, useState } from 'react';

import style from './recipe-card-image.module.css';

export type RecipeCardImageProps = {
  file: File;
  title: string;
};

export function RecipeCardImage({
  file,
  title,
}: RecipeCardImageProps) {
  const [imageSource, setImageSource] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!imageSource) {
    return null;
  }

  return (
    <div className={style.root}>
      <img src={imageSource} alt={title} />
    </div>
  );
}
