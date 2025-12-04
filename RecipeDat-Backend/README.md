# RecipeDat Backend API

A Node.js/Express backend API for the RecipeDat recipe management application.

## Features

- 🔐 User authentication with JWT
- 📝 Recipe CRUD operations
- 🤖 AI-powered recipe generation
- 📸 Image upload support
- 🔍 Recipe search and filtering
- ⭐ Favorites system
- 📊 Recipe analytics

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **File Upload:** Multer
- **Validation:** Express-validator
- **Security:** Helmet, CORS, Rate limiting

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- Python 3.8+ (for AI recipe generation)

### Installation

1. **Clone and navigate to the backend directory:**
   ```bash
   cd RecipeDat-Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up AI recipe generation (optional):**
   ```bash
   pip install -r requirements.txt
   ```
   
   This installs the Python dependencies for the Qwen2.5-VL-3B-Instruct model.
   Note: The first run will download the model (~6GB), which may take several minutes.

4. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/recipedat
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Recipes
- `GET /api/recipes` - Get user's cookbook recipes (with filtering)
- `POST /api/recipes` - Create new recipe
- `GET /api/recipes/:id` - Get single recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `POST /api/recipes/:id/favorite` - Add to favorites
- `DELETE /api/recipes/:id/favorite` - Remove from favorites
- `GET /api/recipes/recents/list` - Get recent recipes (not in cookbook)
- `POST /api/recipes/:id/save-to-cookbook` - Move recipe from recents to cookbook
- `POST /api/recipes/clean-expired` - Clean up expired recent recipes

### AI Generation
- `POST /api/ai/generate-recipe` - Generate recipe from image/ingredients
  - Uses DeepSeek VL 1.3B Chat vision-language model from Hugging Face
  - Supports image upload + optional ingredients list
  - Automatically falls back to mock generation if Python dependencies unavailable
  - Uses transformers pipeline API for simple and reliable model loading
- `GET /api/ai/suggestions` - Get ingredient suggestions

### Health Check
- `GET /api/health` - API health status

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  preferences: {
    dietaryRestrictions: [String],
    favoriteCategories: [String],
    defaultServings: Number
  },
  lastLogin: Date
}
```

### Recipe Model
```javascript
{
  name: String,
  description: String,
  category: String,
  timeMinutes: Number,
  servings: Number,
  difficulty: String,
  ingredients: [{
    name: String,
    amount: String,
    unit: String,
    notes: String
  }],
  steps: [{
    stepNumber: Number,
    instruction: String,
    timeMinutes: Number,
    temperature: String
  }],
  nutrition: Object,
  tags: [String],
  imageUrl: String,
  isPublic: Boolean,
  isGenerated: Boolean,
  user: ObjectId,
  favorites: [ObjectId]
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/recipedat |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `MAX_FILE_SIZE` | Max upload file size | 5242880 (5MB) |
| `UPLOAD_PATH` | Upload directory | ./uploads |

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### File Structure
```
RecipeDat-Backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
├── uploads/            # File uploads directory
├── server.js           # Main server file
├── package.json
└── README.md
```

## Security Features

- **Helmet:** Security headers
- **CORS:** Cross-origin resource sharing
- **Rate Limiting:** API request limiting
- **Input Validation:** Request data validation
- **Password Hashing:** bcrypt for password security
- **JWT Authentication:** Secure token-based auth

## AI Recipe Generation

The application uses the **Qwen2.5-VL-3B-Instruct** model from Hugging Face for AI-powered recipe generation. This model can analyze food images and generate detailed recipes.

### How It Works

1. User uploads an image of food (optional) and/or provides ingredient list
2. The image is processed by the Qwen2.5-VL vision-language model
3. The model generates:
   - Recipe name
   - Category and difficulty
   - Cooking time and servings
   - Detailed ingredient list
   - Step-by-step instructions
   - Helpful notes
4. The recipe is parsed and returned in structured format
5. User can save the recipe to their cookbook

### Requirements

- Python 3.8+
- PyTorch (installed via `requirements.txt`)
- ~6GB disk space for model files
- GPU recommended but not required (CPU inference is supported)

### Fallback Behavior

If Python dependencies are not installed or the model fails to load, the backend automatically falls back to a mock recipe generator. This ensures the application remains functional even without AI capabilities.

## Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Set strong JWT secrets
4. Configure proper CORS origins
5. Set up file storage (AWS S3, Cloudinary, etc.)

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

