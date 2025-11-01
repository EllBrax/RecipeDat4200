#!/usr/bin/env python3
"""
AI Recipe Generation using Hugging Face Transformers
Uses Qwen2.5-VL-3B-Instruct model for image-text-to-text generation
"""

import sys
import json
import argparse
from pathlib import Path
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from PIL import Image

def generate_recipe(image_path, ingredients_list):
    """
    Generate a recipe from an image and ingredients using Qwen2.5-VL-3B-Instruct
    
    Args:
        image_path: Path to the image file
        ingredients_list: List of ingredients
    
    Returns:
        Dictionary with recipe details
    """
    try:
        # Initialize model and processor
        print("Loading model...", file=sys.stderr)
        model = Qwen2VLForConditionalGeneration.from_pretrained(
            "Qwen/Qwen2.5-VL-3B-Instruct",
            device_map="auto"
        )
        processor = AutoProcessor.from_pretrained("Qwen/Qwen2.5-VL-3B-Instruct")
        
        # Load and prepare image
        print(f"Processing image: {image_path}", file=sys.stderr)
        image = Image.open(image_path).convert('RGB')
        
        # Prepare ingredients text
        ingredients_text = ", ".join(ingredients_list) if ingredients_list else "available ingredients"
        
        # Create the prompt
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

        # Prepare messages for the model
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": prompt_text}
                ]
            }
        ]
        
        # Process inputs
        print("Processing inputs...", file=sys.stderr)
        text_prompt = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        image_inputs, video_inputs = processor.process_vision_info(messages)
        
        inputs = processor(
            text=[text_prompt],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt"
        ).to(model.device)
        
        # Generate response
        print("Generating recipe...", file=sys.stderr)
        generated_ids = model.generate(**inputs, max_new_tokens=1024)
        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        
        # Decode response
        output_text = processor.batch_decode(
            generated_ids_trimmed,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False
        )[0]
        
        # Parse the output to extract structured recipe data
        recipe = parse_recipe_output(output_text, ingredients_list)
        
        print("Recipe generated successfully", file=sys.stderr)
        return recipe
        
    except Exception as e:
        print(f"Error during recipe generation: {str(e)}", file=sys.stderr)
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
        "note": output_text[:500] + "..." if len(output_text) > 500 else output_text,
        "tags": ["ai-generated"]
    }
    
    # Extract title (usually first line or after "Recipe Name:")
    for i, line in enumerate(lines[:10]):
        if not line.strip():
            continue
        if "recipe name:" in line.lower() and i + 1 < len(lines):
            recipe["title"] = lines[i + 1].strip().strip('"').strip("'")
            break
        elif i == 0 and line.strip() and not line.startswith('#'):
            recipe["title"] = line.strip().strip('"').strip("'")
    
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
            if any(keyword in line_lower for keyword in ["steps:", "instructions:", "directions:", "category:", "difficulty:"]):
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
    step_section = False
    step_num = 1
    for line in lines:
        line_lower = line.lower()
        
        # Check if we're in the steps section
        if any(keyword in line_lower for keyword in ["steps:", "instructions:", "directions:"]):
            step_section = True
            continue
        
        # Stop at other sections
        if step_section:
            if any(keyword in line_lower for keyword in ["notes:", "tips:", "serving:", "cooking time:"]):
                break
        
        # Extract steps
        if step_section:
            clean_line = line.strip().lstrip(f'{step_num}.').lstrip(f'({step_num})').lstrip('-').lstrip('*').lstrip('•').strip()
            if clean_line and len(clean_line) > 5:
                recipe["steps"].append(clean_line)
                step_num += 1
    
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
            continue
        
        if tag_section:
            if any(keyword in line_lower for keyword in ["notes:", "tips:", "serving:"]):
                break
            
            # Extract tags (comma-separated or listed)
            if line.strip():
                clean_line = line.strip().lstrip('-').lstrip('*').lstrip('•').strip()
                if clean_line:
                    # Try to split by commas
                    potential_tags = [t.strip().lower() for t in clean_line.split(',')]
                    for tag in potential_tags:
                        if tag and len(tag) > 2:
                            recipe["tags"].append(tag)
    
    # Generate additional tags if few or none found
    if len(recipe["tags"]) < 2:
        # Add category-based tag
        if recipe["category"]:
            recipe["tags"].append(recipe["category"].lower())
        # Add difficulty-based tag
        if recipe["difficulty"]:
            recipe["tags"].append(recipe["difficulty"].lower())
        # Add time-based tag
        if recipe["timeMinutes"]:
            if recipe["timeMinutes"] < 30:
                recipe["tags"].append("quick")
            elif recipe["timeMinutes"] > 60:
                recipe["tags"].append("slow-cook")
        # Always add ai-generated
        recipe["tags"].append("ai-generated")
    
    # Remove duplicates and clean up
    recipe["tags"] = list(set(recipe["tags"]))[:10]  # Max 10 tags
    
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
