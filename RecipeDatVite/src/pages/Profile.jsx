import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI, recipesAPI } from "../services/api";
import "./Profile.css";

export default function Profile() {
  const { user: authUser, isAuthenticated, updateProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ recipes: 0, favorites: 0 });
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    preferences: {
      dietaryRestrictions: [],
      favoriteCategories: [],
      defaultServings: 4
    }
  });

  // Load user data and stats
  useEffect(() => {
    const loadProfileData = async () => {
      if (!isAuthenticated || authLoading) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load stats
        const statsData = await authAPI.getStats();
        setStats(statsData);

        // Load favorite recipes
        try {
          const favoritesData = await recipesAPI.getFavoriteRecipes();
          setFavoriteRecipes(favoritesData.recipes || []);
        } catch (err) {
          console.warn('Failed to load favorites:', err);
        }

        // Load recent recipes (last 5)
        try {
          const recentData = await recipesAPI.getRecipes({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
          setRecentRecipes(recentData.recipes || []);
        } catch (err) {
          console.warn('Failed to load recent recipes:', err);
        }

        // Initialize edit form with current user data
        if (authUser) {
          setEditForm({
            name: authUser.name || '',
            preferences: {
              dietaryRestrictions: authUser.preferences?.dietaryRestrictions || [],
              favoriteCategories: authUser.preferences?.favoriteCategories || [],
              defaultServings: authUser.preferences?.defaultServings || 4
            }
          });
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
        setError(err.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [isAuthenticated, authLoading, authUser]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSaveProfile = async () => {
    try {
      setError(null);
      await updateProfile(editForm);
      setIsEditing(false);
      // Reload stats in case recipe count changed
      const statsData = await authAPI.getStats();
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (authUser) {
      setEditForm({
        name: authUser.name || '',
        preferences: {
          dietaryRestrictions: authUser.preferences?.dietaryRestrictions || [],
          favoriteCategories: authUser.preferences?.favoriteCategories || [],
          defaultServings: authUser.preferences?.defaultServings || 4
        }
      });
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (authLoading || loading) {
    return (
      <main className="profile">
        <section className="section">
          <div className="container">
            <p className="muted">Loading profile...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!authUser) {
    return (
      <main className="profile">
        <section className="section">
          <div className="container">
            <p className="muted">Please log in to view your profile.</p>
          </div>
        </section>
      </main>
    );
  }

  const initials = getInitials(authUser.name);
  const joinedDate = authUser.createdAt;

  return (
    <main className="profile">
      <section className="section">
        <div className="container">
          {/* Header */}
          <header className="profile-head">
            <div className="avatar-wrap" aria-hidden={!!authUser.avatar}>
              {authUser.avatar ? (
                <img className="avatar" src={authUser.avatar} alt={`${authUser.name} avatar`} />
              ) : (
                <div className="avatar avatar--fallback">{initials}</div>
              )}
            </div>

            <div className="identity">
              {isEditing ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="profile-input"
                    placeholder="Name"
                  />
                  {error && <div className="error-message" style={{ color: '#f44336', marginTop: '8px' }}>{error}</div>}
                </div>
              ) : (
                <>
                  <h1 className="h1">{authUser.name || 'User'}</h1>
                  <p className="muted">
                    {joinedDate ? `Joined ${formatDate(joinedDate)}` : 'Member'}
                  </p>
                  <p className="muted">{authUser.email}</p>
                  {authUser.preferences?.favoriteCategories && authUser.preferences.favoriteCategories.length > 0 && (
                    <p className="bio">
                      Favorite categories: {authUser.preferences.favoriteCategories.join(', ')}
                    </p>
                  )}
                  {authUser.preferences?.dietaryRestrictions && authUser.preferences.dietaryRestrictions.length > 0 && (
                    <p className="bio">
                      Dietary restrictions: {authUser.preferences.dietaryRestrictions.join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="stats">
              <div className="stat">
                <div className="stat-n">{stats.recipes}</div>
                <div className="stat-k">Recipes</div>
              </div>
              <div className="stat">
                <div className="stat-n">{stats.favorites}</div>
                <div className="stat-k">Favorites</div>
              </div>
            </div>
          </header>

          {isEditing && (
            <div className="edit-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button className="btn primary" onClick={handleSaveProfile}>
                Save Changes
              </button>
              <button className="btn" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          )}
          
          {/* Discreet Edit Profile Button */}
          {!isEditing && (
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn" 
                onClick={() => setIsEditing(true)}
                style={{ fontSize: '13px', padding: '6px 12px', height: 'auto' }}
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="section">
        <div className="container">
          <div className="profile-grid">
            {/* Favorite Recipes */}
            <article className="card">
              <div className="card-head">
                <h2 className="h2">Favorite Recipes</h2>
              </div>
              <div className="card-body">
                {favoriteRecipes.length > 0 ? (
                  <ul className="list">
                    {favoriteRecipes.map((recipe) => (
                      <li key={recipe._id} className="list-item">
                        <div>
                          <div className="list-title">{recipe.name}</div>
                          <div className="list-meta">
                            {recipe.category || 'Uncategorized'} • {recipe.timeMinutes || 0} min
                          </div>
                        </div>
                        <button
                          className="btn small"
                          onClick={() => navigate(`/cookbook?id=${recipe._id}`)}
                        >
                          View
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No favorite recipes yet. Start favoriting recipes to see them here!</p>
                )}
              </div>
            </article>

            {/* Recent Activity */}
            <article className="card">
              <div className="card-head">
                <h2 className="h2">Recent Recipes</h2>
              </div>
              <div className="card-body">
                {recentRecipes.length > 0 ? (
                  <ul className="timeline">
                    {recentRecipes.slice(0, 5).map((recipe) => (
                      <li key={recipe._id} className="timeline-item">
                        <span className="badge badge--saved">saved</span>
                        <span className="timeline-label">{recipe.name}</span>
                        <span className="timeline-when">{formatRelativeTime(recipe.createdAt || recipe.updatedAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No recent recipes. Create your first recipe to see it here!</p>
                )}
              </div>
            </article>

            {/* About / Actions */}
            <article className="card">
              <div className="card-head">
                <h2 className="h2">About RecipeDat</h2>
              </div>
              <div className="card-body">
                <p className="muted">
                  Learn more about RecipeDat and how it works. Discover how to turn your ingredients into delicious recipes with AI-powered assistance, organize your favorite recipes, and make cooking easier.
                </p>
                <div style={{ marginTop: '16px' }}>
                  <button className="btn primary" onClick={() => navigate('/about')}>
                    Learn More
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
