import { useEffect, useState, useRef } from "react";
import { useBackend } from "./backend-context.tsx";
import type { Recipe } from "@recipe-app/backend";

interface Props {
  recipe: Recipe;
  onDelete: (id: number) => void;
}

export function RecipeCard({ recipe, onDelete }: Props) {
  const backend = useBackend();
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const urlRef = useRef<string | null>(null);

  // Lazy-load image from the Worker when card mounts
  useEffect(() => {
    if (!recipe.image_filename) return;

    let cancelled = false;
    setImgLoading(true);

    backend.getImageUrl(recipe.image_filename).then((url) => {
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      urlRef.current = url;
      setImgSrc(url);
      setImgLoading(false);
    });

    // Revoke object URL on unmount to free memory
    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [backend, recipe.image_filename]);

  return (
    <div style={styles.card}>
      {/* Image area */}
      {recipe.image_filename && (
        <div style={styles.imageBox}>
          {imgLoading ? (
            <div style={styles.placeholder}>Loading image…</div>
          ) : imgSrc ? (
            <img src={imgSrc} alt={recipe.title} style={styles.image} />
          ) : (
            <div style={styles.placeholder}>Image unavailable</div>
          )}
        </div>
      )}

      {/* Text content */}
      <div style={styles.body}>
        <h3 style={{ margin: 0 }}>{recipe.title}</h3>
        {recipe.description && (
          <p style={{ margin: "6px 0 0", color: "#444" }}>
            {recipe.description}
          </p>
        )}
        <div style={styles.footer}>
          <span style={{ fontSize: 12, color: "#999" }}>
            {new Date(recipe.created_at + "Z").toLocaleDateString()}
          </span>
          <button
            onClick={() => onDelete(recipe.id)}
            style={styles.deleteBtn}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
  },
  imageBox: {
    width: "100%",
    maxHeight: 300,
    overflow: "hidden",
    background: "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "auto",
    display: "block",
    objectFit: "cover",
    maxHeight: 300,
  },
  placeholder: {
    padding: 32,
    color: "#aaa",
    fontSize: 13,
  },
  body: {
    padding: 14,
  },
  footer: {
    marginTop: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteBtn: {
    background: "none",
    border: "1px solid #d44",
    color: "#d44",
    borderRadius: 4,
    padding: "4px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
};