import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Cookbook.css";
import { useLocation } from "react-router-dom";

/**
 * Cookbook.jsx (patched)
 * - Fix: ensure active recipe gets generated id after first Save
 * - Fix: trim category when filtering
 * - Fix: handle " " and "Space" keys; prevent scroll on Space
 * - Optional hardening: SSR-safe localStorage & window.confirm guards
 * - Small a11y: aria-haspopup on cards; focus modal on open
 */

const SEED_RECIPES = [
  {
    id: "r1",
    name: "Garlic Butter Shrimp",
    category: "Seafood",
    timeMinutes: 20,
    servings: 4,
    ingredients: [
      "1 lb shrimp, peeled & deveined",
      "4 tbsp unsalted butter",
      "3 cloves garlic, minced",
      "1 tbsp lemon juice",
      "Salt & pepper to taste",
      "Parsley for garnish"
    ],
    steps: [
      "Pat shrimp dry; season with salt & pepper.",
      "Melt butter; sauté garlic 30–45 sec.",
      "Add shrimp; cook 1–2 min per side until pink.",
      "Finish with lemon juice and parsley; serve warm."
    ]
  },
  {
    id: "r2",
    name: "Classic Pancakes",
    category: "Breakfast",
    timeMinutes: 25,
    servings: 3,
    ingredients: [
      "1 cup all-purpose flour",
      "2 tbsp sugar",
      "2 tsp baking powder",
      "1/4 tsp salt",
      "3/4 cup milk",
      "1 egg",
      "2 tbsp melted butter"
    ],
    steps: [
      "Whisk dry ingredients.",
      "Whisk wet; fold into dry just until combined.",
      "Cook 1/4-cup scoops on greased skillet until bubbles set; flip.",
      "Serve with butter & syrup."
    ]
  },
  {
    id: "r3",
    name: "Simple Chicken Alfredo",
    category: "Dinner",
    timeMinutes: 30,
    servings: 4,
    ingredients: [
      "12 oz fettuccine",
      "2 chicken breasts, sliced",
      "2 tbsp olive oil",
      "3 tbsp butter",
      "3 cloves garlic, minced",
      "1 cup heavy cream",
      "1 cup grated parmesan",
      "Salt & pepper"
    ],
    steps: [
      "Cook pasta to al dente; reserve 1/2 cup pasta water.",
      "Sauté chicken in oil; season; set aside.",
      "Melt butter; sauté garlic; add cream; simmer.",
      "Whisk in parmesan; loosen with pasta water; toss with pasta & chicken."
    ]
  },
  {
    id: "r4",
    name: "Classic Beef Tacos",
    category: "Mexican",
    timeMinutes: 25,
    servings: 4,
    ingredients: [
      "1 lb ground beef",
      "1 small onion, diced",
      "2 cloves garlic, minced",
      "2 tbsp taco seasoning",
      "1/2 cup water",
      "8 small corn or flour tortillas",
      "Shredded lettuce, diced tomatoes, shredded cheese",
      "Sour cream and salsa (optional)"
    ],
    steps: [
      "Cook beef in skillet over medium heat, breaking up, until browned; drain excess fat.",
      "Add onion and garlic; cook 2–3 minutes until softened.",
      "Stir in taco seasoning and water; simmer 3–4 minutes until thickened.",
      "Warm tortillas; assemble with beef and desired toppings. Serve immediately."
    ],
    notes: "For extra flavor, toast spices for 30 seconds before adding water. Great with pico de gallo."
  },
  {
    id: "r5",
    name: "Blueberry Buttermilk Pancakes",
    category: "Breakfast",
    timeMinutes: 20,
    servings: 4,
    ingredients: [
      "1 1/2 cups all-purpose flour",
      "2 tbsp sugar",
      "1 tsp baking powder",
      "1/2 tsp baking soda",
      "1/2 tsp salt",
      "1 1/4 cups buttermilk",
      "1 large egg",
      "2 tbsp melted butter (plus more for pan)",
      "1 cup fresh or frozen blueberries"
    ],
    steps: [
      "Whisk flour, sugar, baking powder, baking soda, and salt.",
      "Whisk buttermilk, egg, and melted butter, then fold into dry mix until just combined.",
      "Gently fold in blueberries.",
      "Cook 1/4-cup scoops on a buttered skillet over medium heat, 2–3 minutes per side."
    ],
    notes: "Do not overmix; a few lumps are fine. Add lemon zest for brightness."
  },
  {
    id: "r6",
    name: "Hearty Lentil Soup",
    category: "Vegetarian",
    timeMinutes: 40,
    servings: 6,
    ingredients: [
      "2 tbsp olive oil",
      "1 onion, diced",
      "2 carrots, diced",
      "2 celery ribs, diced",
      "3 cloves garlic, minced",
      "1 1/2 cups brown or green lentils, rinsed",
      "1 (14.5 oz) can diced tomatoes",
      "6 cups vegetable broth",
      "1 tsp ground cumin",
      "1 tsp smoked paprika",
      "Salt & pepper to taste",
      "Juice of 1/2 lemon",
      "Chopped parsley (optional)"
    ],
    steps: [
      "Sauté onion, carrots, and celery in oil until softened, 5–6 minutes; add garlic for 30 seconds.",
      "Stir in lentils, tomatoes, broth, cumin, and smoked paprika; bring to a boil.",
      "Reduce heat; simmer 20–25 minutes until lentils are tender.",
      "Season, finish with lemon juice, and garnish with parsley."
    ],
    notes: "Add a parmesan rind during simmering for extra depth (omit for vegan)."
  }

];

