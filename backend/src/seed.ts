/**
 * Seed script – populates the DB with sample recipes on first run.
 * Generates placeholder images programmatically via OffscreenCanvas
 * so we don't need to bundle any static assets.
 *
 * Idempotent: checks if recipes already exist before inserting.
 */

import { getDb } from "./db.js";
import { saveImage } from "./images.js";

interface SeedRecipe {
  title: string;
  description: string;
  color: string;   // background color for the placeholder image
  emoji: string;   // drawn on the placeholder
}

const SEED_DATA: SeedRecipe[] = [
  {
    title: "Spaghetti Carbonara",
    description:
      "Classic Roman pasta with eggs, pecorino, guanciale and black pepper. Simple ingredients, extraordinary result.",
    color: "#F5DEB3",
    emoji: "🍝",
  },
  {
    title: "Margherita Pizza",
    description:
      "San Marzano tomato sauce, fresh mozzarella, basil leaves, and a drizzle of olive oil on a thin crust.",
    color: "#FF6347",
    emoji: "🍕",
  },
  {
    title: "Japanese Chicken Curry",
    description:
      "A mild, sweet curry with tender chicken, potatoes, and carrots. Comfort food at its best, served over steamed rice.",
    color: "#DAA520",
    emoji: "🍛",
  },
  {
    title: "Caesar Salad",
    description:
      "Crisp romaine, parmigiano, croutons, and a creamy anchovy dressing. The perfect starter.",
    color: "#90EE90",
    emoji: "🥗",
  },
  {
    title: "Chocolate Lava Cake",
    description:
      "Warm, rich chocolate cake with a molten centre. Serve with vanilla ice cream for the full experience.",
    color: "#5C3317",
    emoji: "🍫",
  },
];

/**
 * Generate a simple placeholder image: solid color background
 * with a large emoji and the recipe title text.
 */
async function generatePlaceholder(
  title: string,
  color: string,
  emoji: string
): Promise<ArrayBuffer> {
  const W = 800;
  const H = 600;
  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);

  // Subtle gradient overlay for depth
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(0,0,0,0.15)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Large emoji
  ctx.font = "120px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, W / 2, H / 2 - 30);

  // Title text
  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 6;
  ctx.fillText(title, W / 2, H / 2 + 80, W - 60);

  const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.85 });
  return blob.arrayBuffer();
}

export async function seed(): Promise<void> {
  const db = getDb();

  // Check if already seeded
  const rows = db.exec({
    sql: "SELECT COUNT(*) FROM recipes",
    returnValue: "resultRows",
  });
  const count = rows[0][0] as number;

  if (count > 0) {
    console.log(`[seed] DB already has ${count} recipe(s), skipping seed.`);
    return;
  }

  console.log("[seed] Seeding database with sample recipes…");

  for (const item of SEED_DATA) {
    const buffer = await generatePlaceholder(item.title, item.color, item.emoji);
    const filename = await saveImage(buffer, `${item.title}.webp`);

    db.exec({
      sql: "INSERT INTO recipes (title, description, image_filename) VALUES (?, ?, ?)",
      bind: [item.title, item.description, filename],
    });

    console.log(`[seed] ✓ ${item.title}`);
  }

  console.log("[seed] Done – inserted", SEED_DATA.length, "recipes.");
}