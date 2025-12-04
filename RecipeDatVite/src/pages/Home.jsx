import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";   // ← add
import { useRecipes } from "../contexts/RecipeContext";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { recipes, loadRecipes, loading } = useRecipes();

  // Wire these to your router/data later
  const goToProfile = () => {};
  const goToTheKitchen = () => navigate("/thekitchen");
  const openRecipe = (id) => navigate(`/cookbook?id=${id}`);

  // Don't automatically load recipes - let user trigger it manually
  // useEffect(() => {
  //   loadRecipes();
  // }, []);

  // Get the most recent recipes (first 8)
  const recentRecipes = useMemo(() => {
    return recipes.slice(0, 8);
  }, [recipes]);

  return (
    <main className="home" role="main">
      <div className="container">
        {/* Welcome section */}
        <section className="section pad-y">
          <h1 className="h1">Welcome to RecipeDat</h1>
          <p className="lead">
            Your personal recipe assistant powered by AI. Transform ingredients into delicious meals, 
            organize your favorite recipes, and discover new culinary adventures.
          </p>
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
          
          <button 
            onClick={() => loadRecipes()} 
            disabled={loading}
            className="btn secondary"
            style={{
              margin: "8px 0",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Loading..." : "Load Recipes"}
          </button>
        </section>

        <div className="grid" aria-label="Most recent recipes">
    {recentRecipes.map((r) => (
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
