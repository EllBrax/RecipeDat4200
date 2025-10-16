// src/pages/About.jsx
import { Link } from "react-router-dom";
import "./About.css";

export default function About() {
  return (
    <div className="about">
      <header className="about__hero">
        <h1>About RecipeDat</h1>
        <p className="about__tagline">
          Build, organize, and cook. RecipeDat turns your ingredients into
          ready-to-cook recipes and keeps everything in one tidy cookbook.
        </p>

        <div className="about__cta">
          {/* Dark pill by default; on hover both buttons invert to white bg + blue text */}
          <Link to="/thekitchen" className="btn btn--primary">Try The Kitchen</Link>
          <Link to="/cookbook" className="btn">View Cookbook</Link>
        </div>
      </header>

      <section className="about__grid">
        <article className="card">
          <h3>Snap Pantry → Recipe</h3>
          <p>
            Upload a photo of ingredients and let the AI detect what’s there.
            We’ll suggest recipes you can cook right now.
          </p>
        </article>

        <article className="card">
          <h3>Type It In</h3>
          <p>
            Prefer manual? Enter ingredients line-by-line. We validate the list
            before generating a recipe so you don’t waste time.
          </p>
        </article>

        <article className="card">
          <h3>Save &amp; Organize</h3>
          <p>
            Keep your favorites in the <strong>Cookbook</strong>, organize by
            tags, and come back anytime.
          </p>
        </article>

        <article className="card">
          <h3>User Control</h3>
          <p>
            Edit ingredients, regenerate, or reject suggestions. Allergies or
            preferences? We surface options and alternatives.
          </p>
        </article>
      </section>

      <section className="about__how">
        <h2>How it works</h2>
        <ol className="steps">
          <li>Go to <strong>The Kitchen</strong>.</li>
          <li>Drop a photo <em>or</em> type your ingredients.</li>
          <li>Sit tight while <strong>RecipeDat</strong> works its magic to identify your ingredients.</li>
          <li>Review the detected list, and make edits if needed.</li>
          <li>Generate a recipe and save it to your <strong>Cookbook.</strong></li>
        </ol>
      </section>

      <section className="about__ai">
        <h2>Things To Note</h2>
        <ul>
          <li><strong>While It Thinks:</strong> You'll get a quick loading animation while we analyze your input. We'll keep you updated on the progress of your recipe!</li>
          <li><strong>Something Gone Wrong?:</strong> We'll inform you of the error and suggest a next step so you can get back to cooking!</li>
          <li><strong>Photo Time!:</strong> Got a blurry pic? Might need a retake! We aren't so confident in what we see? We'll need you to review and confirm please!</li>
          <li><strong>Possible allergies?</strong> We'll be sure to flag it right away and suggest alternatives as well!</li>
        </ul>
      </section>
    </div>
  );
}
