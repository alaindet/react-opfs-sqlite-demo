import { Outlet } from 'react-router';

// import type { Recipe } from '@recipe-app/backend';
// import { useBackend } from './backend-context';
// import { RecipeForm } from './RecipeForm';
// import { RecipeCard } from './RecipeCard';
// import { DataPage } from './DataPage';

import style from './app.module.css';

// type Tab = 'recipes' | 'data';

export function App() {
  return (
    <div className={style.app}>
      <Outlet />
    </div>
  );

  // const backend = useBackend();
  // const [recipes, setRecipes] = useState<Recipe[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [tab, setTab] = useState<Tab>('recipes');

  // const refresh = useCallback(async () => {
  //   setLoading(true);
  //   const list = await backend.getRecipes();
  //   setRecipes(list);
  //   setLoading(false);
  // }, [backend]);

  // useEffect(() => {
  //   refresh();
  // }, [refresh]);

  // const handleDelete = async (id: number) => {
  //   await backend.deleteRecipe(id);
  //   refresh();
  // };

  // return (
  //   <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
  //     <h1 style={{ marginBottom: 8 }}>🍳 Recipes</h1>

  //     {/* Tab bar */}
  //     <nav style={styles.nav}>
  //       <button
  //         onClick={() => setTab("recipes")}
  //         style={{
  //           ...styles.tab,
  //           ...(tab === "recipes" ? styles.tabActive : {}),
  //         }}
  //       >
  //         Recipes
  //       </button>
  //       <button
  //         onClick={() => setTab("data")}
  //         style={{
  //           ...styles.tab,
  //           ...(tab === "data" ? styles.tabActive : {}),
  //         }}
  //       >
  //         Backup &amp; Restore
  //       </button>
  //     </nav>

  //     {/* Recipes tab */}
  //     {tab === "recipes" && (
  //       <>
  //         <RecipeForm onCreated={refresh} />

  //         <hr style={{ margin: "24px 0" }} />

  //         {loading ? (
  //           <p>Loading…</p>
  //         ) : recipes.length === 0 ? (
  //           <p style={{ color: "#888" }}>No recipes yet. Add one above!</p>
  //         ) : (
  //           <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
  //             {recipes.map((r) => (
  //               <RecipeCard key={r.id} recipe={r} onDelete={handleDelete} />
  //             ))}
  //           </div>
  //         )}
  //       </>
  //     )}

  //     {/* Data management tab */}
  //     {tab === "data" && <DataPage />}
  //   </div>
  // );
}

// const styles: Record<string, React.CSSProperties> = {
//   nav: {
//     display: "flex",
//     gap: 0,
//     marginBottom: 20,
//     borderBottom: "2px solid #e0e0e0",
//   },
//   tab: {
//     padding: "10px 20px",
//     background: "none",
//     border: "none",
//     borderBottom: "2px solid transparent",
//     marginBottom: -2,
//     fontSize: 14,
//     fontWeight: 500,
//     color: "#888",
//     cursor: "pointer",
//   },
//   tabActive: {
//     color: "#2a7",
//     borderBottomColor: "#2a7",
//   },
// };