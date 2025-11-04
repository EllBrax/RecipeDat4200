// API Service Layer for RecipeDat Frontend
const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token in localStorage
const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Helper function to remove auth token from localStorage
const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Login user
  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Get current user
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Logout user
  logout: () => {
    removeAuthToken();
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
  },

  // Get user statistics
  getStats: async () => {
    return await apiRequest('/auth/stats');
  },
};

// Recipes API
export const recipesAPI = {
  // Get all recipes for current user
  getRecipes: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/recipes?${queryString}` : '/recipes';
    return await apiRequest(endpoint);
  },

  // Get single recipe by ID
  getRecipe: async (id) => {
    return await apiRequest(`/recipes/${id}`);
  },

  // Create new recipe
  createRecipe: async (recipeData) => {
    return await apiRequest('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipeData),
    });
  },

  // Update recipe
  updateRecipe: async (id, recipeData) => {
    return await apiRequest(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipeData),
    });
  },

  // Delete recipe
  deleteRecipe: async (id) => {
    return await apiRequest(`/recipes/${id}`, {
      method: 'DELETE',
    });
  },

  // Add recipe to favorites
  addToFavorites: async (id) => {
    return await apiRequest(`/recipes/${id}/favorite`, {
      method: 'POST',
    });
  },

  // Remove recipe from favorites
  removeFromFavorites: async (id) => {
    return await apiRequest(`/recipes/${id}/favorite`, {
      method: 'DELETE',
    });
  },

  // Get recent recipes (not in cookbook)
  getRecentRecipes: async () => {
    return await apiRequest('/recipes/recents/list');
  },

  // Save recipe to cookbook
  saveToCookbook: async (id) => {
    return await apiRequest(`/recipes/${id}/save-to-cookbook`, {
      method: 'POST',
    });
  },

  // Get favorite recipes
  getFavoriteRecipes: async () => {
    return await apiRequest('/recipes/favorites');
  },
};

// AI API
export const aiAPI = {
  // Generate recipe from image and ingredients
  generateRecipe: async (formData) => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/ai/generate-recipe`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('AI API error response:', data);
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Get ingredient suggestions
  getSuggestions: async () => {
    return await apiRequest('/ai/suggestions');
  },
};

// Health check API
export const healthAPI = {
  // Check if backend is running
  checkHealth: async () => {
    return await apiRequest('/health');
  },
};

// Export all APIs as a single object
export default {
  auth: authAPI,
  recipes: recipesAPI,
  ai: aiAPI,
  health: healthAPI,
};

