#!/usr/bin/env python3
"""
Simple AI Model Service - Keeps model loaded in memory
Run this ONCE, then Node.js can make HTTP requests to it
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
from generate_recipe import generate_recipe

app = Flask(__name__)
CORS(app)

# Load model once when service starts
print("Loading DeepSeek VL model (one-time, stays in memory)...", file=sys.stderr)
print("This may take 30-60 seconds...", file=sys.stderr)

# Import after Flask is set up to avoid issues
from transformers import pipeline
_pipeline = pipeline("image-text-to-text", model="deepseek-ai/deepseek-vl-1.3b-chat")

print("✅ Model loaded and ready! Service running on http://127.0.0.1:5000", file=sys.stderr)
print("Press Ctrl+C to stop", file=sys.stderr)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ready", "model": "deepseek-vl-1.3b-chat"})

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        image_path = data.get('image_path')
        ingredients = data.get('ingredients', [])
        
        if not image_path:
            return jsonify({"error": "image_path required"}), 400
        
        # Use the cached pipeline via the generate_recipe function
        # We need to modify it to use our cached pipeline
        from PIL import Image
        
        image = Image.open(image_path).convert('RGB')
        ingredients_text = ", ".join(ingredients) if ingredients else "available ingredients"
        prompt_text = f"""Generate a detailed recipe based on this image of food. Use these ingredients if applicable: {ingredients_text}.

Please provide:
1. A creative recipe name
2. Category (Breakfast, Lunch, Dinner, Dessert, or Snack)
3. Difficulty level (Easy, Medium, or Hard)
4. Estimated cooking time in minutes
5. Number of servings
6. List of ingredients with quantities
7. Step-by-step cooking instructions (minimum 5 steps)
8. At least 3-5 relevant tags (such as cuisine type, cooking method, dietary info, or key flavors)
9. Any helpful notes or tips

Format your response as a complete recipe that someone can follow to recreate this dish."""

        result = _pipeline(image, prompt_text, max_new_tokens=150)
        output_text = result[0]['generated_text']
        
        # Parse using existing function
        from generate_recipe import parse_recipe_output
        recipe = parse_recipe_output(output_text, ingredients)
        
        return jsonify(recipe)
        
    except Exception as e:
        import traceback
        print(f"Error: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)
