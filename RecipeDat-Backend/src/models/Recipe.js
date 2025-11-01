import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Recipe name is required'],
    trim: true,
    maxlength: [100, 'Recipe name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage', 'Appetizer', 'Side', 'Other']
  },
  timeMinutes: {
    type: Number,
    required: [true, 'Cooking time is required'],
    min: [1, 'Cooking time must be at least 1 minute'],
    max: [1440, 'Cooking time cannot exceed 24 hours']
  },
  servings: {
    type: Number,
    required: [true, 'Servings is required'],
    min: [1, 'Servings must be at least 1'],
    max: [50, 'Servings cannot exceed 50']
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy'
  },
  ingredients: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: String,
      required: true,
      trim: true
    },
    unit: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  steps: [{
    stepNumber: {
      type: Number,
      required: true
    },
    instruction: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Step instruction cannot exceed 1000 characters']
    },
    timeMinutes: {
      type: Number,
      min: 0
    },
    temperature: {
      type: String,
      trim: true
    }
  }],
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number
  },
  tags: [String],
  imageUrl: {
    type: String,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isGenerated: {
    type: Boolean,
    default: false
  },
  generatedFrom: {
    imageUrl: String,
    ingredients: [String],
    prompt: String
  },
  isInCookbook: {
    type: Boolean,
    default: false
  },
  isInRecents: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for search functionality
recipeSchema.index({ name: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ category: 1 });
recipeSchema.index({ user: 1 });
recipeSchema.index({ isPublic: 1 });

// Virtual for total cooking time
recipeSchema.virtual('totalTimeMinutes').get(function() {
  return this.steps.reduce((total, step) => total + (step.timeMinutes || 0), 0);
});

// Method to add to favorites
recipeSchema.methods.addToFavorites = function(userId) {
  if (!this.favorites.includes(userId)) {
    this.favorites.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove from favorites
recipeSchema.methods.removeFromFavorites = function(userId) {
  this.favorites = this.favorites.filter(id => !id.equals(userId));
  return this.save();
};

export default mongoose.model('Recipe', recipeSchema);

