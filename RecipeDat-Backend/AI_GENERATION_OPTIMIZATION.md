# AI Generation Optimization Guide

## Model

The application uses **DeepSeek VL 1.3B Chat** model for AI-powered recipe generation. This model can analyze food images and generate detailed recipes.

### Model Details
- **Model**: `deepseek-ai/deepseek-vl-1.3b-chat`
- **API**: Hugging Face Transformers Pipeline (`image-text-to-text`)
- **Size**: ~1.3B parameters (smaller and faster than previous models)
- **Model Files**: Downloaded once and cached locally by Hugging Face in `~/.cache/huggingface/`
- **Memory Loading**: Model loads into memory each time (each request spawns a new Python process)
- **Advantages**: 
  - Simple pipeline API (no complex loading workarounds)
  - Faster inference
  - Lower memory usage
  - Better compatibility
  - Model files only downloaded once (cached by Hugging Face)

## Setup

### Installation

```bash
pip install -r requirements.txt
```

Key dependencies:
- `transformers>=4.49.0`
- `torch>=2.0.0`
- `Pillow>=10.0.0`

### Model File Caching

**Good news**: Hugging Face automatically caches model files! The model is only downloaded **once** to your local cache directory:
- **Windows**: `C:\Users\<username>\.cache\huggingface\`
- **Linux/Mac**: `~/.cache/huggingface/`

After the first download, all subsequent requests use the cached files, so you don't need to download again.

**Note**: While model files are cached, the model still needs to be loaded into memory for each request (since Node.js spawns a new Python process). This typically takes 30-60 seconds on CPU, but the actual download only happens once.

## Performance

### Model Download (One-Time)
- **First request ever**: Downloads model files (~2-4GB) to `~/.cache/huggingface/`
- **All subsequent requests**: Uses cached files (no download needed)

### Memory Loading (Per Request)
- **Each request**: Model loads into memory (30-60 seconds on CPU, 10-20 seconds on GPU)
- **Inference**: 30-90 seconds on CPU, 10-30 seconds on GPU

**Total time per request**: ~1-2 minutes on CPU, ~20-50 seconds on GPU

## Performance Expectations

- **CPU (4 cores)**: 30-90 seconds per generation (after model load)
- **GPU (NVIDIA)**: 10-30 seconds per generation (after model load)
- **Model loading**: 30-120 seconds (one-time on first request)

## Troubleshooting

### Model Loading Errors

If you encounter model loading errors:

1. **Check transformers version:**
   ```bash
   pip install --upgrade transformers
   ```

2. **Check disk space:**
   - Model download requires ~3-5GB
   - Check available space in Hugging Face cache: `~/.cache/huggingface/`

3. **Check internet connection:**
   - First run requires downloading the model
   - Model is cached locally after first download

### Generation Timeout

If generation times out:

1. **Use model caching service** - eliminates reload time
2. **Use GPU** - much faster than CPU
3. **Reduce max_new_tokens** - currently set to 150 (can be reduced further)

### Fallback Behavior

The system automatically falls back:
1. **HTTP Service** → Direct Python script → Mock generation
2. All failures are logged and handled gracefully

## Code Structure

### Simple Pipeline Usage

```python
from transformers import pipeline

pipe = pipeline("image-text-to-text", model="deepseek-ai/deepseek-vl-1.3b-chat")
result = pipe(image, prompt, max_new_tokens=150)
```

That's it! No complex loading workarounds needed.

## Next Steps

1. **Start the AI service** for best performance
2. **Test recipe generation** - first request loads model, subsequent ones are fast
3. **Monitor performance** - check logs for generation times
4. **Consider GPU** - for even faster inference
