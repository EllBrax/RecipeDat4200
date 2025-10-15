import React, { useState, useEffect } from "react";

export default function Cookbook() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Load saved recipes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("savedRecipes");
    if (saved) {
      setRecipes(JSON.parse(saved));
    }
  }, []);

  // Delete a recipe
  const handleDelete = (id) => {
    const updated = recipes.filter((r) => r.id !== id);
    setRecipes(updated);
    localStorage.setItem("savedRecipes", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 text-gray-800 p-6">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-bold text-orange-700 mb-2">
          Your Cookbook
        </h1>
        <p className="text-gray-600">
          Browse your saved recipes. You can view them offline or delete ones
          you no longer need.
        </p>
      </header>

      {/* Recipes Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition duration-200 cursor-pointer"
              onClick={() => setSelectedRecipe(recipe)}
            >
              {recipe.image && (
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="h-48 w-full object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold text-orange-600 mb-1">
                  {recipe.title}
                </h2>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {recipe.description || "A delicious recipe made from your pantry ingredients."}
                </p>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {recipe.ingredients?.length || 0} ingredients
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(recipe.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-10">
            No recipes saved yet. Create some on the Recipe page!
          </div>
        )}
      </div>

      {/* Modal for Recipe Detail */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setSelectedRecipe(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            {selectedRecipe.image && (
              <img
                src={selectedRecipe.image}
                alt={selectedRecipe.title}
                className="rounded-xl mb-4 object-cover w-full h-56"
              />
            )}
            <h2 className="text-2xl font-bold text-orange-700 mb-2">
              {selectedRecipe.title}
            </h2>
            <p className="text-gray-700 mb-4">{selectedRecipe.description}</p>
            <h3 className="font-semibold text-gray-800 mb-2">Ingredients:</h3>
            <ul className="list-disc list-inside mb-4 text-gray-600">
              {selectedRecipe.ingredients?.map((ing, idx) => (
                <li key={idx}>{ing}</li>
              ))}
            </ul>
            {selectedRecipe.instructions && (
              <>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Instructions:
                </h3>
                <p className="text-gray-600 whitespace-pre-line">
                  {selectedRecipe.instructions}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}