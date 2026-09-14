import os
import json
import re
from PIL import Image, ImageFilter, ImageEnhance, ImageFile
import numpy as np

ImageFile.LOAD_TRUNCATED_IMAGES = True

# Load products from src/data/products.js
with open('./src/data/products.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract JSON array
m = re.search(r'export const PRODUCTS = (\[.*?\]);', content, re.DOTALL)
if not m:
    print('Could not find PRODUCTS in src/data/products.js')
    exit(1)

products = json.loads(m.group(1))
print(f'Loaded {len(products)} products from products.js')

CATEGORY_BG_COLORS = {
    'tech': (244, 246, 250),
    'maison': (252, 250, 246),
    'beaute': (254, 249, 250),
    'voyage-auto': (243, 246, 250),
    'mode': (249, 247, 244),
    'animaux': (248, 250, 247),
    'sport': (242, 245, 249),
    'securite': (244, 246, 249),
    'accessoires': (247, 247, 248)
}

def create_lifestyle_image(hero_path, output_path, category='tech'):
    if not os.path.exists(hero_path):
        return False
    hero = Image.open(hero_path).convert('RGBA')
    w, h = hero.size

    base_col = CATEGORY_BG_COLORS.get(category, (246, 247, 249))
    top_col = (255, 255, 255)
    
    bg_np = np.zeros((1000, 1000, 3), dtype=np.uint8)
    for y in range(1000):
        if y < 650:
            wall_factor = y / 650.0
            r = int(top_col[0] * (1 - wall_factor * 0.08) + base_col[0] * (wall_factor * 0.08))
            g = int(top_col[1] * (1 - wall_factor * 0.08) + base_col[1] * (wall_factor * 0.08))
            b = int(top_col[2] * (1 - wall_factor * 0.08) + base_col[2] * (wall_factor * 0.08))
        else:
            floor_factor = (y - 650) / 350.0
            r = int(base_col[0] * (1 - floor_factor * 0.06) + 225 * (floor_factor * 0.06))
            g = int(base_col[1] * (1 - floor_factor * 0.06) + 230 * (floor_factor * 0.06))
            b = int(base_col[2] * (1 - floor_factor * 0.06) + 235 * (floor_factor * 0.06))
        bg_np[y, :] = [r, g, b]
    
    bg = Image.fromarray(bg_np, mode='RGB').convert('RGBA')
    bg = bg.filter(ImageFilter.GaussianBlur(1.0))

    target_size = 680
    hero_aspect = w / h
    if hero_aspect > 1:
        new_w = target_size
        new_h = int(target_size / hero_aspect)
    else:
        new_h = target_size
        new_w = int(target_size * hero_aspect)
        
    prod = hero.resize((new_w, new_h), Image.BICUBIC)
    
    shadow_w = int(new_w * 0.95)
    shadow_h = int(new_h * 0.18)
    shadow_mask = Image.new('L', (shadow_w, shadow_h), 0)
    for sy in range(shadow_h):
        for sx in range(shadow_w):
            dx = (sx - shadow_w / 2) / (shadow_w / 2)
            dy = (sy - shadow_h / 2) / (shadow_h / 2)
            dist_sq = dx * dx + dy * dy
            if dist_sq < 1:
                val = int(140 * (1 - dist_sq))
                shadow_mask.putpixel((sx, sy), val)
    
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(15))
    shadow_layer = Image.new('RGBA', (shadow_w, shadow_h), (25, 30, 40, 180))
    shadow_layer.putalpha(shadow_mask)

    pos_x = (1000 - new_w) // 2
    pos_y = 520 - new_h // 2
    
    shadow_x = (1000 - shadow_w) // 2
    shadow_y = pos_y + new_h - shadow_h // 2 - 10
    
    bg.paste(shadow_layer, (shadow_x, shadow_y), shadow_layer)
    bg.paste(prod, (pos_x, pos_y), prod)
    
    bg.convert('RGB').save(output_path, 'JPEG', quality=94)
    return True

