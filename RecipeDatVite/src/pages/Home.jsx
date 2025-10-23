import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";   // ← add
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  // Wire these to your router/data later
  const goToProfile = () => {};
  const goToTheKitchen = () => navigate("/thekitchen");
  const openRecipe = (id) => navigate(`/cookbook?id=${id}`);

   // --- NEW: read the most recently generated recipes from Cookbook ---
  const STORAGE_KEY = "recipedat.cookbook.v2";
  const recipes = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      
      // Sort by most recent (assuming recipes have savedAt or createdAt timestamps)
      const sortedRecipes = arr.sort((a, b) => {
        const aTime = new Date(a.savedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.savedAt || b.createdAt || 0).getTime();
        return bTime - aTime; // Most recent first
      });
      
      // Show maximum of 8 most recently generated recipes
      return sortedRecipes.slice(0, 8);
    } catch {
      return [];
    }
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    // TODO: trigger search with `query` and `activeCat`
  };

  const categories = ["All", "Breakfast", "Lunch", "Dinner", "Vegetarian", "Dessert", "Drinks"];

  return (
    <main className="home" role="main">
      <div className="container">
        {/* Page intro / search */}
        <section className="section pad-y">
          <h1 className="h1">Find your next recipe</h1>
          <p className="lead">Search by ingredient, tag, or title. Filter by category.</p>

          <form className="search-row" onSubmit={onSearch} role="search" aria-label="Recipe search">
            <input
              type="search"
              inputMode="search"
              placeholder="e.g., chicken, pasta, #weeknight"
              aria-label="Search recipes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn primary" type="submit">Search</button>
          </form>

          <div className="chip-row" role="tablist" aria-label="Categories">
            {categories.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={activeCat === c}
                className={`chip ${activeCat === c ? "chip-active" : ""}`}
                onClick={() => setActiveCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Featured banner (web-wide) */}
        <section className="section">
          <div className="feature" role="banner" aria-label="Featured collection">
            <div className="feature-body">
              <h2 className="h2">Quick Dinners Under 30 Minutes</h2>
              <p className="muted">Hand-picked recipes you can make tonight.</p>
              <button className="btn secondary" onClick={() => {/* route to discover */}}>
                Explore Featured
              </button>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="h2">Your Recent Recipes</h2>
          <p className="muted">Your most recently generated and saved recipes</p>
        </section>

        <div className="grid" aria-label="Most recent recipes">
    {recipes.map((r) => (
      <article
        key={r.id}
        className="card"
        tabIndex={0}
        onClick={() => openRecipe(r.id)}
        onKeyDown={(e) => (e.key === "Enter" ? openRecipe(r.id) : null)}
        aria-label={`Open ${r.name}`}
        role="button"
      >
        <div className="card-media" aria-hidden="true" />
        <div className="card-body">
          <h3 className="card-title">{r.name}</h3>
          <p className="card-meta">
            {(r.timeMinutes ?? 0)} min • {(r.ingredients?.length ?? 0)} ingredients • {r.category || "Uncategorized"}
          </p>
          <div className="tag-row">
            <span className="tag">#{(r.category || "recipe").toLowerCase()}</span>
          </div>
        </div>
      </article>
    ))}
  </div>

        {/* Footer */}
        <footer className="site-footer">
          <div className="footer-inner">
            <small className="muted">© {new Date().getFullYear()} RecipeDat</small>
          </div>
        </footer>
      </div>
    </main>
  );
}
