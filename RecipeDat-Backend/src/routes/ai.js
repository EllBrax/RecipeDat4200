import express from 'express';
import multer from 'multer';
import Recipe from '../models/Recipe.js';
import auth from '../middleware/auth.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const AI_GENERATION_TIMEOUT = 420000; // 7 minutes

const router = express.Router();

// Normalize recipe data to match Recipe schema format
function normalizeRecipeData(recipeData) {
  // Convert ingredients to schema format if they're strings
  let normalizedIngredients = recipeData.ingredients || [];
  if (normalizedIngredients.length > 0 && typeof normalizedIngredients[0] === 'string') {
    normalizedIngredients = normalizedIngredients.map((ing, index) => {
      // Try to parse ingredient string (e.g., "2 cups flour" or just "flour")
      const parts = ing.trim().match(/^(\d+(?:\.\d+)?)\s*(\w+)?\s*(.+)$/);
      if (parts) {
        return {
          name: parts[3].trim(),
          amount: parts[1],
          unit: parts[2] || '',
          notes: ''
        };
      } else {
        return {
          name: ing.trim(),
          amount: '1',
          unit: '',
          notes: ''
        };
      }
    });
  }

  // Convert steps to schema format if they're strings
  let normalizedSteps = recipeData.steps || [];
  
  // Handle empty steps array
  if (normalizedSteps.length === 0) {
    normalizedSteps = [];
  } else if (typeof normalizedSteps[0] === 'string') {
    // Convert string steps to objects
    normalizedSteps = normalizedSteps.map((step, index) => ({
      stepNumber: index + 1,
      instruction: String(step || '').trim(),
      timeMinutes: Math.ceil((recipeData.timeMinutes || 30) / normalizedSteps.length)
    })).filter(step => step.instruction.length > 0);
  } else if (typeof normalizedSteps[0] === 'object' && normalizedSteps[0] !== null) {
    // Ensure step objects have required fields
    normalizedSteps = normalizedSteps.map((step, index) => ({
      stepNumber: step.stepNumber || index + 1,
      instruction: String(step.instruction || step.step || '').trim(),
      timeMinutes: step.timeMinutes || Math.ceil((recipeData.timeMinutes || 30) / normalizedSteps.length)
    })).filter(step => step.instruction.length > 0);
  }

    // Extract description/note, but truncate if too long
    let description = recipeData.description || recipeData.note || '';
    if (description && description.length > 2000) {
      description = description.substring(0, 1997) + '...';
    }
    
    return {
      ...recipeData,
      ingredients: normalizedIngredients,
      steps: normalizedSteps,
      description: description
    };
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'recipe-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/ai/generate-recipe
// @desc    Generate recipe from image and ingredients
// @access  Private
router.post('/generate-recipe', auth, upload.single('image'), async (req, res) => {
  let imageFile = null;
  
  try {
    // Parse ingredients from FormData (it comes as JSON string)
    let ingredients = [];
    if (req.body.ingredients) {
      try {
        ingredients = typeof req.body.ingredients === 'string' 
          ? JSON.parse(req.body.ingredients) 
          : req.body.ingredients;
      } catch (parseError) {
        return res.status(400).json({ 
          message: 'Invalid ingredients format. Must be a valid JSON array.',
          errors: [{ msg: 'Ingredients must be a valid array' }]
        });
      }
    }

    // Validate ingredients
    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: [{ msg: 'Ingredients must be an array' }]
      });
    }

    // Validate each ingredient (only if ingredients array has items)
    if (ingredients.length > 0) {
      const ingredientErrors = [];
      ingredients.forEach((ing, index) => {
        if (!ing || typeof ing !== 'string' || ing.trim().length === 0) {
          ingredientErrors.push({ 
            msg: `Ingredient at index ${index} must not be empty`,
            param: `ingredients[${index}]`
          });
        }
      });

      if (ingredientErrors.length > 0) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: ingredientErrors
        });
      }
    }

    const { prompt } = req.body;
    imageFile = req.file;

    // Check if image or ingredients are provided (ingredients can be empty array if image is provided)
    if (!imageFile && (!ingredients || ingredients.length === 0)) {
      return res.status(400).json({ 
        message: 'Either an image or at least one ingredient must be provided' 
      });
    }

    // Generate recipe using AI
    let generatedRecipe;
    let aiGenerationFailed = false;
    if (imageFile) {
      // Use AI model to generate from image
      try {
        console.log('🤖 Attempting AI recipe generation...');
        generatedRecipe = await generateAIRecipe(imageFile.path, ingredients || []);
        console.log('✅ AI generation successful!', {
          title: generatedRecipe.title || generatedRecipe.name,
          stepsCount: generatedRecipe.steps?.length,
          ingredientsCount: generatedRecipe.ingredients?.length
        });
      } catch (aiError) {
        console.error('❌ AI generation failed:', aiError.message);
        console.error('❌ Error stack:', aiError.stack);
        console.error('⚠️  Falling back to mock recipe - THIS MEANS THE AI IS NOT WORKING');
        aiGenerationFailed = true;
        // Fallback to mock generation if AI fails
        generatedRecipe = await generateMockRecipe(ingredients, { path: imageFile.path }, prompt);
      }
    } else {
      console.warn('⚠️  No image provided, using mock recipe');
      aiGenerationFailed = true;
      // Fallback to mock generation if no image
      generatedRecipe = await generateMockRecipe(ingredients, null, prompt);
    }

    // Normalize recipe data to match Recipe schema
    const normalizedRecipe = normalizeRecipeData(generatedRecipe);
    
    // Debug logging
    console.log('📋 Raw recipe from AI:', JSON.stringify(generatedRecipe, null, 2));
    console.log('📋 Normalized recipe:', JSON.stringify({
      name: normalizedRecipe.name,
      ingredientsCount: normalizedRecipe.ingredients?.length,
      stepsCount: normalizedRecipe.steps?.length,
      stepsType: normalizedRecipe.steps?.[0]?.constructor?.name,
      firstStep: normalizedRecipe.steps?.[0],
      allSteps: normalizedRecipe.steps?.map(s => typeof s === 'string' ? s : s.instruction)
    }, null, 2));
    
    // Warn if using mock recipe
    if (aiGenerationFailed) {
      console.warn('⚠️  WARNING: Using mock recipe - steps will be generic. Check backend logs for AI generation errors.');
    }
    
    // Ensure all required fields are present and valid
    if (!normalizedRecipe.name || normalizedRecipe.name.trim().length === 0) {
      throw new Error('Recipe name is required');
    }
    if (!normalizedRecipe.category) {
      normalizedRecipe.category = 'Other';
    }
    if (!normalizedRecipe.timeMinutes || typeof normalizedRecipe.timeMinutes !== 'number') {
      normalizedRecipe.timeMinutes = 30;
    }
    if (!normalizedRecipe.servings || typeof normalizedRecipe.servings !== 'number') {
      normalizedRecipe.servings = 4;
    }
    if (!normalizedRecipe.ingredients || normalizedRecipe.ingredients.length === 0) {
      throw new Error('Recipe must have at least one ingredient');
    }
    if (!normalizedRecipe.steps || normalizedRecipe.steps.length === 0) {
      // Add fallback steps if none were extracted
      console.warn('⚠️  No steps found in recipe, adding generic fallback steps');
      console.warn('⚠️  This suggests the AI did not generate steps or parsing failed');
      normalizedRecipe.steps = [
        {
          stepNumber: 1,
          instruction: 'Prepare the ingredients',
          timeMinutes: 5
        },
        {
          stepNumber: 2,
          instruction: 'Follow the cooking method',
          timeMinutes: 10
        },
        {
          stepNumber: 3,
          instruction: 'Season to taste',
          timeMinutes: 2
        },
        {
          stepNumber: 4,
          instruction: 'Cook until done',
          timeMinutes: 10
        },
        {
          stepNumber: 5,
          instruction: 'Serve and enjoy',
          timeMinutes: 3
        }
      ];
    }
    
    // Ensure all ingredient amounts are strings (as required by schema)
    normalizedRecipe.ingredients = normalizedRecipe.ingredients.map(ing => ({
      ...ing,
      amount: String(ing.amount || '1'),
      name: String(ing.name || 'Ingredient').trim(),
      unit: String(ing.unit || '').trim(),
      notes: String(ing.notes || '').trim()
    }));
    
    // Save the generated recipe to database (in recents by default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 1 week
    
    const recipe = new Recipe({
      ...normalizedRecipe,
      user: req.userId,
      isGenerated: true,
      isInRecents: true, // Start in recents
      isInCookbook: false,
      expiresAt: expiresAt,
      generatedFrom: {
        imageUrl: imageFile ? `/uploads/${imageFile.filename}` : null,
        ingredients: ingredients || [],
        prompt: prompt || 'Generate recipe from ingredients'
      }
    });

    console.log('Attempting to save recipe to database...');
    await recipe.save();
    console.log('Recipe saved successfully with ID:', recipe._id);

    const responseData = {
      message: 'Recipe generated successfully',
      recipe: recipe.toObject ? recipe.toObject() : recipe,
      isMockGeneration: aiGenerationFailed // Flag to indicate if mock generation was used
    };
    
    console.log('Sending response with recipe:', {
      recipeId: responseData.recipe._id,
      recipeName: responseData.recipe.name,
      stepsCount: responseData.recipe.steps?.length,
      ingredientsCount: responseData.recipe.ingredients?.length,
      isMockGeneration: aiGenerationFailed
    });

    res.json(responseData);
  } catch (error) {
    console.error('Generate recipe error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Log validation errors in detail
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      })));
    }
    
    // Provide more detailed error information
    let errorMessage = 'Server error during recipe generation';
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      errorMessage = `Validation error: ${validationErrors.join(', ')}`;
      console.error('Validation error details:', validationErrors);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// AI recipe generation using DeepSeek VL 1.3B Chat model
