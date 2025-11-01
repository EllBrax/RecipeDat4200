import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
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

const router = express.Router();

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
router.post('/generate-recipe', auth, upload.single('image'), [
  body('ingredients').isArray({ min: 0 }).withMessage('Ingredients must be an array'),
  body('ingredients.*').trim().isLength({ min: 1 }).withMessage('Each ingredient must not be empty')
], async (req, res) => {
  let imageFile = null;
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { ingredients, prompt } = req.body;
    imageFile = req.file;

    // Check if image or ingredients are provided
    if (!imageFile && (!ingredients || ingredients.length === 0)) {
      return res.status(400).json({ 
        message: 'Either an image or ingredients must be provided' 
      });
    }

    // Generate recipe using AI
    let generatedRecipe;
    if (imageFile) {
      // Use AI model to generate from image
      generatedRecipe = await generateAIRecipe(imageFile.path, ingredients || []);
    } else {
      // Fallback to mock generation if no image
      generatedRecipe = await generateMockRecipe(ingredients, null, prompt);
    }

    // Save the generated recipe to database (in recents by default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 1 week
    
    const recipe = new Recipe({
      ...generatedRecipe,
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

    await recipe.save();

    res.json({
      message: 'Recipe generated successfully',
      recipe
    });
  } catch (error) {
    console.error('Generate recipe error:', error);
    res.status(500).json({ message: 'Server error during recipe generation', error: error.message });
  }
});

// AI recipe generation using Hugging Face Qwen2.5-VL-3B-Instruct model
async function generateAIRecipe(imagePath, ingredients) {
  try {
    const pythonScript = path.join(projectRoot, 'generate_recipe.py');
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScript)) {
      console.warn('Python AI script not found, falling back to mock generation');
      return await generateMockRecipe(ingredients, { path: imagePath }, null);
    }
    
    // Prepare ingredients JSON
    const ingredientsJson = JSON.stringify(ingredients);
    
    // Build command
    const command = `python "${pythonScript}" --image "${imagePath}" --ingredients '${ingredientsJson}'`;
    
    console.log('Running AI generation:', command);
    
    // Execute Python script
    const { stdout, stderr } = await execAsync(command, {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
    });
    
    // Log stderr for debugging
    if (stderr) {
      console.log('AI Model stderr:', stderr);
    }
    
    // Parse JSON output
    const result = JSON.parse(stdout);
    
    // Handle error from Python script
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Convert to expected format for frontend display
    // Frontend expects arrays of strings for ingredients and steps
    return {
      name: result.title || 'AI-Generated Recipe',
      title: result.title || 'AI-Generated Recipe',
      note: result.note || '',
      category: result.category || 'Dinner',
      timeMinutes: result.timeMinutes || 30,
      servings: result.servings || 4,
      difficulty: result.difficulty || 'Medium',
      ingredients: result.ingredients || [],
      steps: result.steps || [],
      tags: result.tags || ['ai-generated'],
      imageUrl: `/uploads/${path.basename(imagePath)}`,
      isPublic: false
    };
    
  } catch (error) {
    console.error('AI generation failed:', error);
    // Fallback to mock generation
    console.log('Falling back to mock generation');
    return await generateMockRecipe(ingredients, { path: imagePath }, null);
  }
}

// Mock AI recipe generation function
async function generateMockRecipe(ingredients, imageFile, prompt) {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  
  const category = categories[Math.floor(Math.random() * categories.length)];
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  
  // Generate recipe name based on ingredients
  const mainIngredient = ingredients[0]?.toLowerCase() || 'ingredient';
  const recipeName = `AI-Generated ${mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1)} Recipe`;

  // Generate cooking time based on difficulty
  const timeMinutes = difficulty === 'Easy' ? 
    Math.floor(Math.random() * 30) + 15 : 
    difficulty === 'Medium' ? 
    Math.floor(Math.random() * 60) + 30 : 
    Math.floor(Math.random() * 90) + 60;

  // Generate servings
  const servings = Math.floor(Math.random() * 6) + 2;

  // Generate mock ingredients with amounts
  const mockIngredients = ingredients.map(ingredient => ({
    name: ingredient,
    amount: Math.floor(Math.random() * 3) + 1,
    unit: ['cups', 'tbsp', 'tsp', 'pieces', 'oz'][Math.floor(Math.random() * 5)],
    notes: Math.random() > 0.7 ? 'Optional' : ''
  }));

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

  // Convert to strings for display
  const ingredientStrings = mockIngredients.map(ing => 
    `${ing.amount} ${ing.unit} ${ing.name}${ing.notes ? ` (${ing.notes})` : ''}`
  );
  const stepStrings = steps.map(step => step.instruction);
  
  return {
    name: recipeName,
    title: recipeName,
    note: `An AI-generated recipe using ${ingredients.join(', ')}`,
    category,
    timeMinutes,
    servings,
    difficulty,
    ingredients: ingredientStrings,
    steps: stepStrings,
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

