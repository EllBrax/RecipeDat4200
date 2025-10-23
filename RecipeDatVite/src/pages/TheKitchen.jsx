// src/pages/TheKitchen.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TheKitchen.css";
import kitchenBg from "../assets/kitchen-bg.jpg"; // default background

export default function TheKitchen() {
  const navigate = useNavigate();

  // Input state
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");

  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [result, setResult] = useState(null);

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
    setIsSubmitting(true);

    // ===== INTEGRATE YOUR AI MODEL HERE =====
    // const form = new FormData();
    // if (imageFile) form.append("image", imageFile);
    // form.append("ingredients", ingredientsText);
    // const response = await fetch("<your-endpoint>", { method: "POST", body: form });
    // const data = await response.json();
    // setResult(data);

    // TEMP: demo result until AI is integrated
    const fake = {
      title: "AI-Generated Weeknight Pasta",
      ingredients: ingredientsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      steps: [
        "Boil water and salt generously.",
        "Sauté aromatics; add your main ingredient(s).",
        "Fold in cooked pasta; adjust with starchy water.",
        "Season to taste and serve warm.",
      ],
      note:
        "Replace this with the model’s real output once integrated with your endpoint.",
      imageUrl,
    };

    setTimeout(() => {
      setResult(fake);
      setIsSubmitting(false);
    }, 300);
  };

  const saveToCookbook = () => {
    try {
      const key = "cookbook";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const entry = {
        id: Date.now(),
        ...result,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify([entry, ...existing]));
    } catch {
      // no-op
    }
    navigate("/cookbook");
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
                    {isSubmitting ? "Generating..." : "Generate Recipe"}
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
