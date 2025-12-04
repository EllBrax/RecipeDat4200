# RecipeDat - Complete User Manual & Technical Reference

**Version:** 1.0.0  
**Last Updated:** 2024  
**Documentation Type:** User Manual & Technical Reference

---

## Table of Contents

1. [Introduction](#introduction)
2. [Technical Reference & Architecture Overview](#technical-reference--architecture-overview)
3. [User Manual](#user-manual)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Deployment Guide](#deployment-guide)
7. [Troubleshooting](#troubleshooting)
8. [Appendix](#appendix)

---

## Introduction

RecipeDat is a modern, AI-powered recipe management application that allows users to create, organize, and discover recipes. The application features intelligent recipe generation from images and ingredient lists using advanced vision-language AI models.

### Key Features

- **User Authentication**: Secure JWT-based authentication system
- **Recipe Management**: Full CRUD operations for recipes
- **AI Recipe Generation**: Generate recipes from food images using Qwen2-VL vision-language model
- **Cookbook Management**: Organize and save your favorite recipes
- **Recent Recipes**: Temporary storage for AI-generated recipes (7-day expiration)
- **Search & Filter**: Advanced search and filtering capabilities
- **Favorites System**: Mark and organize favorite recipes
- **Image Upload**: Support for recipe images

---

## Technical Reference & Architecture Overview

### System Architecture

RecipeDat follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  React + Vite (Port 5173)                               │
│  - React Router for navigation                          │
│  - Context API for state management                     │
│  - Framer Motion for animations                        │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│                    Backend Layer                         │
│  Node.js + Express (Port 3001)                          │
│  - RESTful API endpoints                                │
│  - JWT authentication middleware                        │
│  - File upload handling (Multer)                       │
│  - Request validation (express-validator)               │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    Data & AI Layer                       │
│  MongoDB (MongoDB Atlas)                                │
│  Python AI Service (Qwen2-VL Model)                     │
│  - Recipe storage                                       │
│  - User management                                      │
│  - AI recipe generation                                 │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router DOM 7.9.4
- **Animations**: Framer Motion 12.23.24
- **Styling**: CSS with CSS Variables for theming

#### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB with Mongoose 8.0.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Security**: Helmet, CORS, express-rate-limit
- **File Upload**: Multer 2.0.2
- **Validation**: express-validator 7.3.0

#### AI Service
- **Language**: Python 3.8+
- **Model**: Qwen2-VL-2B-Instruct (Hugging Face)
- **Framework**: PyTorch, Transformers
- **Image Processing**: PIL (Pillow)

### Project Structure

```
RecipeDat4200-1/
├── RecipeDat-Backend/          # Backend API Server
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authentication middleware
│   │   ├── models/
│   │   │   ├── User.js         # User database model
│   │   │   └── Recipe.js       # Recipe database model
│   │   └── routes/
│   │       ├── auth.js         # Authentication routes
│   │       ├── recipes.js      # Recipe CRUD routes
│   │       └── ai.js           # AI generation routes
│   ├── uploads/                # Uploaded recipe images
│   ├── server.js               # Main server entry point
│   ├── generate_recipe.py      # Python AI service
│   ├── package.json
│   └── requirements.txt        # Python dependencies
│
└── RecipeDatVite/              # Frontend React Application
    ├── src/
    │   ├── components/         # Reusable React components
    │   │   ├── NavBar/
    │   │   ├── ThemeToggle/
    │   │   └── ErrorBoundary.jsx
    │   ├── contexts/           # React Context providers
    │   │   ├── AuthContext.jsx
    │   │   └── RecipeContext.jsx
    │   ├── pages/              # Page components
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Cookbook.jsx
    │   │   ├── Recents.jsx
    │   │   ├── TheKitchen.jsx
    │   │   └── Profile.jsx
    │   ├── routes/
    │   │   └── Routes.jsx      # Route configuration
    │   ├── services/
    │   │   └── api.js          # API service layer
    │   ├── layouts/
    │   │   └── RootLayout.jsx
    │   └── main.jsx            # Application entry point
    └── package.json
```

### Authentication Flow

```
1. User Registration/Login
   ↓
2. Backend validates credentials
   ↓
3. JWT token generated (expires in 7 days)
   ↓
4. Token stored in localStorage (frontend)
   ↓
5. Token sent in Authorization header for protected routes
   ↓
6. Middleware validates token on each request
```

### AI Recipe Generation Flow

```
1. User uploads image + ingredients (optional)
   ↓
2. Frontend sends FormData to /api/ai/generate-recipe
   ↓
3. Backend saves image to uploads/ directory
   ↓
4. Backend spawns Python process with generate_recipe.py
   ↓
5. Python script loads Qwen2-VL model (cached after first load)
   ↓
6. Model processes image and generates recipe JSON
   ↓
7. Backend normalizes recipe data to match schema
   ↓
8. Recipe saved to MongoDB (isInRecents: true, expiresAt: +7 days)
   ↓
9. Recipe returned to frontend
   ↓
10. User can save to cookbook or keep in recents
```

### Security Features

1. **Helmet.js**: Sets security HTTP headers
2. **CORS**: Configurable cross-origin resource sharing
3. **Rate Limiting**: 1000 requests per 15 minutes per IP
4. **Password Hashing**: bcryptjs with salt rounds of 12
5. **JWT Tokens**: Secure token-based authentication
6. **Input Validation**: express-validator for all user inputs
7. **File Upload Validation**: Only image files accepted, 5MB max size

### Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recipedat
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Database Models

#### User Model
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, validated),
  password: String (required, min 6 chars, hashed),
  avatar: String (optional),
  preferences: {
    dietaryRestrictions: [String],
    favoriteCategories: [String],
    defaultServings: Number (default: 4)
  },
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Recipe Model
```javascript
{
  name: String (required, max 100 chars),
  description: String (max 2000 chars),
  category: String (enum: Breakfast, Lunch, Dinner, Dessert, Snack, Beverage, Appetizer, Side, Other),
  timeMinutes: Number (required, 1-1440),
  servings: Number (required, 1-50),
  difficulty: String (enum: Easy, Medium, Hard),
  ingredients: [{
    name: String,
    amount: String,
    unit: String,
    notes: String
  }],
  steps: [{
    stepNumber: Number,
    instruction: String (max 1000 chars),
    timeMinutes: Number,
    temperature: String
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
  imageUrl: String,
  isPublic: Boolean (default: false),
  isGenerated: Boolean (default: false),
  isInCookbook: Boolean (default: false),
  isInRecents: Boolean (default: false),
  expiresAt: Date (for recents, 7 days),
  user: ObjectId (ref: User),
  favorites: [ObjectId] (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

See [API Reference](#api-reference) section for detailed endpoint documentation.

---

## User Manual

### Getting Started

#### Prerequisites

Before using RecipeDat, ensure you have:
- A modern web browser (Chrome, Firefox, Safari, Edge)
- An active internet connection
- JavaScript enabled in your browser

#### Accessing the Application

1. Open your web browser
2. Navigate to the RecipeDat application URL (e.g., `http://localhost:5173`)
3. You will be redirected to the login page if not authenticated

### Account Management

#### Creating an Account

1. Click on the **"Register"** or **"Sign Up"** link on the login page
2. Fill in the registration form:
   - **Name**: Your full name (2-50 characters)
   - **Email**: A valid email address (will be used for login)
   - **Password**: At least 6 characters long
3. Click **"Register"**
4. Upon successful registration, you will be automatically logged in

#### Logging In

1. Navigate to the login page
2. Enter your **email** and **password**
3. Click **"Login"**
4. You will be redirected to the Home page upon successful authentication

#### Logging Out

1. Click on your **profile icon** or **username** in the navigation bar
2. Select **"Logout"** from the dropdown menu
3. You will be logged out and redirected to the login page

#### Updating Your Profile

1. Navigate to **Profile** from the navigation menu
2. Update any of the following:
   - **Name**: Your display name
   - **Dietary Restrictions**: Add dietary preferences (e.g., vegetarian, gluten-free)
   - **Favorite Categories**: Select preferred recipe categories
   - **Default Servings**: Set your default serving size
3. Click **"Save"** to update your profile

### Navigation

RecipeDat has the following main sections accessible from the navigation bar:

- **Home**: Dashboard with overview and quick actions
- **Cookbook**: Your saved recipes collection
- **Recents**: Recently generated AI recipes (expires in 7 days)
- **The Kitchen**: AI recipe generation interface
- **Profile**: User profile and settings
- **About**: Information about the application

### The Kitchen - AI Recipe Generation

The Kitchen is where you can generate recipes using AI from images and ingredients.

#### Generating a Recipe from an Image

1. Navigate to **"The Kitchen"** from the navigation menu
2. **Upload an image** using one of these methods:
   - **Drag and drop** an image file onto the upload area
   - **Click** the upload area to open file picker
   - Supported formats: JPG, PNG, GIF, WebP
   - Maximum file size: 5MB
3. (Optional) Add **ingredients** in the text area:
   - Enter one ingredient per line
   - Example:
     ```
     2 cups pasta
     1 tbsp olive oil
     1 clove garlic
     ```
4. Click **"Generate Recipe"**
5. Wait for the AI to process (this may take 30 seconds to 2 minutes)
6. Review the generated recipe:
   - Recipe name
   - Category and difficulty
   - Cooking time and servings
   - Ingredients list
   - Step-by-step instructions
   - Recipe image

#### Generating a Recipe from Ingredients Only

1. Navigate to **"The Kitchen"**
2. Leave the image upload area empty
3. Enter your **ingredients** in the text area (one per line)
4. Click **"Generate Recipe"**
5. The AI will generate a recipe based on your ingredients

#### After Recipe Generation

Once a recipe is generated, you have three options:

1. **Save to Cookbook**: Permanently saves the recipe to your cookbook
2. **Skip (Save to Recents)**: Keeps the recipe in Recents (expires in 7 days)
3. **Back to The Kitchen**: Discards the recipe and returns to generation interface

**Note**: All AI-generated recipes are automatically saved to Recents first. You can move them to your Cookbook later.

### Cookbook - Managing Your Recipes

The Cookbook is your permanent recipe collection.

#### Viewing Recipes

1. Navigate to **"Cookbook"** from the navigation menu
2. Recipes are displayed in a grid layout
3. Each recipe card shows:
   - Recipe name
   - Cooking time
   - Number of servings
   - Category tag

#### Searching and Filtering

1. Use the **search bar** to search by:
   - Recipe name
   - Category
   - Ingredients
   - Tags
2. Use the **category filter** dropdown to filter by:
   - All categories
   - Breakfast
   - Lunch
   - Dinner
   - Dessert
   - Snack
   - Beverage
   - Appetizer
   - Side
   - Other
3. Use the **sort dropdown** to sort by:
   - Name (A-Z)
   - Time (short → long)
   - Time (long → short)

#### Viewing a Recipe

1. Click on any recipe card in the Cookbook
2. A modal will open showing:
   - Full recipe name
   - Category, time, and servings
   - Complete ingredients list
   - Step-by-step instructions
   - Recipe image (if available)

#### Creating a New Recipe Manually

1. In the Cookbook, click **"+ Add Recipe"**
2. Fill in the recipe form:
   - **Name**: Recipe name (required)
   - **Category**: Select from dropdown
   - **Time (min)**: Cooking time in minutes
   - **Servings**: Number of servings
   - **Ingredients**: One per line
   - **Steps**: One per line
3. Click **"Save"** to create the recipe

#### Editing a Recipe

1. Open a recipe from the Cookbook
2. Click **"Edit"** button
3. Modify any fields in the form
4. Click **"Save"** to update the recipe
5. Click **"Cancel"** to discard changes

#### Deleting a Recipe

1. Open a recipe from the Cookbook
2. Click **"Delete"** button
3. Confirm deletion in the popup
4. The recipe will be permanently removed

### Recents - Temporary Recipe Storage

Recents stores AI-generated recipes that haven't been saved to your Cookbook yet.

#### Understanding Recents

- Recipes in Recents **expire after 7 days**
- Expired recipes are automatically deleted
- Use Recents to review AI-generated recipes before saving
- You can move recipes from Recents to Cookbook at any time

#### Viewing Recent Recipes

1. Navigate to **"Recents"** from the navigation menu
2. View all your recent AI-generated recipes
3. Use search and category filters (same as Cookbook)

#### Saving a Recipe to Cookbook

1. Open a recipe from Recents
2. Click **"Save to Cookbook"** button
3. The recipe will be moved to your Cookbook permanently
4. The recipe will no longer appear in Recents

#### Deleting a Recent Recipe

1. Open a recipe from Recents
2. Click **"Delete"** button
3. Confirm deletion
4. The recipe will be permanently removed

### Favorites System

#### Adding a Recipe to Favorites

1. Open any recipe (from Cookbook or Recents)
2. Click the **favorite/heart icon** (if available)
3. The recipe will be marked as a favorite

#### Viewing Favorite Recipes

- Favorite recipes are indicated with a special icon
- You can filter recipes by favorites (if feature is implemented)

### Tips and Best Practices

#### For AI Recipe Generation

1. **Image Quality**: Use clear, well-lit food photos for best results
2. **Ingredients**: Be specific with ingredient names (e.g., "chicken breast" not just "chicken")
3. **Patience**: AI generation can take 30 seconds to 2 minutes - be patient
4. **Review**: Always review AI-generated recipes before saving to Cookbook
5. **Edit**: You can edit AI-generated recipes after saving them

#### For Recipe Management

1. **Organize**: Use categories consistently to keep recipes organized
2. **Tags**: Add tags to recipes for better searchability
3. **Images**: Upload images to make recipes more visually appealing
4. **Backup**: Important recipes should be saved to Cookbook (not left in Recents)
5. **Search**: Use descriptive recipe names for easier searching

#### For Performance

1. **Image Size**: Keep images under 5MB for faster uploads
2. **Browser**: Use modern browsers for best performance
3. **Internet**: Stable internet connection recommended for AI generation

### Troubleshooting

#### Common Issues

**Problem**: Cannot log in
- **Solution**: Verify email and password are correct
- **Solution**: Check if account exists (try registering)
- **Solution**: Clear browser cache and cookies

**Problem**: AI recipe generation fails
- **Solution**: Check internet connection
- **Solution**: Ensure image is under 5MB and in supported format
- **Solution**: Try again - AI service may be temporarily unavailable
- **Solution**: Check if Python AI service is running (for developers)

**Problem**: Recipe not saving
- **Solution**: Ensure you're logged in
- **Solution**: Check if all required fields are filled
- **Solution**: Try refreshing the page

**Problem**: Images not loading
- **Solution**: Check internet connection
- **Solution**: Verify image URL is accessible
- **Solution**: Try uploading image again

**Problem**: Search not working
- **Solution**: Clear search field and try again
- **Solution**: Check spelling of search terms
- **Solution**: Try different search terms

#### Getting Help

If you encounter issues not covered here:
1. Check the browser console for error messages
2. Try refreshing the page
3. Clear browser cache and cookies
4. Contact system administrator (for enterprise deployments)

---

## API Reference

### Base URL

```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication Endpoints

##### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

##### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

##### GET /api/auth/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "preferences": {
    "dietaryRestrictions": [],
    "favoriteCategories": [],
    "defaultServings": 4
  },
  "lastLogin": "2024-01-15T10:30:00.000Z"
}
```

##### PUT /api/auth/profile
Update user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "preferences": {
    "dietaryRestrictions": ["vegetarian"],
    "favoriteCategories": ["Dinner", "Dessert"],
    "defaultServings": 6
  }
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

##### GET /api/auth/stats
Get user statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "recipes": 25,
  "favorites": 8
}
```

#### Recipe Endpoints

##### GET /api/recipes
Get user's cookbook recipes with filtering and pagination.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `category` (optional): Filter by category
- `search` (optional): Text search query
- `sortBy` (optional): Sort field (name, createdAt, timeMinutes, rating)
- `sortOrder` (optional): Sort direction (asc, desc)

**Example:**
```
GET /api/recipes?page=1&limit=10&category=Dinner&search=pasta&sortBy=name&sortOrder=asc
```

**Response (200):**
```json
{
  "recipes": [...],
  "pagination": {
    "current": 1,
    "pages": 3,
    "total": 25,
    "limit": 10
  }
}
```

##### GET /api/recipes/:id
Get single recipe by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "...",
  "name": "Pasta Carbonara",
  "description": "...",
  "category": "Dinner",
  "timeMinutes": 30,
  "servings": 4,
  "difficulty": "Medium",
  "ingredients": [...],
  "steps": [...],
  ...
}
```

##### POST /api/recipes
Create new recipe.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Pasta Carbonara",
  "description": "Classic Italian pasta dish",
  "category": "Dinner",
  "timeMinutes": 30,
  "servings": 4,
  "difficulty": "Medium",
  "ingredients": [
    {
      "name": "pasta",
      "amount": "400",
      "unit": "g",
      "notes": ""
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Boil water in a large pot",
      "timeMinutes": 10
    }
  ],
  "tags": ["italian", "pasta"],
  "isPublic": false
}
```

**Response (201):**
```json
{
  "message": "Recipe created successfully",
  "recipe": { ... }
}
```

##### PUT /api/recipes/:id
Update recipe.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (Same as POST, all fields optional)

**Response (200):**
```json
{
  "message": "Recipe updated successfully",
  "recipe": { ... }
}
```

##### DELETE /api/recipes/:id
Delete recipe.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Recipe deleted successfully"
}
```

##### POST /api/recipes/:id/favorite
Add recipe to favorites.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Recipe added to favorites"
}
```

##### DELETE /api/recipes/:id/favorite
Remove recipe from favorites.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Recipe removed from favorites"
}
```

##### GET /api/recipes/recents/list
Get recent recipes (not in cookbook).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional): Text search
- `category` (optional): Filter by category
- `tag` (optional): Filter by tag