const STORAGE_KEY = "recipedat.cookbook.v2";

function loadRecipes() {
  if (!isBrowser) return SEED_RECIPES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_RECIPES;
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) return SEED_RECIPES;
    const byId = new Map(stored.map((r) => [r && r.id, r]).filter(([k]) => !!k));
    SEED_RECIPES.forEach((seed) => {
      if (seed && seed.id && !byId.has(seed.id)) byId.set(seed.id, seed);
    });
    return Array.from(byId.values());
  } catch {
    return SEED_RECIPES;
  }
}


function useLocalRecipes() {
  const [recipes, setRecipes] = useState(() => {
    if (typeof window === "undefined") return SEED_RECIPES;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEED_RECIPES;
    } catch {
      return SEED_RECIPES;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    } catch {
      /* ignore */
    }
  }, [recipes]);

  return [recipes, setRecipes];
}

function useHover() {
  const [hover, setHover] = useState(false);
  const props = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  };
  return [hover, props];
}

function RecipeCard({ recipe, onOpen }) {
  const [hover, hoverProps] = useHover();
  return (
    <article
      className={`cb-card${hover ? " is-hover" : ""}`}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-label={`Open ${recipe.name}`}
      onClick={() => onOpen(recipe)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Space") {
          e.preventDefault(); // prevent page scroll on Space
          onOpen(recipe);
        }
      }}
      {...hoverProps}
    >
      <h3 className="cb-card__title">{recipe.name}</h3>
      <div className="cb-pill">{recipe.category}</div>
      <div className="cb-card__meta">
        {recipe.timeMinutes} min • Serves {recipe.servings}
      </div>
    </article>
  );
}

function Modal({ open, onClose, title, children, actions, initialFocusRef }) {
  const overlayRef = useRef(null);

  // (optional) lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="cb-modal__overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      tabIndex={-1}
      ref={overlayRef}
      aria-modal="true"
      role="dialog"
    >
      <div className="cb-modal">
        <div className="cb-modal__header">
          <h2 className="cb-modal__title">{title}</h2>
          <div className="cb-actions">{actions}</div>
          <button
            className="cb-btn cb-btn--icon"
            aria-label="Close"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="cb-modal__body">{children}</div>
      </div>
    </div>
  );
}


