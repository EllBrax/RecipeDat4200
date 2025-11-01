// src/pages/TheKitchen.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useRecipes } from "../contexts/RecipeContext";
import { aiAPI, recipesAPI } from "../services/api";
import "./TheKitchen.css";
import kitchenBg from "../assets/kitchen-bg.jpg"; // default background

export default function TheKitchen() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { createRecipe } = useRecipes();

  // Input state
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");

  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImageUrl(URL.createObjectURL(f));
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImageUrl(URL.createObjectURL(f));
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeImage = () => {
    if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    setImageFile(null);
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError("Please log in to generate recipes");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare form data for AI API
      const formData = new FormData();
      if (imageFile) {
        formData.append("image", imageFile);
      }
      
      const ingredients = ingredientsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      
      formData.append("ingredients", JSON.stringify(ingredients));
      
      if (ingredientsText.trim()) {
        formData.append("prompt", `Generate a recipe using these ingredients: ${ingredients.join(", ")}`);
      }

      // Call AI API
      const response = await aiAPI.generateRecipe(formData);
      setResult(response.recipe);
    } catch (error) {
      console.error("Recipe generation failed:", error);
      setError(error.message || "Failed to generate recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveToCookbook = async () => {
    try {
      if (!result) return;
      
      // Recipe is already saved to recents by AI endpoint
      // Just move it to cookbook
      if (result._id) {
        await recipesAPI.saveToCookbook(result._id);
        navigate("/cookbook");
      } else {
        // Fallback for older flow
        const recipeData = {
          name: result.title || result.name,
          description: result.note || "AI-generated recipe",
          category: result.category || "Other",
          timeMinutes: result.timeMinutes || 30,
          servings: result.servings || 4,
          difficulty: result.difficulty || "Easy",
          ingredients: result.ingredients.map(ingredient => ({
            name: ingredient,
            amount: "1",
            unit: "item",
            notes: ""
          })),
          steps: result.steps.map((step, index) => ({
            stepNumber: index + 1,
            instruction: step,
            timeMinutes: Math.ceil((result.timeMinutes || 30) / result.steps.length)
          })),
          tags: result.tags || ["ai-generated"],
          imageUrl: result.imageUrl,
          isGenerated: true,
          isPublic: false
        };
        await createRecipe(recipeData);
        navigate("/cookbook");
      }
    } catch (error) {
      console.error("Failed to save recipe:", error);
      setError("Failed to save recipe. Please try again.");
    }
  };

  const skipToRecents = () => {
    // Recipe is already saved to recents, just navigate
    navigate("/recents");
  };

  const backToKitchen = () => {
    setResult(null);
    setIsSubmitting(false);
  };

  // Fallback scrim: use theme var if present; otherwise a default
  const scrim =
    getComputedStyle(document.documentElement).getPropertyValue("--scrim")?.trim() ||
    "linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,.55))";

  return (
    <main className="kitchen">
      <section className="kitchen-hero" style={{ position: "relative", minHeight: "100vh" }}>
        {/* Background image layer (full-bleed, no repeat, blurred) */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${imageUrl || kitchenBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(4px) saturate(1.05) brightness(0.95)",
            transform: "scale(1.02)",
            willChange: "transform, filter",
          }}
        />
        {/* Theme scrim overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1,
            background: scrim,
          }}
        />

        {/* Real content on top */}
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <header className="kitchen-head">
            <h1 className="h1">The Kitchen</h1>
            <p className="muted">
              Drop in an image and list your ingredients. Your AI sous-chef will draft a recipe.
            </p>
            {!isAuthenticated && (
              <div className="alert" style={{ 
                background: "#fff3cd", 
                border: "1px solid #ffeaa7", 
                padding: "12px", 
                borderRadius: "4px",
                margin: "16px 0"
              }}>
                <strong>Please log in</strong> to generate AI recipes and save them to your cookbook.
              </div>
            )}
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
          </header>

          {/* OUTPUT VIEW */}
          {result ? (
            <section className="result" aria-live="polite">
              <article className="recipe card">
                <div className="recipe-head">
                  <h2 className="h2">{result.title}</h2>
                  {result.imageUrl ? (
                    <img
                      className="recipe-image"
                      src={result.imageUrl}
                      alt="Selected or generated dish preview"
                      loading="lazy"
                    />
                  ) : null}
                </div>

                <div className="recipe-body">
                  <div>
                    <h3>Ingredients</h3>
                    <ul>
                      {result.ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Steps</h3>
                    <ol>
                      {result.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  {result.note && <p className="muted">{result.note}</p>}
                </div>

                <div className="actions">
                  <button className="btn primary" onClick={saveToCookbook}>
                    Save to Cookbook
                  </button>
                  <button className="btn secondary" onClick={skipToRecents}>
                    Skip (Save to Recents)
                  </button>
                  <button className="btn ghost" onClick={backToKitchen}>
                    Back to The Kitchen
                  </button>
                </div>
              </article>
            </section>
          ) : (
            // INPUT VIEW
            <form
              className="workbench card"
              onSubmit={handleSubmit}
              aria-busy={isSubmitting ? "true" : "false"}
            >
              <div
                className={`dropzone ${isDragging ? "dragging" : ""} ${imageUrl ? "has-image" : ""}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={!imageUrl ? onPickFile : undefined}
                role="button"
                aria-label="Add an image by clicking or dragging a file here"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (!imageUrl && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onPickFile();
                  }
                }}
              >
                {!imageUrl ? (
                  <div className="dropzone-inner">
                    <div className="icon" aria-hidden="true">📷</div>
                    <p className="dz-title">Drop an image here</p>
                    <p className="dz-sub">or click to choose a file</p>
                  </div>
                ) : (
                  <div className="preview-wrap">
                    <img className="preview" src={imageUrl} alt="Selected preview" />
                    <button
                      type="button"
                      className="btn ghost preview-remove"
                      onClick={removeImage}
                      aria-label="Remove selected image"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  hidden
                />
              </div>

              <div className="ingredients">
                <label htmlFor="ingredients" className="label">
                  Ingredients (one per line)
                </label>
                <textarea
                  id="ingredients"
                  placeholder={"e.g.\n2 cups pasta\n1 tbsp olive oil\n1 clove garlic"}
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                />
                <div className="actions">
                  <button
                    className="btn primary"
                    type="submit"
                    disabled={isSubmitting || (!imageFile && !ingredientsText.trim())}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="flip-pan">🍳</span> Generating...
                      </>
                    ) : "Generate Recipe"}
                  </button>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => {
                      setIngredientsText("");
                      removeImage();
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