**Response (200):**
```json
{
  "recipes": [...],
  "count": 5
}
```

##### POST /api/recipes/:id/save-to-cookbook
Move recipe from recents to cookbook.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Recipe saved to cookbook",
  "recipe": { ... }
}
```

##### GET /api/recipes/favorites
Get user's favorite recipes.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "recipes": [...],
  "count": 8
}
```

#### AI Endpoints

##### POST /api/ai/generate-recipe
Generate recipe from image and/or ingredients.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image` (optional): Image file (max 5MB)
- `ingredients` (required if no image): JSON array of ingredient strings
- `prompt` (optional): Additional prompt text

**Example using FormData:**
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('ingredients', JSON.stringify(['chicken', 'rice', 'vegetables']));
formData.append('prompt', 'Generate a healthy recipe');
```

**Response (200):**
```json
{
  "message": "Recipe generated successfully",
  "recipe": {
    "_id": "...",
    "name": "AI-Generated Chicken Recipe",
    "isGenerated": true,
    "isInRecents": true,
    "expiresAt": "2024-01-22T10:30:00.000Z",
    ...
  },
  "isMockGeneration": false
}
```

**Note**: If `isMockGeneration` is `true`, the AI service failed and a mock recipe was generated instead.

##### GET /api/ai/suggestions
Get ingredient suggestions.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "suggestions": [
    "chicken breast",
    "onion",
    "garlic",
    "tomatoes",
    "pasta",
    ...
  ]
}
```

#### Health Check

##### GET /api/health
Check API health status.

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

### Error Responses

All endpoints may return error responses in the following format:

**400 Bad Request:**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Recipe name is required",
      "param": "name"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "message": "Invalid credentials"
}
```