async function generateAIRecipe(imagePath, ingredients) {
  try {
    const pythonScript = path.join(projectRoot, 'generate_recipe.py');
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScript)) {
      throw new Error('Python AI script not found');
    }
    
    // Prepare ingredients JSON
    const ingredientsJson = JSON.stringify(ingredients);
    
    // Build command
    const command = `python "${pythonScript}" --image "${imagePath}" --ingredients '${ingredientsJson}'`;
    
    console.log('Running AI generation...');
    
    // Execute Python script with timeout
    const timeout = AI_GENERATION_TIMEOUT;
    const { stdout, stderr } = await Promise.race([
      execAsync(command, {
        cwd: projectRoot,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI generation timed out after 7 minutes')), timeout)
      )
    ]);
    
    // Log stderr for debugging
    if (stderr) {
      console.log('AI Model stderr:', stderr);
    }
    
    // Log stdout for debugging (first 500 chars)
    console.log('AI Model stdout (first 500 chars):', stdout.substring(0, 500));
    
    // Parse JSON output
    let result;
    try {
      result = JSON.parse(stdout);
    } catch (parseError) {
      console.error('Failed to parse Python output as JSON:', parseError);
      console.error('Raw stdout:', stdout);
      throw new Error(`Failed to parse AI output: ${parseError.message}`);
    }
    
    // Handle error from Python script
    if (result.error) {
      console.error('Python script returned error:', result.error);
      throw new Error(result.error);
    }
    
    console.log('Python script returned recipe:', {
      title: result.title || result.name,
      ingredientsCount: result.ingredients?.length,
      stepsCount: result.steps?.length
    });
    
    // Convert to expected format
    const category = result.category || 'Other';
    const validCategories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage', 'Appetizer', 'Side', 'Other'];
    const validCategory = validCategories.includes(category) ? category : 'Other';
    
    return {
      name: result.title || result.name || 'AI-Generated Recipe',
      title: result.title || result.name || 'AI-Generated Recipe',
      description: result.note || result.description || '',
      category: validCategory,
      timeMinutes: parseInt(result.timeMinutes) || 30,
      servings: parseInt(result.servings) || 4,
      difficulty: result.difficulty || 'Medium',
      ingredients: result.ingredients || [],
      steps: result.steps || [],
      tags: result.tags || ['ai-generated'],
      imageUrl: `/uploads/${path.basename(imagePath)}`,
      isPublic: false
    };
  } catch (error) {
    throw new Error(`Python script error: ${error.message}`);
  }
}

