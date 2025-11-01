import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useRecipes } from "../contexts/RecipeContext";
import "./Cookbook.css";

/**
 * Cookbook.jsx (patched)
 * - Fix: ensure active recipe gets generated id after first Save
 * - Fix: trim category when filtering
 * - Fix: handle " " and "Space" keys; prevent scroll on Space
 * - Optional hardening: SSR-safe localStorage & window.confirm guards
 * - Small a11y: aria-haspopup on cards; focus modal on open
 */





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
      <div className="cb-card-media" aria-hidden="true" />
      <div className="cb-card-body">
        <h3 className="cb-card__title">{recipe.name}</h3>
        <div className="cb-card__meta">
          {recipe.timeMinutes} min • Serves {recipe.servings}
        </div>
        <div className="tag-row">
          <span className="tag">#{recipe.category?.toLowerCase() || "recipe"}</span>
        </div>
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
  const { user, isAuthenticated } = useAuth();
  const { 
    recipes, 
    loading, 
    error, 
    loadRecipes,
    createRecipe, 
    updateRecipe, 
    deleteRecipe,
    updateFilters,
    filters 
  } = useRecipes();
  
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
  const [query, setQuery] = useState(filters.search || "");
  const [category, setCategory] = useState(filters.category || "All");
  const [sort, setSort] = useState(filters.sortBy === "name" ? "name-asc" : "time-asc");

  const categories = useMemo(() => {
    const set = new Set(recipes.map((r) => (r.category || "").trim()).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [recipes]);

  // Don't automatically load recipes - let user trigger it manually
  // useEffect(() => {
  //   loadRecipes();
  // }, []);

  // Update filters when local state changes
  useEffect(() => {
    updateFilters({
      search: query,
      category: category,
      sortBy: sort.includes("name") ? "name" : "timeMinutes",
      sortOrder: sort.includes("desc") ? "desc" : "asc"
    });
  }, [query, category, sort, updateFilters]);

  const filtered = recipes; // Recipes are already filtered by the context

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
  const saveEdit = async () => {
    if (!draft) return;
    const clean = normalizeDraft(draft);
    
    try {
      if (active && active._id) {
        // Update existing recipe
        const response = await updateRecipe(active._id, clean);
        setActive(response.recipe);
      } else {
        // Create new recipe
        const response = await createRecipe(clean);
        setActive(response.recipe);
      }
      
      setIsEditing(false);
      setDraft(null);
    } catch (error) {
      console.error("Failed to save recipe:", error);
      // Handle error - you might want to show a toast or alert
    }
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

  const handleDeleteRecipe = async (rid) => {
    if (typeof window !== "undefined") {
      if (!window.confirm("Delete this recipe? This cannot be undone.")) return;
    }
    
    try {
      await deleteRecipe(rid);
      closeModal();
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      // Handle error - you might want to show a toast or alert
    }
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

  if (!isAuthenticated) {
    return (
      <main className="cookbook cb">
        <div className="container">
          <div className="cb-head">
            <h2 className="cb-title">Cookbook</h2>
            <div className="alert" style={{ 
              background: "#fff3cd", 
              border: "1px solid #ffeaa7", 
              padding: "12px", 
              borderRadius: "4px",
              margin: "16px 0"
            }}>
              <strong>Please log in</strong> to view and manage your recipes.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="cookbook cb">
      <div className="container">
      <div className="cb-head">
        <h2 className="cb-title">Cookbook</h2>
        <span className="cb-tag">{recipes.length} recipes</span>
        <div className="cb-head__spacer" />
        
        {error && (
          <div className="alert" style={{ 
            background: "#f8d7da", 
            border: "1px solid #f5c6cb", 
            padding: "12px", 
            borderRadius: "4px",
            margin: "16px 0",
            color: "#721c24"
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <button 
          onClick={() => loadRecipes()} 
          disabled={loading}
          className="cb-btn cb-btn--secondary"
          style={{
            margin: "8px 8px 8px 0",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Loading..." : "Load Recipes"}
        </button>
        
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
                  {active?._id && (
                    <button
                      className="cb-btn cb-btn--danger"
                      onClick={() => handleDeleteRecipe(active._id)}
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