**404 Not Found:**
```json
{
  "message": "Recipe not found"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Server error during recipe generation",
  "error": "Detailed error message (development only)"
}
```

---

## Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  name: String (required, 2-50 chars),
  email: String (required, unique, lowercase, validated),
  password: String (required, min 6 chars, bcrypt hashed),
  avatar: String (optional),
  preferences: {
    dietaryRestrictions: [String],
    favoriteCategories: [String],
    defaultServings: Number (default: 4)
  },
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email`: Unique index

### Recipe Collection

```javascript
{
  _id: ObjectId,
  name: String (required, max 100 chars),
  description: String (max 2000 chars),
  category: String (enum: Breakfast, Lunch, Dinner, Dessert, Snack, Beverage, Appetizer, Side, Other),
  timeMinutes: Number (required, 1-1440),
  servings: Number (required, 1-50),
  difficulty: String (enum: Easy, Medium, Hard, default: Easy),
  ingredients: [{
    name: String (required),
    amount: String (required),
    unit: String,
    notes: String
  }],
  steps: [{
    stepNumber: Number (required),
    instruction: String (required, max 1000 chars),
    timeMinutes: Number,
    temperature: String
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
  imageUrl: String,
  isPublic: Boolean (default: false),
  isGenerated: Boolean (default: false),
  isInCookbook: Boolean (default: false),
  isInRecents: Boolean (default: false),
  expiresAt: Date (for recents, 7 days from creation),
  generatedFrom: {
    imageUrl: String,
    ingredients: [String],
    prompt: String
  },
  rating: {
    average: Number (0-5),
    count: Number
  },
  user: ObjectId (required, ref: 'User'),
  favorites: [ObjectId] (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `name`: Text index (for search)
- `description`: Text index (for search)
- `tags`: Text index (for search)
- `category`: Single field index
- `user`: Single field index
- `isPublic`: Single field index
- `isInCookbook`: Single field index
- `isInRecents`: Single field index
- `expiresAt`: Single field index (for cleanup)

**Virtual Fields:**
- `totalTimeMinutes`: Sum of all step timeMinutes

**Methods:**
- `addToFavorites(userId)`: Add user to favorites array
- `removeFromFavorites(userId)`: Remove user from favorites array

---

## Deployment Guide

### Prerequisites

- Node.js v16 or higher
- MongoDB (local or MongoDB Atlas)
- Python 3.8+ (for AI service)
- npm or yarn
- Git

### Backend Deployment

#### 1. Environment Setup

```bash
cd RecipeDat-Backend
cp env.example .env
```

Edit `.env` with production values:
```env
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recipedat
JWT_SECRET=your-production-secret-key-here
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-domain.com
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

#### 2. Install Dependencies

```bash
npm install
pip install -r requirements.txt
```

#### 3. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

#### 4. AI Service Setup

The AI service runs automatically when a recipe generation request is received. Ensure:
- Python 3.8+ is installed
- All Python dependencies are installed (`pip install -r requirements.txt`)
- Sufficient disk space (~6GB for model files)
- GPU recommended but not required

### Frontend Deployment

#### 1. Environment Setup

Create `.env` file:
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

#### 2. Install Dependencies

```bash
cd RecipeDatVite
npm install
```

#### 3. Build for Production

```bash
npm run build
```

This creates a `dist/` folder with production-ready files.

#### 4. Serve Production Build

**Using Vite Preview:**
```bash
npm run preview
```

**Using Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/RecipeDatVite/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Using Node.js (serve package):**
```bash
npm install -g serve
serve -s dist -l 5173
```

### Docker Deployment

#### Backend Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secret
- [ ] Configure MongoDB Atlas IP whitelist
- [ ] Set up proper CORS origins
- [ ] Configure file storage (AWS S3, Cloudinary, etc.)
- [ ] Set up SSL/HTTPS
- [ ] Configure rate limiting appropriately
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for MongoDB
- [ ] Test AI service in production environment
- [ ] Set up error tracking (Sentry, etc.)

---

## Troubleshooting

### Backend Issues

#### MongoDB Connection Failed

**Symptoms:**
- Server fails to start
- Error: "MongoDB connection failed"

**Solutions:**
1. Check MongoDB URI in `.env`
2. Verify MongoDB Atlas IP whitelist includes your server IP
3. Check network connectivity
4. Verify MongoDB credentials
5. Check MongoDB Atlas cluster status

#### AI Generation Fails

**Symptoms:**
- Recipe generation returns mock recipes
- Error: "AI generation failed"

**Solutions:**
1. Verify Python 3.8+ is installed: `python --version`
2. Install Python dependencies: `pip install -r requirements.txt`
3. Check disk space (need ~6GB for model)
4. Verify `generate_recipe.py` exists and is executable
5. Check Python process logs for errors
6. Test Python script manually:
   ```bash
   python generate_recipe.py --image path/to/image.jpg --ingredients '["chicken", "rice"]'
   ```

#### File Upload Issues

**Symptoms:**
- Images not uploading
- Error: "File too large"

**Solutions:**
1. Check `MAX_FILE_SIZE` in `.env` (default: 5MB)
2. Verify `uploads/` directory exists and is writable
3. Check disk space on server
4. Verify file is an image format (JPG, PNG, GIF, WebP)

### Frontend Issues

#### API Connection Failed

**Symptoms:**
- "Failed to fetch" errors
- Network errors in console

**Solutions:**
1. Verify backend is running on correct port
2. Check `VITE_API_BASE_URL` in frontend `.env`
3. Verify CORS is configured correctly
4. Check browser console for detailed errors
5. Verify authentication token is valid

#### Authentication Issues

**Symptoms:**
- Cannot log in
- "Invalid credentials" error
- Token expired

**Solutions:**
1. Clear browser localStorage
2. Verify JWT_SECRET matches between environments
3. Check token expiration time
4. Verify user exists in database
5. Check password hashing is working

### General Issues

#### Performance Issues

**Symptoms:**
- Slow page loads
- AI generation takes too long

**Solutions:**
1. Check server resources (CPU, RAM, disk)
2. Optimize database queries (add indexes)
3. Use GPU for AI generation if available
4. Implement caching where appropriate
5. Optimize image sizes before upload

#### Data Loss

**Symptoms:**
- Recipes missing
- Recent recipes expired

**Solutions:**
1. Check MongoDB connection
2. Verify recipes weren't deleted
3. Check expiration dates for recents
4. Restore from backup if available
5. Check database indexes are working

---

## Appendix

### A. Supported File Formats

**Images:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

**Maximum file size:** 5MB

### B. Recipe Categories

- Breakfast
- Lunch
- Dinner
- Dessert
- Snack
- Beverage
- Appetizer
- Side
- Other

### C. Difficulty Levels

- Easy
- Medium
- Hard

### D. API Rate Limits

- **Default**: 1000 requests per 15 minutes per IP
- **Configurable**: Adjust in `server.js` rate limiter settings

### E. Token Expiration

- **Default**: 7 days
- **Configurable**: Set `JWT_EXPIRE` in `.env`

### F. Recent Recipe Expiration

- **Default**: 7 days from creation
- **Automatic cleanup**: Expired recipes are deleted automatically

### G. Model Information

**AI Model:** Qwen2-VL-2B-Instruct
- **Provider:** Hugging Face
- **Size:** ~4GB (model files)
- **Type:** Vision-Language Model
- **Use Case:** Recipe generation from images

### H. Browser Compatibility

**Minimum Requirements:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features:**
- JavaScript enabled
- LocalStorage support
- Fetch API support
- File API support

### I. Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (minimum 32 characters, random)
3. **Enable HTTPS** in production
4. **Regularly update dependencies** for security patches
5. **Monitor API usage** for suspicious activity
6. **Implement rate limiting** to prevent abuse
7. **Validate all user inputs** on both client and server
8. **Use parameterized queries** (Mongoose handles this)
9. **Hash passwords** (bcrypt with salt rounds 12)
10. **Set secure HTTP headers** (Helmet.js)

### J. Development Tools

**Recommended IDE Extensions:**
- ESLint
- Prettier
- MongoDB Compass
- Postman (for API testing)

**Useful Commands:**

```bash
# Backend
npm run dev          # Start development server
npm start            # Start production server
npm test             # Run tests (if configured)

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Python AI Service
python generate_recipe.py --image path/to/image.jpg --ingredients '["ing1", "ing2"]'
```

### K. Contact & Support

For technical support or questions:
- Check this documentation first
- Review error logs in browser console and server logs
- Check GitHub issues (if repository is public)
- Contact system administrator

---

## Document Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial documentation release |

---

**End of Documentation**


