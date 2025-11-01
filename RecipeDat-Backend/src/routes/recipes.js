import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Recipe from '../models/Recipe.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/recipes
// @desc    Get user's recipes with filtering and pagination
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('sortBy').optional().isIn(['name', 'createdAt', 'timeMinutes', 'rating']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query - only show cookbook recipes
    const query = { 
      user: req.userId,
      $or: [
        { isInCookbook: true },
        { isInCookbook: { $exists: false } } // Backward compatibility
      ]
    };
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const recipes = await Recipe.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email');

    const total = await Recipe.countDocuments(query);

    res.json({
      recipes,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recipes/:id
// @desc    Get single recipe
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ 
      _id: req.params.id, 
      user: req.userId 
    }).populate('user', 'name email');

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/recipes
// @desc    Create new recipe
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Recipe name is required'),
  body('category').isIn(['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage', 'Appetizer', 'Side', 'Other']),
  body('timeMinutes').isInt({ min: 1, max: 1440 }),
  body('servings').isInt({ min: 1, max: 50 }),
  body('ingredients').isArray({ min: 1 }),
  body('steps').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const recipeData = {
      ...req.body,
      user: req.userId
    };

    const recipe = new Recipe(recipeData);
    await recipe.save();

    res.status(201).json({
      message: 'Recipe created successfully',
      recipe
    });
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/recipes/:id
// @desc    Update recipe
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('category').optional().isIn(['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage', 'Appetizer', 'Side', 'Other']),
  body('timeMinutes').optional().isInt({ min: 1, max: 1440 }),
  body('servings').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json({
      message: 'Recipe updated successfully',
      recipe
    });
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/recipes/:id
// @desc    Delete recipe
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.userId 
    });

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/recipes/:id/favorite
// @desc    Add recipe to favorites
// @access  Private
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    await recipe.addToFavorites(req.userId);
    res.json({ message: 'Recipe added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/recipes/:id/favorite
// @desc    Remove recipe from favorites
// @access  Private
router.delete('/:id/favorite', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    await recipe.removeFromFavorites(req.userId);
    res.json({ message: 'Recipe removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recipes/recents/list
// @desc    Get recent recipes (not in cookbook)
// @access  Private
router.get('/recents/list', auth, async (req, res) => {
  try {
    const recipes = await Recipe.find({
      user: req.userId,
      isInRecents: true,
      isInCookbook: false,
      expiresAt: { $gt: new Date() } // Only get non-expired
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    res.json({
      recipes,
      count: recipes.length
    });
  } catch (error) {
    console.error('Get recent recipes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/recipes/:id/save-to-cookbook
// @desc    Move recipe from recents to cookbook
// @access  Private
router.post('/:id/save-to-cookbook', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    recipe.isInCookbook = true;
    recipe.isInRecents = false;
    recipe.expiresAt = null; // Remove expiration when saved to cookbook
    await recipe.save();

    res.json({
      message: 'Recipe saved to cookbook',
      recipe
    });
  } catch (error) {
    console.error('Save to cookbook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/recipes/clean-expired
// @desc    Clean up expired recent recipes
// @access  Private (admin or system)
router.post('/clean-expired', auth, async (req, res) => {
  try {
    const result = await Recipe.deleteMany({
      isInRecents: true,
      isInCookbook: false,
      expiresAt: { $lt: new Date() }
    });

    res.json({
      message: 'Expired recipes cleaned up',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clean expired error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

