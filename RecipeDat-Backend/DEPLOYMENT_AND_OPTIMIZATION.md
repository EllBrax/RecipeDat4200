# Deployment and Optimization Guide for Mobile Access

This guide covers strategies to make your AI recipe generation faster and accessible for phone users.

## Current Performance

- **CPU**: ~3.9 minutes per generation (Qwen2-VL-2B)
- **Model Loading**: ~7-10 seconds per request (new process each time)
- **Memory**: ~4GB for model files, ~8GB RAM for inference

## Optimization Strategies

### 1. Use GPU (Fastest Option)

**If you have access to a GPU server:**

```python
# In generate_recipe.py, the code already detects GPU automatically
# But you can force GPU usage:
MODEL_NAME = "Qwen/Qwen2-VL-2B-Instruct"  # or 7B for better quality
# The model will automatically use GPU if available
```

**Expected Performance:**
- **GPU (NVIDIA with 8GB+ VRAM)**: 10-30 seconds per generation
- **GPU (NVIDIA with 16GB+ VRAM)**: 5-15 seconds per generation

**Cloud GPU Options:**
- **RunPod**: ~$0.20-0.50/hour for GPU instances
- **Vast.ai**: ~$0.15-0.40/hour for GPU instances
- **AWS EC2 (g4dn.xlarge)**: ~$0.50/hour
- **Google Colab Pro**: ~$10/month (limited GPU hours)

### 2. Model Quantization (Smaller, Faster)

Use quantized models to reduce size and speed up inference:

```python
# Add to generate_recipe.py
from transformers import BitsAndBytesConfig

# 4-bit quantization (much smaller, faster)
quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16
)

_model_cache = Qwen2VLForConditionalGeneration.from_pretrained(
    MODEL_NAME,
    quantization_config=quantization_config,
    device_map="auto"
)
```

**Benefits:**
- 4x smaller model size (~1GB instead of 4GB)
- Faster inference (2-3x speedup)
- Lower memory usage

### 3. Persistent Model Service (Recommended for Production)

**Problem**: Node.js spawns a new Python process for each request, reloading the model every time.

**Solution**: Create a persistent Python service that keeps the model in memory.

**Create `ai_service.py`:**

```python
#!/usr/bin/env python3
"""
Persistent AI service that keeps model in memory
Run this once, keeps model loaded for all requests
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from generate_recipe import get_model_and_processor, generate_recipe
import tempfile
import os

app = Flask(__name__)
CORS(app)

# Load model once at startup
print("Loading model at service startup...")
model, processor = get_model_and_processor()
print("Model loaded! Service ready.")

@app.route('/generate', methods=['POST'])
def generate():
    try:
        # Get image file from request
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        image_file = request.files['image']
        ingredients = request.form.get('ingredients', '[]')
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            image_file.save(tmp.name)
            image_path = tmp.name
        
        try:
            import json
            ingredients_list = json.loads(ingredients)
            recipe = generate_recipe(image_path, ingredients_list)
            return jsonify(recipe)
        finally:
            # Clean up temp file
            os.unlink(image_path)
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**Start the service:**
```bash
python ai_service.py
```

**Update `ai.js` to use the service:**
```javascript
// Add to ai.js
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