// Mock AI recipe generation function
async function generateMockRecipe(ingredients, imageFile, prompt) {
  // Simulate AI processing time (reduced for faster response)
  await new Promise(resolve => setTimeout(resolve, 1000));

  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Other'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  
  const category = categories[Math.floor(Math.random() * categories.length)];
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  
  // Generate recipe name based on ingredients
  const ingredientArray = Array.isArray(ingredients) ? ingredients : [];
  const mainIngredient = ingredientArray.length > 0 && ingredientArray[0] 
    ? ingredientArray[0].toString().toLowerCase() 
    : 'ingredient';
  const recipeName = `AI-Generated ${mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1)} Recipe`;

  // Generate cooking time based on difficulty
  const timeMinutes = difficulty === 'Easy' ? 
    Math.floor(Math.random() * 30) + 15 : 
    difficulty === 'Medium' ? 
    Math.floor(Math.random() * 60) + 30 : 
    Math.floor(Math.random() * 90) + 60;

  // Generate servings
  const servings = Math.floor(Math.random() * 6) + 2;

  // Generate mock ingredients with amounts - ensure we have at least one ingredient
  const mockIngredients = ingredientArray.length > 0 
    ? ingredientArray.map(ingredient => ({
        name: ingredient.toString().trim() || 'Ingredient',
        amount: String(Math.floor(Math.random() * 3) + 1),
        unit: ['cups', 'tbsp', 'tsp', 'pieces', 'oz'][Math.floor(Math.random() * 5)],
        notes: Math.random() > 0.7 ? 'Optional' : ''
      }))
    : [{
        name: 'Sample ingredient',
        amount: '1',
        unit: 'cup',
        notes: ''
      }];

  // Generate mock cooking steps
  const stepTemplates = [
    'Prepare and wash all ingredients',
    'Heat a large pan over medium heat',
    'Add oil and sauté aromatics until fragrant',
    'Add main ingredients and season with salt and pepper',
    'Cook until ingredients are tender',
    'Taste and adjust seasoning',
    'Serve hot and enjoy'
  ];

  const steps = stepTemplates.slice(0, Math.floor(Math.random() * 4) + 3).map((template, index) => ({
    stepNumber: index + 1,
    instruction: template,
    timeMinutes: Math.floor(Math.random() * 10) + 5
  }));

  // Return ingredients and steps in the format expected by Recipe schema
  const ingredientList = ingredientArray.length > 0 
    ? ingredientArray.join(', ') 
    : 'available ingredients';
  
  return {
    name: recipeName,
    title: recipeName,
    description: `An AI-generated recipe using ${ingredientList}`,
    category: category || 'Other', // Ensure category is always valid
    timeMinutes: timeMinutes || 30, // Ensure timeMinutes is always a number
    servings: servings || 4, // Ensure servings is always a number
    difficulty: difficulty || 'Easy',
    ingredients: mockIngredients, // Already in correct format: {name, amount, unit, notes}
    steps: steps, // Already in correct format: {stepNumber, instruction, timeMinutes}
    tags: [category.toLowerCase(), difficulty.toLowerCase(), 'ai-generated'],
    imageUrl: imageFile ? `/uploads/${imageFile.filename}` : null,
    isPublic: false
  };
}

// @route   GET /api/ai/suggestions
// @desc    Get ingredient suggestions
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    // Mock ingredient suggestions
    const suggestions = [
      'chicken breast', 'onion', 'garlic', 'tomatoes', 'pasta',
      'rice', 'potatoes', 'carrots', 'bell peppers', 'mushrooms',
      'spinach', 'cheese', 'eggs', 'milk', 'butter', 'olive oil',
      'salt', 'pepper', 'basil', 'oregano', 'thyme'
    ];

    res.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

