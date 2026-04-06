import { ChangeEvent, SubmitEvent, useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { CreateRecipeDto } from '../../types';
import style from './recipe-form.module.css';

export type RecipeFormProps = {
  isLoading?: boolean;
  onCreated: (formValue: CreateRecipeDto) => void;
};

export function RecipeForm({
  isLoading = false,
  onCreated,
}: RecipeFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleTitleChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setTitle(ev.target.value)
  }, []);

  const handleDescriptionChange = useCallback((ev: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(ev.target.value)
  }, []);

  function resetForm() {
    setTitle('');
    setDescription('');
    fileRef!.current!.value = '';
  }

  async function handleSubmit(ev: SubmitEvent) {
    ev.preventDefault();

    if (isLoading) {
      return;
    }

    const imageFile = fileRef.current?.files?.[0];

    // Validation
    if (!title) {
      alert('Invalid title');
      return;
    }

    if (!description) {
      alert('Invalid description');
      return;
    }

    if (!imageFile) {
      alert('Invalid image');
      return;
    }

    const dto: CreateRecipeDto = { title, description, imageFile };
    onCreated(dto);
    resetForm();
  }

  return (
    <form className={style.recipeForm} onSubmit={handleSubmit}>

      <div className={style.header}>
        <h2 className={style.title}>Add a recipe</h2>
        <button
          type="button"
          className={style.headerButton}
          onClick={handleToggleCollapse}
        >
          {isCollapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      <div className={clsx(
        style.body,
        isCollapsed ? style['--collapsed'] : null,
      )}>
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
      </div>

      <div className={clsx(
        style.footer,
        isCollapsed ? style['--collapsed'] : null,
      )}>
        {/* Button: Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={style.button}
        >
          Add Recipe
        </button>
      </div>

    </form>
  );
}