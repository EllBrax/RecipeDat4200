import React, { createContext, useContext, useState, useCallback } from 'react';
import { recipesAPI } from '../services/api';

const RecipeContext = createContext();

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};

export const RecipeProvider = ({ children }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Load recipes with current filters
  const loadRecipes = useCallback(async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const currentFilters = { ...filters, ...customFilters };
      const response = await recipesAPI.getRecipes(currentFilters);
      setRecipes(response.recipes);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [filters]);


  const createRecipe = async (recipeData) => {
    try {
      setError(null);
      const response = await recipesAPI.createRecipe(recipeData);
      setRecipes(prev => [response.recipe, ...prev]);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateRecipe = async (id, recipeData) => {
    try {
      setError(null);
      const response = await recipesAPI.updateRecipe(id, recipeData);
      setRecipes(prev => 
        prev.map(recipe => 
          recipe._id === id ? response.recipe : recipe
        )
      );
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const deleteRecipe = async (id) => {
    try {
      setError(null);
      await recipesAPI.deleteRecipe(id);
      setRecipes(prev => prev.filter(recipe => recipe._id !== id));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const addToFavorites = async (id) => {
    try {
      setError(null);
      await recipesAPI.addToFavorites(id);
      setRecipes(prev => 
        prev.map(recipe => 
          recipe._id === id 
            ? { ...recipe, favorites: [...(recipe.favorites || []), 'current-user'] }
            : recipe
        )
      );
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const removeFromFavorites = async (id) => {
    try {
      setError(null);
      await recipesAPI.removeFromFavorites(id);
      setRecipes(prev => 
        prev.map(recipe => 
          recipe._id === id 
            ? { ...recipe, favorites: (recipe.favorites || []).filter(id => id !== 'current-user') }
            : recipe
        )
      );
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Don't automatically reload - let components handle it manually
  }, []);

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const value = {
    recipes,
    loading,
    error,
    filters,
    loadRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    addToFavorites,
    removeFromFavorites,
    updateFilters,
    clearFilters,
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};
