import React from "react";
import "./Profile.css";

export default function Profile() {
  // ---- Mock user data (looks real but is entirely fictitious) ----
  const user = {
    id: "u_9482a3",
    fullName: "Avery Johnson",
    username: "avery.j",
    email: "avery.johnson@example.com",
    location: "Baton Rouge, LA",
    joined: "2024-03-18",
    bio:
      "Home cook & weekend food photographer. I love one-pot comfort meals, fresh breads, and quick weeknight dinners.",
    avatarUrl: "", // leave empty to use initials fallback
    stats: {
      recipes: 18,
      favorites: 42,
      followers: 127,
      following: 86,
    },
    favorites: [
      { id: "r1", name: "Garlic Butter Shrimp", category: "Seafood", timeMinutes: 20 },
      { id: "r5", name: "Blueberry Buttermilk Pancakes", category: "Breakfast", timeMinutes: 20 },
      { id: "r3", name: "Vegetable Stir-Fry", category: "Vegetarian", timeMinutes: 15 },
    ],
    recentActivity: [
      { type: "saved", label: "Hearty Lentil Soup", when: "2 days ago" },
      { type: "edited", label: "One-Pot Chicken Alfredo", when: "4 days ago" },
      { type: "favorited", label: "Classic Beef Tacos", when: "1 week ago" },
    ],
  };

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="profile">
      <section className="section">
        <div className="container">
          {/* Header */}
          <header className="profile-head">
            <div className="avatar-wrap" aria-hidden={!!user.avatarUrl}>
              {user.avatarUrl ? (
                <img className="avatar" src={user.avatarUrl} alt={`${user.fullName} avatar`} />
              ) : (
                <div className="avatar avatar--fallback">{initials}</div>
              )}
            </div>

            <div className="identity">
              <h1 className="h1">{user.fullName}</h1>
              <p className="muted">@{user.username} • Joined {new Date(user.joined).toLocaleDateString()}</p>
              <p className="muted">{user.location} • {user.email}</p>
              <p className="bio">{user.bio}</p>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="stat-n">{user.stats.recipes}</div>
                <div className="stat-k">Recipes</div>
              </div>
              <div className="stat">
                <div className="stat-n">{user.stats.favorites}</div>
                <div className="stat-k">Favorites</div>
              </div>
            </div>
          </header>
        </div>
      </section>

      {/* Body */}
      <section className="section">
        <div className="container">
          <div className="profile-grid">
            {/* Favorites */}
            <article className="card">
              <div className="card-head">
                <h2 className="h2">Favorite Recipes</h2>
              </div>
              <div className="card-body">
                <ul className="list">
                  {user.favorites.map((f) => (
                    <li key={f.id} className="list-item">
                      <div>
                        <div className="list-title">{f.name}</div>
                        <div className="list-meta">{f.category} • {f.timeMinutes} min</div>
                      </div>
                      <a className="btn small" href={`/cookbook?id=${f.id}`}>View</a>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            {/* Recent activity */}
            <article className="card">
              <div className="card-head">
                <h2 className="h2">Recent Activity</h2>
              </div>
              <div className="card-body">
                <ul className="timeline">
                  {user.recentActivity.map((a, i) => (
                    <li key={i} className="timeline-item">
                      <span className={`badge badge--${a.type}`}>{a.type}</span>
                      <span className="timeline-label">{a.label}</span>
                      <span className="timeline-when">{a.when}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            {/* About / Contact */}
            <article className="card">
              <div className="card-head">
                <h2 className="h2">About</h2>
              </div>
              <div className="card-body">
                <p className="muted">
                  This is a mock profile for demo purposes. Replace this data with your real user model later,
                  and wire actions (edit profile, change avatar, etc.) to your backend.
                </p>
                <div className="gap-8">
                  <a className="btn primary" href="/cookbook">View Cookbook</a>
                  <a className="btn" href="/thekitchen">Go to The Kitchen</a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