async function generateAIRecipeViaService(imagePath, ingredients) {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(imagePath));
  formData.append('ingredients', JSON.stringify(ingredients));
  
  const response = await axios.post(`${AI_SERVICE_URL}/generate`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000 // 5 minutes
  });
  
  return response.data;
}
```

**Benefits:**
- Model loads once at startup (~30 seconds)
- Subsequent requests: 10-30 seconds (GPU) or 1-2 minutes (CPU)
- No model reloading overhead

### 4. Use Cloud AI Services (Best for Scale)

Instead of running models yourself, use cloud-hosted AI:

**Option A: Hugging Face Inference API**
```javascript
// Add to ai.js
async function generateAIRecipeViaHuggingFace(imagePath, ingredients) {
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  
  const response = await axios.post(
    'https://api-inference.huggingface.co/models/Qwen/Qwen2-VL-2B-Instruct',
    {
      inputs: {
        image: imageBase64,
        text: `Generate a recipe using: ${ingredients.join(', ')}`
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
      },
      timeout: 120000
    }
  );
  
  return parseRecipeResponse(response.data);
}
```

**Option B: OpenAI Vision API**
```javascript
async function generateAIRecipeViaOpenAI(imagePath, ingredients) {
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4-vision-preview',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Generate a recipe using: ${ingredients.join(', ')}` },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      }],
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );
  
  return parseRecipeResponse(response.data.choices[0].message.content);
}
```

**Costs:**
- **Hugging Face**: Free tier available, paid plans start at $9/month
- **OpenAI**: ~$0.01-0.03 per image (GPT-4 Vision)
- **Self-hosted**: Server costs only (~$20-100/month for GPU server)

## Deployment Options

### 1. Deploy Backend to Cloud

**Option A: Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```

**Option B: Render**
- Go to render.com
- Connect GitHub repo
- Deploy as web service
- Set environment variables

**Option C: DigitalOcean App Platform**
- Connect GitHub repo
- Auto-deploys on push
- Handles scaling

**Option D: AWS/GCP/Azure**
- More complex but more control
- Use Elastic Beanstalk, App Engine, or Azure App Service

### 2. Update Frontend to Use Deployed Backend

**In `RecipeDatVite/src/services/api.js`:**

```javascript
// Change from localhost to your deployed URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend.railway.app/api';
// Or for production:
// const API_BASE_URL = 'https://recipedat-api.yourdomain.com/api';
```

**Create `.env.production`:**
```
VITE_API_URL=https://your-backend.railway.app/api
```

### 3. Deploy Frontend for Mobile Access

**Option A: Vercel (Recommended)**
```bash
npm install -g vercel
vercel
# Follow prompts
```

**Option B: Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Option C: GitHub Pages**
- Build static site
- Deploy to GitHub Pages

**Option D: Mobile App (React Native)**
- Convert React app to React Native
- Use same API endpoints
- Better mobile experience

## Architecture Recommendations

### For Small Scale (1-10 users)
1. Deploy backend to Railway/Render
2. Use persistent AI service (keeps model in memory)
3. Deploy frontend to Vercel/Netlify
4. **Cost**: ~$10-30/month

### For Medium Scale (10-100 users)
1. Deploy backend with GPU instance (RunPod/Vast.ai)
2. Use persistent AI service with model quantization
3. Add request queuing (BullMQ/Redis)
4. Deploy frontend to CDN
5. **Cost**: ~$50-150/month

### For Large Scale (100+ users)
1. Use cloud AI APIs (Hugging Face/OpenAI)
2. Multiple backend instances behind load balancer
3. Redis for caching
4. CDN for frontend
5. **Cost**: ~$100-500/month (scales with usage)

## Quick Wins for Speed

1. **Enable GPU** (if available): 10-30 seconds vs 3-4 minutes
2. **Use persistent service**: Eliminates model reload time
3. **Quantize model**: 2-3x faster inference
4. **Cache common recipes**: Store results in Redis
5. **Use smaller model**: Qwen2-VL-2B is good balance

## Security Considerations

1. **Rate limiting**: Prevent abuse
2. **Authentication**: Require login for AI generation
3. **File size limits**: Max 5-10MB images
4. **API keys**: Keep secrets in environment variables
5. **CORS**: Configure for your frontend domain only

## Next Steps

1. **Start with persistent service** - easiest win
2. **Deploy backend to cloud** - make it accessible
3. **Deploy frontend** - make it mobile-friendly
4. **Monitor performance** - track response times
5. **Scale as needed** - add GPU or cloud APIs

Want help implementing any of these? I can:
- Create the persistent AI service
- Set up deployment configs
- Integrate cloud AI APIs
- Optimize the model loading

