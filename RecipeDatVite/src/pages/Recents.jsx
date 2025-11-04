import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { recipesAPI } from "../services/api";
import "./Cookbook.css";

function useHover() {
  const [hover, setHover] = useState(false);
  const props = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  };
  return [hover, props];
}

function RecipeCard({ recipe, onOpen, onDelete }) {
  const [hover, hoverProps] = useHover();
  
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent opening the recipe modal
    if (window.confirm(`Delete "${recipe.name}"? This cannot be undone.`)) {
      onDelete(recipe._id);
    }
  };
  
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
          e.preventDefault();
          onOpen(recipe);
        }
      }}
      {...hoverProps}
      style={{ position: "relative" }}
    >
      <div className="cb-card-media" aria-hidden="true" />
      <div className="cb-card-body">
        <h3 className="cb-card__title">{recipe.name}</h3>
        <div className="cb-card__meta">
          {recipe.timeMinutes} min • Serves {recipe.servings}
        </div>
        <div className="tag-row">
          <span className="tag">#{recipe.category?.toLowerCase() || "recipe"}</span>
          {recipe.tags && recipe.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="tag">#{tag}</span>
          ))}
        </div>
      </div>
      <button
        className="cb-btn cb-btn--icon"
        onClick={handleDeleteClick}
        aria-label={`Delete ${recipe.name}`}
        title="Delete recipe"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          backgroundColor: "rgba(220, 53, 69, 0.9)",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "4px 8px",
          fontSize: "12px",
          cursor: "pointer",
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.9)";
        }}
      >
        ✕
      </button>
    </article>
  );
}

function Modal({ open, onClose, title, children, actions }) {
  const overlayRef = useRef(null);

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

export default function Recents() {
  const { user, isAuthenticated } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);

  const loadRecents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recipesAPI.getRecentRecipes();
      setRecipes(response.recipes);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadRecents();
    }
  }, [isAuthenticated]);

  const openRecipe = (r) => {
    setActive(r);
  };

  const closeModal = () => {
    setActive(null);
  };

  const handleSaveToCookbook = async (id) => {
    try {
      await recipesAPI.saveToCookbook(id);
      await loadRecents(); // Reload to remove saved recipe
      closeModal();
    } catch (error) {
      console.error("Failed to save recipe:", error);
      setError("Failed to save recipe. Please try again.");
    }
  };

  const handleDeleteRecipe = async (id) => {
    if (!window.confirm("Delete this recipe? This cannot be undone.")) {
      return;
    }
    
    try {
      await recipesAPI.deleteRecipe(id);
      await loadRecents(); // Reload to remove deleted recipe
      closeModal();
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      setError("Failed to delete recipe. Please try again.");
    }
  };

  const headerTags = active ? [
    `${active.timeMinutes || 0} min`,
    `Serves ${active.servings || 1}`,
    active.category || "Uncategorized"
  ] : [];

  if (!isAuthenticated) {
    return (
      <main className="cookbook cb">
        <div className="container">
          <div className="cb-head">
            <h2 className="cb-title">Recent Recipes</h2>
            <div className="alert" style={{ 
              background: "#fff3cd", 
              border: "1px solid #ffeaa7", 
              padding: "12px", 
              borderRadius: "4px",
              margin: "16px 0"
            }}>
              <strong>Please log in</strong> to view your recent recipes.
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
          <h2 className="cb-title">Recent Recipes</h2>
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
            onClick={() => loadRecents()} 
            disabled={loading}
            className="cb-btn cb-btn--secondary"
            style={{
              margin: "8px 8px 8px 0",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div style={{ 
          margin: "16px 0", 
          padding: "12px", 
          background: "var(--cb-elevated, rgba(255, 255, 255, 0.05))",
          border: "1px solid var(--cb-border, rgba(255, 255, 255, 0.1))",
          borderRadius: "4px",
          color: "var(--cb-text, inherit)"
        }}>
          <p style={{ margin: 0 }}>
            <strong>Note:</strong> These recipes expire in 7 days and will be automatically removed. 
            Save recipes you want to keep to your cookbook.
          </p>
        </div>

        <section className="cb-grid">
          {recipes.map((r) => (
            <RecipeCard 
              key={r._id || r.id} 
              recipe={r} 
              onOpen={openRecipe}
              onDelete={handleDeleteRecipe}
            />
          ))}
          {recipes.length === 0 && !loading && (
            <div className="cb-empty">No recent recipes. Generate some in The Kitchen!</div>
          )}
        </section>

        <Modal
          open={!!active}
          onClose={closeModal}
          title={active ? active.name : ""}
          actions={
            active && (
              <>
                {headerTags.map((t) => (
                  <span key={t} className="cb-tag">
                    {t}
                  </span>
                ))}
                <button 
                  className="cb-btn cb-btn--primary" 
                  onClick={() => handleSaveToCookbook(active._id)}
                >
                  Save to Cookbook
                </button>
                <button 
                  className="cb-btn cb-btn--danger" 
                  onClick={() => handleDeleteRecipe(active._id)}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none"
                  }}
                >
                  Delete
                </button>
                <button className="cb-btn" onClick={closeModal}>
                  Close
                </button>
              </>
            )
          }
        >
          {active && (
            <div>
              <div className="cb-row">
                <span className="cb-tag">{active.category || "Uncategorized"}</span>
                <span className="cb-tag">{active.timeMinutes || 0} min</span>
                <span className="cb-tag">Serves {active.servings || 1}</span>
              </div>

              <h3 className="cb-h2">Ingredients</h3>
              <ul className="cb-list">
                {(active.ingredients || []).map((ing, i) => (
                  <li key={i}>
                    {typeof ing === 'string' ? ing : `${ing.amount} ${ing.unit} ${ing.name}`}
                  </li>
                ))}
              </ul>

              <h3 className="cb-h2">Steps</h3>
              <ol className="cb-list cb-list--ol">
                {(active.steps || []).map((step, i) => (
                  <li key={i}>
                    {typeof step === 'string' ? step : step.instruction}
                  </li>
                ))}
              </ol>

              {active.tags && active.tags.length > 0 && (
                <>
                  <h3 className="cb-h2">Tags</h3>
                  <div className="tag-row">
                    {active.tags.map((tag, i) => (
                      <span key={i} className="tag">#{tag}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
    </main>
  );
}
