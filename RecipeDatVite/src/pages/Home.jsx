import React, { useState } from "react";
import { useNavigate } from "react-router-dom";   // ← add
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  // Wire these to your router/data later
  const goToProfile = () => {};
  const goToTheKitchen = () => navigate("/thekitchen");
  const openRecipe = (id) => {};

  const onSearch = (e) => {
    e.preventDefault();
    // TODO: trigger search with `query` and `activeCat`
  };

  const categories = ["All", "Breakfast", "Lunch", "Dinner", "Vegetarian", "Dessert", "Drinks"];

  return (
    <main className="home" role="main">
      {/* Page intro / search */}
      <section className="section pad-y">
        <div className="container">
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
        </div>
      </section>

      {/* Featured banner (web-wide) */}
      <section className="section">
        <div className="container">
          <div className="feature" role="banner" aria-label="Featured collection">
            <div className="feature-body">
              <h2 className="h2">Quick Dinners Under 30 Minutes</h2>
              <p className="muted">Hand-picked recipes you can make tonight.</p>
              <button className="btn secondary" onClick={() => {/* route to discover */}}>
                Explore Featured
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results grid */}
      <section className="section pad-b">
        <div className="container">
          <div className="grid" aria-label="Recipe results">
            {[1, 2, 3, 4, 5, 6].map((id) => (
              <article key={id} className="card" tabIndex={0} onClick={() => openRecipe(id)} onKeyDown={(e) => (e.key === "Enter" ? openRecipe(id) : null)}>
                <div className="card-media" aria-hidden="true" />
                <div className="card-body">
                  <h3 className="card-title">Sample Recipe {id}</h3>
                  <p className="card-meta">25 min • 6 ingredients • Easy</p>
                  <div className="tag-row">
                    <span className="tag">#weeknight</span>
                    <span className="tag">#quick</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <small className="muted">© {new Date().getFullYear()} RecipeDat</small>
        </div>
      </footer>
    </main>
  );
}