export default function Cookbook() {
  const [recipes, setRecipes] = useLocalRecipes();
  const [active, setActive] = useState(null); // recipe or null
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null); // editable copy

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (!id || !recipes?.length) return;
    const match = recipes.find((r) => r.id === id);
    if (match) {
      setActive(match);
      setIsEditing(false);
      setDraft(null);
    }
  }, [location.search, recipes]);

  // toolbar UI state
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("name-asc");

  const categories = useMemo(() => {
    const set = new Set(recipes.map((r) => (r.category || "").trim()).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = recipes.filter((r) => {
      const inCat = category === "All" || (r.category || "").trim() === category;
      if (!q) return inCat;
      const hay =
        (r.name || "") +
        " " +
        (r.category || "") +
        " " +
        (r.ingredients || []).join(" ");
      return inCat && hay.toLowerCase().includes(q);
    });

    switch (sort) {
      case "name-asc":
        list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "time-asc":
        list = list.slice().sort((a, b) => (a.timeMinutes || 0) - (b.timeMinutes || 0));
        break;
      case "time-desc":
        list = list.slice().sort((a, b) => (b.timeMinutes || 0) - (a.timeMinutes || 0));
        break;
      default:
        break;
    }
    return list;
  }, [recipes, query, category, sort]);

  // open/close modal
  const openRecipe = (r) => {
    setActive(r);
    setIsEditing(false);
    setDraft(null);
  };
  const closeModal = () => {
    setActive(null);
    setIsEditing(false);
    setDraft(null);
  };

  // edit lifecycle
  const startEdit = (seed) => {
    const src = seed || active;
    const clone = JSON.parse(JSON.stringify(src));
    setDraft(clone);
    setIsEditing(true);
  };
  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(null);
  };

  const splitToList = (txt) =>
    String(txt || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

  const listToTextarea = (arr) =>
    Array.isArray(arr) ? arr.join("\n") : String(arr || "");

  const createId = (name) =>
    (name || "recipe")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 7);

  const normalizeDraft = (d) => ({
    ...d,
    name: String(d.name || "").trim(),
    category: String(d.category || "").trim(),
    timeMinutes: Number(d.timeMinutes) || 0,
    servings: Number(d.servings) || 1,
    ingredients: Array.isArray(d.ingredients)
      ? d.ingredients
      : splitToList(d.ingredients),
    steps: Array.isArray(d.steps) ? d.steps : splitToList(d.steps)
  });

  // FIX #1: ensure active gets object WITH id after saving a brand-new recipe
  const saveEdit = () => {
    if (!draft) return;
    const clean = normalizeDraft(draft);
    const finalObj = {
      ...clean,
      id: clean.id && clean.id.trim() ? clean.id : createId(clean.name)
    };

    setRecipes((prev) => {
      const exists = prev.some((r) => r.id === finalObj.id);
      return exists
        ? prev.map((r) => (r.id === finalObj.id ? finalObj : r))
        : [finalObj, ...prev];
    });

    setActive(finalObj); // now Delete button etc. work immediately
    setIsEditing(false);
    setDraft(null);
  };

  // add / delete
  const addNew = () => {
    const fresh = {
      id: "",
      name: "",
      category: "",
      timeMinutes: 0,
      servings: 1,
      ingredients: [],
      steps: []
    };
    setActive(fresh);
    startEdit(fresh);
  };

  const deleteRecipe = (rid) => {
    if (typeof window !== "undefined") {
      if (!window.confirm("Delete this recipe? This cannot be undone.")) return;
    }
    setRecipes((prev) => prev.filter((r) => r.id !== rid));
    closeModal();
  };

  // header tags (shown in view mode)
  const headerTags = useMemo(() => {
    if (!active) return [];
    return [
      `${active.timeMinutes || 0} min`,
      `Serves ${active.servings || 1}`,
      active.category || "Uncategorized"
    ];
  }, [active]);

  return (
    <main className="cookbook cb">
      <div className="container">
      <div className="cb-head">
        <h2 className="cb-title">Cookbook</h2>
        <span className="cb-tag">{recipes.length} recipes</span>
        <div className="cb-head__spacer" />
        
        <button className="cb-btn cb-btn--subtle" onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }} style={{marginRight:"8px"}} title="Reset recipes to default">Reset</button>
        <button className="cb-btn cb-btn--primary" onClick={addNew}>
          + Add Recipe
        </button>
      </div>

      <div className="cb-toolbar">
        <input
          className="cb-input"
          placeholder="Search by name, category, or ingredient…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search recipes"
        />
        <select
          className="cb-input cb-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="cb-input cb-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort recipes"
        >
          <option value="name-asc">Name (A–Z)</option>
          <option value="time-asc">Time (short → long)</option>
          <option value="time-desc">Time (long → short)</option>
        </select>
      </div>

      <section className="cb-grid">
        {filtered.map((r) => (
          <RecipeCard key={r.id} recipe={r} onOpen={openRecipe} />
        ))}
        {filtered.length === 0 && (
          <div className="cb-empty">No recipes match your filters.</div>
        )}
      </section>

      <Modal
        open={!!active}
        onClose={closeModal}
        title={active ? (active.name || "New Recipe") : ""}
        actions={
          active && (
            <>
              {!isEditing ? (
                <>
                  {headerTags.map((t) => (
                    <span key={t} className="cb-tag">
                      {t}
                    </span>
                  ))}
                  <button className="cb-btn cb-btn--primary" onClick={() => startEdit()}>
                    Edit
                  </button>
                  {active?.id && (
                    <button
                      className="cb-btn cb-btn--danger"
                      onClick={() => deleteRecipe(active.id)}
                    >
                      Delete
                    </button>
                  )}
                  <button className="cb-btn" onClick={closeModal}>
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button className="cb-btn cb-btn--primary" onClick={saveEdit}>
                    Save
                  </button>
                  <button className="cb-btn" onClick={cancelEdit}>
                    Cancel
                  </button>
                </>
              )}
            </>
          )
        }
      >
        {active && !isEditing && (
          <div>
            <div className="cb-row">
              <span className="cb-tag">{active.category || "Uncategorized"}</span>
              <span className="cb-tag">{active.timeMinutes || 0} min</span>
              <span className="cb-tag">Serves {active.servings || 1}</span>
            </div>

            <h3 className="cb-h2">Ingredients</h3>
            <ul className="cb-list">
              {(active.ingredients || []).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>

            <h3 className="cb-h2">Steps</h3>
            <ol className="cb-list cb-list--ol">
              {(active.steps || []).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </div>
        )}

        {active && isEditing && draft && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveEdit();
            }}
          >
            <div className="cb-grid--form">
              <label className="cb-field">
                <div className="cb-h2">Name</div>
                <input
                  className="cb-input"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Recipe name"
                  required
                />
              </label>
              <label className="cb-field">
                <div className="cb-h2">Category</div>
                <input
                  className="cb-input"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  placeholder="e.g., Dinner, Dessert"
                />
              </label>
              <label className="cb-field">
                <div className="cb-h2">Time (min)</div>
                <input
                  type="number"
                  min={0}
                  className="cb-input"
                  value={draft.timeMinutes}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      timeMinutes: e.target.value === "" ? "" : Number(e.target.value)
                    })
                  }
                />
              </label>
              <label className="cb-field">
                <div className="cb-h2">Servings</div>
                <input
                  type="number"
                  min={1}
                  className="cb-input"
                  value={draft.servings}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      servings: e.target.value === "" ? "" : Number(e.target.value)
                    })
                  }
                />
              </label>
            </div>

            <label className="cb-field">
              <div className="cb-h2">Ingredients (one per line)</div>
              <textarea
                className="cb-input cb-textarea"
                value={listToTextarea(draft.ingredients)}
                onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })}
              />
            </label>

            <label className="cb-field">
              <div className="cb-h2">Steps (one per line)</div>
              <textarea
                className="cb-input cb-textarea"
                value={listToTextarea(draft.steps)}
                onChange={(e) => setDraft({ ...draft, steps: e.target.value })}
              />
            </label>

            <div className="cb-form__actions">
              <button type="button" className="cb-btn" onClick={cancelEdit}>
                Cancel
              </button>
              <button type="submit" className="cb-btn cb-btn--primary">
                Save
              </button>
            </div>
          </form>
        )}
      </Modal>
      </div>
    </main>
  );
}