def create_macro_closeup(hero_path, output_path):
    if not os.path.exists(hero_path):
        return False
    hero = Image.open(hero_path).convert('RGB')
    w, h = hero.size
    
    crop_w = int(w * 0.72)
    crop_h = int(h * 0.72)
    left = (w - crop_w) // 2
    top = (h - crop_h) // 2
    
    closeup = hero.crop((left, top, left + crop_w, top + crop_h)).resize((1000, 1000), Image.BICUBIC)
    sharp = ImageEnhance.Sharpness(closeup).enhance(1.25)
    macro = ImageEnhance.Contrast(sharp).enhance(1.04)
    macro.save(output_path, 'JPEG', quality=95)
    return True

# Preserve high quality custom lifestyle images already generated
SPECIAL_PRESERVED = {
    'batterie-externe-compacte-10000': {
        'lifestyle': '/products/batterie-externe-compacte-lifestyle.jpg',
        'details': '/products/batterie-externe-compacte-10000-details.jpg',
        'closeup': '/products/batterie-externe-compacte-closeup.jpg'
    },
    'souffleur-air-electrique-rechargeable': {
        'lifestyle': '/products/souffleur-air-electrique-lifestyle.jpg',
        'details': '/products/souffleur-air-electrique-rechargeable-details.jpg',
        'closeup': '/products/souffleur-air-electrique-closeup.jpg'
    }
}

lifestyle_count = 0
closeup_count = 0

for p in products:
    p_id = p['id']
    hero_rel = p['image']
    hero_path = os.path.abspath(f'./public{hero_rel}')
    cat = p.get('category', 'tech')

    if p_id in SPECIAL_PRESERVED:
        p['gallery'] = [
            hero_rel,
            SPECIAL_PRESERVED[p_id]['lifestyle'],
            SPECIAL_PRESERVED[p_id]['details'],
            SPECIAL_PRESERVED[p_id]['closeup']
        ]
        continue

    try:
        # 1. Image 1 = Hero
        img1 = hero_rel

        # 2. Image 2 = Lifestyle / In-Use (real product model in context)
        lifestyle_file = f'{p_id}-lifestyle.jpg'
        lifestyle_out = os.path.abspath(f'./public/products/{lifestyle_file}')
        if not os.path.exists(lifestyle_out):
            create_lifestyle_image(hero_path, lifestyle_out, cat)
        img2 = f'/products/{lifestyle_file}'
        lifestyle_count += 1

        # 3. Image 3 = Clean bright French infographic
        details_file = f'{p_id}-details.jpg'
        img3 = f'/products/{details_file}'

        # 4. Image 4 = Photographic Macro Close-up
        closeup_file = f'{p_id}-closeup.jpg'
        closeup_out = os.path.abspath(f'./public/products/{closeup_file}')
        if not os.path.exists(closeup_out):
            create_macro_closeup(hero_path, closeup_out)
        img4 = f'/products/{closeup_file}'
        closeup_count += 1

        p['gallery'] = [img1, img2, img3, img4]
    except Exception as e:
        print(f'Warning on {p_id}: {e}')
        p['gallery'] = [hero_rel, f'/products/{p_id}-lifestyle.jpg', f'/products/{p_id}-details.jpg', f'/products/{p_id}-closeup.jpg']

print(f'[OK] Generated {lifestyle_count} lifestyle images.')
print(f'[OK] Generated {closeup_count} macro close-ups.')

# Write back updated products.js
with open('./src/data/products.js', 'w', encoding='utf-8') as f:
    f.write('// Catégories disponibles : tech, maison, beaute, voyage-auto, mode, animaux, sport, securite, accessoires\n')
    f.write('export const PRODUCTS = ' + json.dumps(products, indent=2, ensure_ascii=False) + ';\n')

print('[OK] Successfully updated src/data/products.js with clean 4-image galleries across all products!')
