import { ChangeEvent, MouseEvent, useCallback, useRef, useState } from 'react';

import style from './recipe-form.module.css';

// TODO: Move
export type RecipeFormValue = {
  title: string;
  description: string;
  imageFile: File;
};

export type RecipeFormProps = {
  isLoading?: boolean;
  onCreated: (formValue: RecipeFormValue) => void;
};

export function RecipeForm({
  isLoading = false,
  onCreated,
}: RecipeFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setTitle(ev.target.value)
  }, []);

  const handleDescriptionChange = useCallback((ev: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(ev.target.value)
  }, []);

  const handleSubmit = useCallback(async (ev: MouseEvent) => {
    ev.preventDefault();

    if (isLoading) {
      return;
    }

    const imageFile = fileRef.current?.files?.[0];

    // Validation
    if (!title) return;
    if (!description) return;
    if (!imageFile) return;

    onCreated({
      title,
      description,
      imageFile,
    });
  }, []);

  return (
    <form className={style.recipeForm}>

      <h2 className={style.title}>Add a recipe</h2>

      <div className={style.controls}>

        {/* Field: Title */}
        <div className={style.control}>
          <label htmlFor="field-title" className={style.label}>
            Title
          </label>
          <input
            type="text"
            id="field-title"
            placeholder="Recipe Title"
            value={title}
            onChange={handleTitleChange}
            disabled={isLoading}
            className={style.input}
          />
        </div>

        {/* Field: Description */}
        <div className={style.control}>
          <label htmlFor="field-description" className={style.label}>
            Description
          </label>
          <textarea
            id="field-description"
            placeholder="Description"
            value={description}
            onChange={handleDescriptionChange}
            rows={7}
            disabled={isLoading}
            className={style.input}
          />
        </div>

        {/* Field: File */}
        <div className={style.control}>
          <label htmlFor="field-image" className={style.label}>
            Image
          </label>
          <input
            type="file"
            id="field-image"
            ref={fileRef}
            disabled={isLoading}
            accept="image/*"
          />
        </div>

        {/* Button: Submit */}
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className={style.button}
        >
          Add Recipe
        </button>

      </div>
    </form>
  );
}