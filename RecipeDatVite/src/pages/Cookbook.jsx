import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Cookbook.jsx — clickable cards -> modal with details -> edit & delete.
 */

// ===== Seeded recipes =====
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
      "1 cup all‑purpose flour",
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
      "Cook 1/4‑cup scoops on greased skillet until bubbles set; flip.",
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
  }
];

// ===== Styles =====
const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16
  },
  card: {
    background: "var(--surface, #27292b)",
    color: "var(--text, #f3f4f6)",
    border: "1px solid var(--border, #3a3c3f)",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 6px 18px rgba(0,0,0,.25)",
    cursor: "pointer",
    transition: "transform .12s ease, box-shadow .12s ease"
  },
  cardHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 10px 28px rgba(0,0,0,.35)"
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    background: "var(--elevated, #2d2f31)",
    borderRadius: 999,
    fontSize: 12,
    color: "var(--muted, #cbd5e1)",
    marginTop: 8
  },
  // Title
  titleWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
    textAlign: "center"
  },
  titleText: { fontSize: 28, fontWeight: 800, letterSpacing: 0.2, margin: 0 },
  cook: { color: "var(--brand-blue, #1b3a8a)" },
  book: { color: "var(--brand-gold, #d4af37)" },
  countTag: { background: "var(--elevated, #2d2f31)", borderRadius: 10, padding: "6px 10px", fontSize: 11, color: "var(--muted, #cbd5e1)" },
  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50
  },
  modal: {
    width: "min(880px, 96vw)",
    maxHeight: "85vh",
    overflow: "auto",
    background: "var(--surface, #27292b)",
    color: "var(--text, #f3f4f6)",
    border: "1px solid var(--border, #3a3c3f)",
    borderRadius: 16,
    boxShadow: "0 18px 60px rgba(0,0,0,.45)",
    padding: 20
  },
  h1: { fontSize: 20, margin: 0 },
  h2: { fontSize: 14, margin: "12px 0 6px", color: "var(--muted, #cbd5e1)" },
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  tag: { background: "var(--elevated, #2d2f31)", borderRadius: 10, padding: "6px 10px", fontSize: 12, color: "var(--muted, #cbd5e1)" },
  actions: { display: "flex", gap: 10, marginLeft: "auto" },
  btn: {
    border: "1px solid var(--border, #3a3c3f)",
    background: "var(--elevated, #2d2f31)",
    color: "var(--text, #f3f4f6)",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    transition: "background .12s ease, color .12s ease, border-color .12s ease"
  },
  btnPrimary: {
    border: "1px solid var(--brand, #60a5fa)",
    background: "var(--brand, #60a5fa)",
    color: "var(--brand-ink, #0b1220)"
  },
  btnDanger: {
    border: "1px solid #7f1d1d",
    background: "#3b0d0d",
    color: "#fca5a5"
  },
  btnDangerHover: {
    border: "1px solid #ef4444",
    background: "#b91c1c",
    color: "#fff"
  },
  input: {
    width: "100%",
    background: "#1f2021",
    color: "var(--text, #f3f4f6)",
    border: "1px solid var(--border, #3a3c3f)",
    borderRadius: 10,
    padding: 10
  },
  textarea: { minHeight: 110, whiteSpace: "pre-wrap" },
  sectionBlock: { textAlign: "left", marginTop: 8, marginBottom: 16 },
  list: { paddingLeft: 20, marginTop: 6, marginBottom: 14 },
  divider: { height: 1, background: "var(--border, #3a3c3f)", margin: "10px 0 16px" }
};

// ===== Small helpers =====
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
      role="button"
      tabIndex={0}
      aria-label={`Open ${recipe.name}`}
      onClick={() => onOpen(recipe)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(recipe)}
      style={{ ...styles.card, ...(hover ? styles.cardHover : null) }}
      {...hoverProps}
    >
      <h3 style={{ margin: 0, fontSize: 18 }}>{recipe.name}</h3>
      <div style={styles.pill}>{recipe.category}</div>
      <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted, #cbd5e1)" }}>
        {recipe.timeMinutes} min • Serves {recipe.servings}
      </div>
    </article>
  );
}

function Modal({ open, onClose, children, title, actions }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      ref={overlayRef}
      style={styles.modalOverlay}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={styles.h1}>{title}</h1>
          <div style={styles.actions}>{actions}</div>
        </header>
        <div style={{ height: 12 }} />
        {children}
      </div>
    </div>
  );
}

function ModalActions({ active, isEditing, headerTags, startEdit, closeModal, requestDelete }) {
  const [hoverDel, setHoverDel] = useState(false);
  if (!active) return null;
  return (
    <>
      {!isEditing ? (
        <>
          {headerTags.map((t) => (
            <span key={t} style={styles.tag}>{t}</span>
          ))}
          <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={startEdit}>
            Edit
          </button>
          <button
            style={{ ...styles.btn, ...(hoverDel ? styles.btnDangerHover : styles.btnDanger) }}
            onMouseEnter={() => setHoverDel(true)}
            onMouseLeave={() => setHoverDel(false)}
            onClick={requestDelete}
          >
            Delete
          </button>
          <button style={styles.btn} onClick={closeModal}>Close</button>
        </>
      ) : (
        <>
          <button style={{ ...styles.btn, ...styles.btnPrimary }} disabled>Editing…</button>
          <button style={styles.btn} onClick={closeModal}>Close</button>
        </>
      )}
    </>
  );
}

