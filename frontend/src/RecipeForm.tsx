import { MouseEvent, useRef, useState } from 'react';

import { useBackend } from './backend-context';

export type RecipeFormProps = {
  onCreated: () => void;
}

export function RecipeForm({ onCreated }: RecipeFormProps) {
  const backend = useBackend();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: MouseEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      let imageBuffer: ArrayBuffer | undefined;
      let fileName: string | undefined;

      const file = fileRef.current?.files?.[0];
      if (file) {
        imageBuffer = await file.arrayBuffer();
        fileName = file.name;
      }

      await backend.createRecipe(title.trim(), description.trim(), imageBuffer, fileName);

      // Reset form
      setTitle("");
      setDescription("");
      if (fileRef.current) fileRef.current.value = "";

      onCreated();
    } catch (err) {
      console.error("Failed to create recipe:", err);
      alert("Failed to create recipe. Check the console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={{ margin: "0 0 12px" }}>Add a recipe</h2>
      <div style={styles.form}>
        <input
          type="text"
          placeholder="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          style={styles.input}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
          rows={3}
          style={styles.input}
        />

        <label style={styles.fileLabel}>
          Image (optional)
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            disabled={submitting}
            style={{ marginTop: 4 }}
          />
        </label>

        <button
          type="submit"
          onClick={handleSubmit}
          disabled={submitting || !title.trim()}
          style={{
            ...styles.button,
            opacity: submitting || !title.trim() ? 0.5 : 1,
          }}
        >
          {submitting ? "Saving…" : "Save recipe"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: "#f8f8f8",
    borderRadius: 8,
    padding: 16,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  input: {
    padding: "8px 10px",
    borderRadius: 4,
    border: "1px solid #ccc",
    fontSize: 14,
    fontFamily: "inherit",
  },
  fileLabel: {
    fontSize: 13,
    color: "#555",
  },
  button: {
    padding: "10px 16px",
    background: "#2a7",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: 14,
    cursor: "pointer",
    alignSelf: "flex-start",
  },
};