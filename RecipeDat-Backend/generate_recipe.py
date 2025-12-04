#!/usr/bin/env python3
"""
AI Recipe Generation using Qwen2-VL Model
Uses Qwen2-VL for direct recipe generation from images and text prompts
Model is cached in memory after first load to avoid reloading on each request
"""

import sys
import json
import argparse
import torch
from pathlib import Path
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info
from PIL import Image

# Global cache for the model and processor - loads once per Python process, reuses for all calls within that process
# Note: Since Node.js spawns a new Python process for each request, this cache only persists within a single request
# However, the model files are cached by Hugging Face, so they're only downloaded once to ~/.cache/huggingface/
_model_cache = None
_processor_cache = None

# Model selection - you can change this to use different Qwen2-VL models:
# - "Qwen/Qwen2-VL-2B-Instruct" (smallest, fastest, ~4GB, recommended for CPU)
# - "Qwen/Qwen2-VL-7B-Instruct" (medium, better quality, ~14GB, needs GPU for reasonable speed)
# - "Qwen/Qwen2-VL-72B-Instruct" (largest, best quality, ~144GB, requires GPU)
MODEL_NAME = "Qwen/Qwen2-VL-2B-Instruct"

def get_model_and_processor():
    """
    Get or load the model and processor. First call loads the model, subsequent calls within the same process reuse it.
    Model files are cached by Hugging Face (downloaded once), but model loads into memory each new process.
    """
    global _model_cache, _processor_cache
    
    if _model_cache is None or _processor_cache is None:
        print(f"Loading Qwen2-VL model: {MODEL_NAME} (model files cached, loading into memory)...", file=sys.stderr)
        try:
            print("Loading model and processor...", file=sys.stderr)
            
            # Load processor first
            _processor_cache = AutoProcessor.from_pretrained(MODEL_NAME)
            
            # Load model - use device_map="auto" to automatically use GPU if available
            _model_cache = Qwen2VLForConditionalGeneration.from_pretrained(
                MODEL_NAME,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None
            )
            
            # Move to CPU if no GPU available
            if not torch.cuda.is_available():
                _model_cache = _model_cache.to("cpu")
                print("Using CPU (no GPU detected)", file=sys.stderr)
            else:
                print(f"Using GPU: {torch.cuda.get_device_name(0)}", file=sys.stderr)
            
            print("Model loaded and cached in memory for this process!", file=sys.stderr)
        except Exception as e:
            print(f"Error loading Qwen2-VL model: {e}", file=sys.stderr)
            import traceback
            print(traceback.format_exc(), file=sys.stderr)
            raise
    else:
        print("Using cached model (no reload needed in this process)", file=sys.stderr)
    
    return _model_cache, _processor_cache

def generate_recipe(image_path, ingredients_list):
    """
    Generate a recipe from an image and ingredients using Qwen2-VL vision-language model
    Uses Qwen2-VL to directly generate a recipe from the image and prompt
    
    Args:
        image_path: Path to the image file
        ingredients_list: List of ingredients
    
    Returns:
        Dictionary with recipe details
    """
    try:
        # Get model and processor (loads once, then reuses cached version)
        model, processor = get_model_and_processor()
        
        # Load and prepare image
        print(f"Processing image: {image_path}", file=sys.stderr)
        image = Image.open(image_path).convert('RGB')
        
        # Prepare ingredients text
        ingredients_text = ", ".join(ingredients_list) if ingredients_list else ""
        
        # Create the prompt for Qwen2-VL
        prompt_text = f"""Generate a detailed recipe based on this image of food. Use these ingredients if applicable: {ingredients_text}.

Please provide:
1. A creative, descriptive recipe name
2. Category (Breakfast, Lunch, Dinner, Dessert, Snack, Beverage, Appetizer, Side, or Other)
3. Difficulty level (Easy, Medium, or Hard)
4. Estimated cooking time in minutes
5. Number of servings
6. List of ingredients with quantities (format as: "amount unit ingredient name")
7. Step-by-step cooking instructions (minimum 5 steps, numbered)
8. At least 3-5 relevant tags based on the recipe content
9. Any helpful notes or tips

Format your response as follows:

Recipe Name: [recipe name here]
Category: [category]
Difficulty: [difficulty]
Time: [time] minutes
Servings: [servings]

Ingredients:
- [amount] [unit] [ingredient name]
- [amount] [unit] [ingredient name]
...

Instructions:
1. [first step]
2. [second step]
3. [third step]
...

Tags: [tag1], [tag2], [tag3], [tag4], [tag5]

Notes: [any helpful notes or tips]"""

        # Prepare messages in the format Qwen2-VL expects
        # Note: process_vision_info expects image paths or PIL Images in the messages
        print("Preparing model inputs...", file=sys.stderr)
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},  # Use PIL Image object
                    {"type": "text", "text": prompt_text}
                ]
            }
        ]
        
        # Process vision inputs using qwen_vl_utils (this extracts images from messages)
        print("Processing vision inputs...", file=sys.stderr)
        image_inputs, video_inputs = process_vision_info(messages)
        
        # Apply chat template to get text input (this formats the messages for the model)
        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        
        # Process all inputs together using the processor
        inputs = processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt"
        )
        inputs = inputs.to(model.device)
        
        # Generate response
        print("Starting generation...", file=sys.stderr)
        sys.stderr.flush()
        
        import time
        start_time = time.time()
        
        # Generate with appropriate parameters
        with torch.no_grad():
            generated_ids = model.generate(
                **inputs,
                max_new_tokens=1024,  # Increased to allow for complete, full steps
                do_sample=False,  # Use greedy decoding for more consistent results
                temperature=0.7,
                top_p=0.9
            )
        
        # Decode the response
        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = processor.batch_decode(
            generated_ids_trimmed,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False
        )[0]
        
        elapsed = time.time() - start_time
        print(f"Generated recipe in {elapsed:.1f} seconds ({elapsed/60:.1f} minutes)", file=sys.stderr)
        
        print(f"Generated output length: {len(output_text)} characters", file=sys.stderr)
        print(f"Generated output preview: {output_text[:500]}...", file=sys.stderr)
        print(f"Full generated output:\n{output_text}", file=sys.stderr)
        
        # Parse the output to extract structured recipe data
        recipe = parse_recipe_output(output_text, ingredients_list)
        
        print("Recipe generated successfully", file=sys.stderr)
        return recipe
        
    except Exception as e:
        print(f"Error during recipe generation: {str(e)}", file=sys.stderr)
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
        raise