export default function Cookbook() {
  const [recipes, setRecipes] = useState(SEED_RECIPES);
  const [active, setActive] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);

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

  const startEdit = () => {
    const clone = JSON.parse(JSON.stringify(active));
    setDraft(clone);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(null);
  };

  const splitToList = (txt) => {
    const s = String(txt || "");
    return s
      .replaceAll("", "")
      .split("")
      .map((x) => x.trim())
      .filter(Boolean);
  };

  const listToTextarea = (arr) =>
    Array.isArray(arr) ? arr.join("\n") : String(arr || "");

  const normalizeDraft = (d) => ({
    ...d,
    timeMinutes: Number(d.timeMinutes) || 0,
    servings: Number(d.servings) || 1,
    ingredients: Array.isArray(d.ingredients) ? d.ingredients : splitToList(d.ingredients),
    steps: Array.isArray(d.steps) ? d.steps : splitToList(d.steps),
  });

  const headerTags = useMemo(() => {
    if (!active) return [];
    return [
      `${active.timeMinutes} min`,
      `Serves ${active.servings}`,
      active.category
    ];
  }, [active]);

  return (
    <div>
      {/* Title */}
      <div style={styles.titleWrap}>
        <h2 style={styles.titleText}>
          <span style={styles.cook}>Cook</span>
          <span style={styles.book}>Book</span>
        </h2>
        <span style={styles.countTag}>{recipes.length} recipes</span>
      </div>

      {/* Cards grid */}
      <section style={styles.grid}>
        {recipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} onOpen={openRecipe} />
        ))}
      </section>

      {/* Modal */}
      <Modal
        open={!!active}
        onClose={closeModal}
        title={active ? active.name : ""}
        actions={
          active && (
            <ModalActions
              active={active}
              isEditing={isEditing}
              headerTags={headerTags}
              startEdit={startEdit}
              closeModal={closeModal}
              requestDelete={() => {
                if (!active) return;
                const ok = window.confirm(`Delete "${active.name}"? This cannot be undone.`);
                if (ok) {
                  setRecipes((prev) => prev.filter((r) => r.id !== active.id));
                  closeModal();
                }
              }}
            />
          )
        }
      >
        {active && !isEditing && (
          <div style={{ textAlign: "left" }}>
            <div style={styles.row}>
              <span style={styles.tag}>{active.category}</span>
              <span style={styles.tag}>{active.timeMinutes} min</span>
              <span style={styles.tag}>Serves {active.servings}</span>
            </div>

            <div style={styles.divider} />

            <section style={styles.sectionBlock}>
              <h3 style={styles.h2}>Ingredients</h3>
              <ul style={styles.list}>
                {active.ingredients.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>

            <section style={styles.sectionBlock}>
              <h3 style={styles.h2}>Steps</h3>
              <ol style={styles.list}>
                {active.steps.map((line, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{line}</li>
                ))}
              </ol>
            </section>
          </div>
        )}

        {active && isEditing && draft && (
          <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} style={{ textAlign: "left" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <div style={styles.h2}>Name</div>
                <input
                  style={styles.input}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Recipe name"
                  required
                />
              </label>
              <label>
                <div style={styles.h2}>Category</div>
                <input
                  style={styles.input}
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  placeholder="e.g., Dinner, Dessert"
                />
              </label>
              <label>
                <div style={styles.h2}>Time (min)</div>
                <input
                  type="number"
                  min={0}
                  style={styles.input}
                  value={draft.timeMinutes}
                  onChange={(e) => setDraft({ ...draft, timeMinutes: e.target.value })}
                />
              </label>
              <label>
                <div style={styles.h2}>Servings</div>
                <input
                  type="number"
                  min={1}
                  style={styles.input}
                  value={draft.servings}
                  onChange={(e) => setDraft({ ...draft, servings: e.target.value })}
                />
              </label>
            </div>

            <div style={{ height: 10 }} />

            <label>
              <div style={styles.h2}>Ingredients (one per line)</div>
              <textarea
                style={{ ...styles.input, ...styles.textarea }}
                value={listToTextarea(draft.ingredients)}
                onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })}
              />
            </label>

            <label>
              <div style={styles.h2}>Steps (one per line)</div>
              <textarea
                style={{ ...styles.input, ...styles.textarea }}
                value={listToTextarea(draft.steps)}
                onChange={(e) => setDraft({ ...draft, steps: e.target.value })}
              />
            </label>

            <div style={{ height: 14 }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" style={styles.btn} onClick={cancelEdit}>Cancel</button>
              <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
