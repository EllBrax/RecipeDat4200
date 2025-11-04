# Switching to Qwen2-VL Model

This guide explains how to switch from BLIP-2 to Qwen2-VL for recipe generation.

## Step 1: Install Required Packages

Update your Python dependencies:

```bash
pip install git+https://github.com/huggingface/transformers
pip install qwen-vl-utils
```

Or update `requirements.txt`:
```
transformers>=4.49.0
torch>=2.0.0
torchvision>=0.15.0
Pillow>=10.0.0
accelerate>=0.25.0
qwen-vl-utils>=1.0.0
```

## Step 2: Choose a Qwen2-VL Model

Available models:
- `Qwen/Qwen2-VL-2B-Instruct` - Smallest (2B parameters, fastest)
- `Qwen/Qwen2-VL-7B-Instruct` - Medium (7B parameters, better quality)
- `Qwen/Qwen2-VL-72B-Instruct` - Largest (72B parameters, best quality, requires GPU)

**Recommended**: Start with `Qwen/Qwen2-VL-2B-Instruct` for CPU usage.

## Step 3: Update generate_recipe.py

The main changes needed:

1. **Replace pipeline API with direct model loading**
2. **Use Qwen2VLForConditionalGeneration and AutoProcessor**
3. **Handle chat format with vision inputs**
4. **Use qwen_vl_utils for image processing**

## Step 4: Code Changes Required

### Key Differences from BLIP-2:

**BLIP-2 (Current)**:
- Uses simple `pipeline("image-to-text")` API
- Only accepts image, no prompt
- Returns image description only

**Qwen2-VL (New)**:
- Requires direct model loading (`Qwen2VLForConditionalGeneration`)
- Uses `AutoProcessor` for tokenization
- Supports image + text prompts together
- Uses `qwen_vl_utils.process_vision_info()` for image preprocessing
- Returns full recipe directly (not just description)

### Implementation Overview:

```python
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info

# Load model and processor
model = Qwen2VLForConditionalGeneration.from_pretrained(
    "Qwen/Qwen2-VL-2B-Instruct",
    torch_dtype="auto",
    device_map="auto"
)
processor = AutoProcessor.from_pretrained("Qwen/Qwen2-VL-2B-Instruct")

# Process image
vision_inputs = process_vision_info([image_path])

# Prepare prompt
prompt = "Generate a detailed recipe based on this image..."

# Process inputs
inputs = processor(
    text=[prompt],
    images=vision_inputs,
    return_tensors="pt"
).to(model.device)

# Generate
outputs = model.generate(**inputs, max_new_tokens=512)
response = processor.decode(outputs[0], skip_special_tokens=True)
```

## Step 5: Benefits of Switching

✅ **Better recipe quality** - Qwen2-VL is designed for instruction following
✅ **Direct prompt support** - Can provide detailed recipe instructions
✅ **More accurate** - Better at understanding cooking context
✅ **Structured output** - Can follow formatting instructions better

## Step 6: Considerations

⚠️ **Model size**: Qwen2-VL models are larger than BLIP-2
   - 2B model: ~4GB
   - 7B model: ~14GB
   - 72B model: ~144GB (GPU recommended)

⚠️ **Memory requirements**: Larger models need more RAM
   - 2B: ~8GB RAM minimum
   - 7B: ~16GB RAM minimum
   - 72B: GPU with 80GB+ VRAM

⚠️ **Speed**: Qwen2-VL may be slower than BLIP-2 on CPU
   - 2B: ~2-3 minutes per generation on CPU
   - 7B: ~5-10 minutes per generation on CPU
   - GPU: Much faster (10-30 seconds)

## Step 7: Testing

After switching:
1. Test with a simple image first
2. Check that recipe output is well-formatted
3. Verify all fields are extracted correctly
4. Monitor memory usage and generation time

## Need Help?

If you want me to implement the switch, I can:
1. Update `generate_recipe.py` with Qwen2-VL code
2. Update `requirements.txt` with new dependencies
3. Test the implementation
4. Update documentation

Just let me know which model size you want to use (2B recommended for CPU)!