def parse_recipe_output(output_text, ingredients_list):
    """
    Parse the AI-generated text into structured recipe format
    
    Args:
        output_text: Raw text output from the model
        ingredients_list: Original ingredients provided
    
    Returns:
        Structured recipe dictionary
    """
    # Try to extract structured information from the output
    lines = output_text.split('\n')
    
    # Initialize recipe structure
    recipe = {
        "title": "AI-Generated Recipe",
        "category": "Dinner",
        "difficulty": "Medium",
        "timeMinutes": 30,
        "servings": 4,
        "ingredients": [],
        "steps": [],
        "note": output_text[:2000] + "..." if len(output_text) > 2000 else output_text,  # Updated to match new limit
        "tags": ["ai-generated"]
    }
    
    # Extract title - prioritize first line as title (new format)
    title_extracted = False
    
    # Method 1: Use first non-empty line as title (new format has title first)
    for i, line in enumerate(lines[:10]):
        if not line.strip():
            continue
        line_lower = line.lower().strip()
        # Skip if it looks like a section header
        if any(keyword in line_lower for keyword in ["ingredients:", "steps:", "instructions:", "tags:", "category:", "difficulty:", "time:", "servings:"]):
            continue
        # Skip if it's just a number or very short
        if len(line.strip()) < 3:
            continue
        # Use this as title
        recipe["title"] = line.strip().strip('"').strip("'").strip()
        title_extracted = True
        break
    
    # Method 2: Look for "Recipe Name:" pattern (fallback for old format)
    if not title_extracted:
        for i, line in enumerate(lines[:15]):
            if not line.strip():
                continue
            line_lower = line.lower()
            if "recipe name:" in line_lower or "title:" in line_lower:
                # Extract text after the colon
                parts = line.split(':', 1)
                if len(parts) > 1:
                    title = parts[1].strip().strip('"').strip("'").strip()
                    if title:
                        recipe["title"] = title
                        title_extracted = True
                        break
                # Or check next line
                elif i + 1 < len(lines):
                    title = lines[i + 1].strip().strip('"').strip("'").strip()
                    if title and not any(keyword in title.lower() for keyword in ["category:", "difficulty:", "time:", "servings:", "ingredients:"]):
                        recipe["title"] = title
                        title_extracted = True
            break
    
    # Method 3: If still no title, generate one from category or default
    if not title_extracted or not recipe.get("title"):
        recipe["title"] = f"Delicious {recipe.get('category', 'Dish')} Recipe"
    
    # Extract ingredients
    ingredient_section = False
    for line in lines:
        line_lower = line.lower()
        
        # Check if we're in the ingredients section
        if "ingredients:" in line_lower or "ingredient:" in line_lower:
            ingredient_section = True
            continue
        
        # Check if we've moved to another section
        if ingredient_section:
            if any(keyword in line_lower for keyword in ["steps:", "instructions:", "directions:", "tags:", "category:", "difficulty:"]):
                break
        
        # Extract ingredients
        if ingredient_section:
            clean_line = line.strip().lstrip('-').lstrip('*').lstrip('•').strip()
            if clean_line and len(clean_line) > 2:
                # Try to split amount from ingredient
                parts = clean_line.split(',', 1)
                ingredient_text = parts[0].strip()
                recipe["ingredients"].append(ingredient_text)
    
    # If no ingredients were extracted, use the provided ingredients
    if not recipe["ingredients"]:
        recipe["ingredients"] = ingredients_list if ingredients_list else ["Various ingredients"]
    
    # Extract steps
    # Ensure we have at least some steps
    step_section = False
    step_num = 1
    seen_steps = set()  # Track seen steps to prevent duplicates
    
    for line in lines:
        line_lower = line.lower()
        
        # Check if we're in the steps section (prioritize "Steps:" as it's the new format)
        if any(keyword in line_lower for keyword in ["steps:", "instructions:", "directions:"]):
            step_section = True
            continue
        
        # Stop at other sections
        if step_section:
            if any(keyword in line_lower for keyword in ["notes:", "tips:", "serving:", "cooking time:", "tags:"]):
                break
        
        # Extract steps
        if step_section:
            # Try multiple patterns: "1. text", "(1) text", "- text", or just text after numbered
            clean_line = line.strip()
            # Remove leading number patterns
            import re
            clean_line = re.sub(r'^\d+\.\s*', '', clean_line)  # Remove "1. "
            clean_line = re.sub(r'^\(\d+\)\s*', '', clean_line)  # Remove "(1) "
            clean_line = clean_line.lstrip('-').lstrip('*').lstrip('•').strip()
            
            # Only add if the step is meaningful and not a duplicate
            if clean_line and len(clean_line) > 5:
                # Create a normalized version for duplicate detection (case-insensitive, first 50 chars)
                normalized = clean_line.lower().strip()[:50]
                
                # Check if this step is too similar to existing steps (prevent duplicates)
                is_duplicate = False
                for seen in seen_steps:
                    # Check if normalized versions are very similar (same start or contained within)
                    if normalized in seen or seen in normalized or normalized == seen:
                        is_duplicate = True
                        break
                    # Also check if they're very similar in length and content
                    if abs(len(normalized) - len(seen)) < 10:
                        # Simple similarity check - if first 30 chars match, likely duplicate
                        if normalized[:30] == seen[:30]:
                            is_duplicate = True
                            break
                
                if not is_duplicate:
                    recipe["steps"].append(clean_line)
                    seen_steps.add(normalized)
                step_num += 1
    
    # Remove any remaining duplicates (final cleanup)
    # Use a more sophisticated deduplication that preserves order
    unique_steps = []
    seen_unique = set()
    for step in recipe["steps"]:
        step_lower = step.lower().strip()
        # Check if this step is substantially different from ones we've seen
        is_unique = True
        for seen in seen_unique:
            # Check for exact matches or very similar content
            if step_lower == seen or (len(step_lower) > 20 and step_lower[:30] == seen[:30]):
                is_unique = False
                break
        if is_unique:
            unique_steps.append(step)
            seen_unique.add(step_lower[:50])  # Store first 50 chars for comparison
    
    recipe["steps"] = unique_steps
    
    # Ensure we have at least one step (fallback)
    # Steps should be strings (will be converted to objects by Node.js normalization)
    if not recipe["steps"]:
        recipe["steps"] = [
            "Prepare the ingredients shown in the image",
            "Follow the cooking method visible in the image",
            "Season to taste",
            "Cook until done",
            "Serve hot and enjoy"
        ]
        print("Using fallback steps (no steps extracted from output)", file=sys.stderr)
    
    # Extract category
    for line in lines[:20]:
        line_lower = line.lower()
        if "category:" in line_lower:
            category = line.split(':')[-1].strip()
            recipe["category"] = category.split()[0].capitalize()
            break
    
    # Extract difficulty
    for line in lines[:20]:
        line_lower = line.lower()
        if "difficulty:" in line_lower:
            difficulty = line.split(':')[-1].strip().capitalize()
            recipe["difficulty"] = difficulty
            break
    
    # Extract time
    for line in lines[:20]:
        line_lower = line.lower()
        if "time:" in line_lower or "minutes:" in line_lower:
            time_text = line.split(':')[-1].strip()
            # Try to extract numbers
            import re
            numbers = re.findall(r'\d+', time_text)
            if numbers:
                recipe["timeMinutes"] = int(numbers[0])
                break
    
    # Extract servings
    for line in lines[:20]:
        line_lower = line.lower()
        if "servings:" in line_lower or "serves:" in line_lower:
            servings_text = line.split(':')[-1].strip()
            import re
            numbers = re.findall(r'\d+', servings_text)
            if numbers:
                recipe["servings"] = int(numbers[0])
                break
    
    # Extract tags
    tag_section = False
    for line in lines:
        line_lower = line.lower()
        
        if "tags:" in line_lower or "tag:" in line_lower:
            tag_section = True
            # Also extract tags from the same line if present
            if ':' in line:
                tag_line = line.split(':', 1)[1].strip()
                if tag_line:
                    potential_tags = [t.strip().lower() for t in tag_line.split(',')]
                    for tag in potential_tags:
                        tag_clean = tag.strip().strip('"').strip("'").strip()
                        if tag_clean and len(tag_clean) > 2:
                            recipe["tags"].append(tag_clean)
            continue
        
        if tag_section:
            if any(keyword in line_lower for keyword in ["notes:", "tips:", "serving:", "note:"]):
                break
            
            # Extract tags (comma-separated or listed)
            if line.strip():
                clean_line = line.strip().lstrip('-').lstrip('*').lstrip('•').strip()
                if clean_line:
                    # Try to split by commas
                    potential_tags = [t.strip().lower() for t in clean_line.split(',')]
                    for tag in potential_tags:
                        tag_clean = tag.strip().strip('"').strip("'").strip()
                        if tag_clean and len(tag_clean) > 2:
                            recipe["tags"].append(tag_clean)
    
    # Generate additional tags based on recipe content if few or none found
    # Analyze the recipe to create relevant tags
    if len(recipe["tags"]) < 3:
        # Analyze ingredients for tags
        ingredients_text = ' '.join([str(ing) for ing in recipe.get("ingredients", [])]).lower()
        title_text = recipe.get("title", "").lower()
        description_text = output_text.lower()
        
        # Add category-based tag
        if recipe.get("category"):
            cat_tag = recipe["category"].lower()
            if cat_tag not in recipe["tags"]:
                recipe["tags"].append(cat_tag)
        
        # Analyze for cooking methods
        cooking_methods = ["baked", "grilled", "fried", "steamed", "roasted", "stir-fried", "braised", "sauteed", "boiled", "simmered"]
        for method in cooking_methods:
            if method in description_text or method in title_text:
                if method not in recipe["tags"]:
                    recipe["tags"].append(method)
                    break
        
        # Analyze for dietary info
        dietary_keywords = {
            "vegetarian": ["vegetable", "vegetarian", "no meat", "no chicken", "no beef"],
            "vegan": ["vegan", "no dairy", "no egg"],
            "spicy": ["spicy", "chili", "pepper", "hot", "cayenne"],
            "sweet": ["sweet", "sugar", "honey", "dessert", "cake"],
            "healthy": ["healthy", "low-calorie", "nutritious", "lean"],
            "quick": ["quick", "fast", "easy", "simple"],
            "comfort-food": ["comfort", "hearty", "warm"]
        }
        
        search_text = f"{title_text} {description_text} {ingredients_text}"
        for tag, keywords in dietary_keywords.items():
            if any(keyword in search_text for keyword in keywords):
                if tag not in recipe["tags"]:
                    recipe["tags"].append(tag)
                    break
        
        # Add time-based tag if applicable
        if recipe.get("timeMinutes"):
            if recipe["timeMinutes"] < 30 and "quick" not in recipe["tags"]:
                recipe["tags"].append("quick")
            elif recipe["timeMinutes"] > 60 and "slow-cook" not in recipe["tags"]:
                recipe["tags"].append("slow-cook")
        
        # Always add ai-generated
        if "ai-generated" not in recipe["tags"]:
            recipe["tags"].append("ai-generated")
    
    # Remove duplicates, empty strings, and clean up
    recipe["tags"] = [t for t in recipe["tags"] if t and len(t) > 2]
    recipe["tags"] = list(set(recipe["tags"]))[:10]  # Max 10 tags, remove duplicates
    
    return recipe

def main():
    parser = argparse.ArgumentParser(description='Generate recipe from image and ingredients')
    parser.add_argument('--image', required=True, help='Path to image file')
    parser.add_argument('--ingredients', required=True, help='JSON array of ingredients')
    parser.add_argument('--output', default='-', help='Output file (default: stdout)')
    
    args = parser.parse_args()
    
    # Parse ingredients
    try:
        ingredients = json.loads(args.ingredients)
    except json.JSONDecodeError:
        ingredients = []
    
    # Generate recipe
    try:
        recipe = generate_recipe(args.image, ingredients)
        
        # Output result as JSON
        output_json = json.dumps(recipe, indent=2)
        
        if args.output == '-':
            print(output_json)
        else:
            with open(args.output, 'w') as f:
                f.write(output_json)
        
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e)}, indent=2), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
