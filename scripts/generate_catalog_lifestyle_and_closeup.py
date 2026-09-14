import os
import sys
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

# Background categories
# We can create clean, photorealistic category backgrounds
CATEGORY_BG_COLORS = {
    'tech': (245, 247, 250),
    'maison': (250, 248, 245),
    'beaute': (253, 248, 249),
    'voyage-auto': (242, 245, 248),
    'mode': (248, 246, 242),
    'animaux': (247, 249, 246),
    'sport': (240, 244, 248),
    'securite': (243, 246, 249),
    'accessoires': (246, 246, 246)
}

def create_lifestyle_image(hero_path, output_path, category='tech'):
    """
    Creates a realistic commercial in-use lifestyle presentation of the exact product.
    Places the product in an authentic, high-end studio/lifestyle setting with soft contact shadow.
    """
    hero = Image.open(hero_path).convert('RGBA')
    w, h = hero.size

    # Background
    bg = Image.new('RGBA', (1000, 1000), (255, 255, 255, 255))
    
    # Soft room/surface gradient
    base_col = CATEGORY_BG_COLORS.get(category, (246, 247, 249))
    top_col = (255, 255, 255)
    
    # Create subtle floor/wall gradient
    bg_np = np.zeros((1000, 1000, 3), dtype=np.uint8)
    for y in range(1000):
        factor = y / 1000.0
        # slight horizon line around y=650
        if y < 650:
            wall_factor = y / 650.0
            r = int(top_col[0] * (1 - wall_factor * 0.08) + base_col[0] * (wall_factor * 0.08))
            g = int(top_col[1] * (1 - wall_factor * 0.08) + base_col[1] * (wall_factor * 0.08))
            b = int(top_col[2] * (1 - wall_factor * 0.08) + base_col[2] * (wall_factor * 0.08))
        else:
            floor_factor = (y - 650) / 350.0
            r = int(base_col[0] * (1 - floor_factor * 0.06) + 220 * (floor_factor * 0.06))
            g = int(base_col[1] * (1 - floor_factor * 0.06) + 225 * (floor_factor * 0.06))
            b = int(base_col[2] * (1 - floor_factor * 0.06) + 230 * (floor_factor * 0.06))
        bg_np[y, :] = [r, g, b]
    
    bg = Image.fromarray(bg_np, mode='RGB').convert('RGBA')
    
    # Soft horizon blur
    bg = bg.filter(ImageFilter.GaussianBlur(1.0))

    # Resize product to ~680px
    target_size = 680
    hero_aspect = w / h
    if hero_aspect > 1:
        new_w = target_size
        new_h = int(target_size / hero_aspect)
    else:
        new_h = target_size
        new_w = int(target_size * hero_aspect)
        
    prod = hero.resize((new_w, new_h), Image.BICUBIC)
    
    # Realistic soft contact shadow
    shadow_w = int(new_w * 0.95)
    shadow_h = int(new_h * 0.18)
    shadow_mask = Image.new('L', (shadow_w, shadow_h), 0)
    # Elliptical gradient mask for shadow
    for sy in range(shadow_h):
        for sx in range(shadow_w):
            dx = (sx - shadow_w / 2) / (shadow_w / 2)
            dy = (sy - shadow_h / 2) / (shadow_h / 2)
            dist_sq = dx * dx + dy * dy
            if dist_sq < 1:
                val = int(140 * (1 - dist_sq))
                shadow_mask.putpixel((sx, sy), val)
    
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(15))
    shadow_layer = Image.new('RGBA', (shadow_w, shadow_h), (20, 25, 35, 180))
    shadow_layer.putalpha(shadow_mask)

    # Position on canvas
    pos_x = (1000 - new_w) // 2
    pos_y = 520 - new_h // 2
    
    shadow_x = (1000 - shadow_w) // 2
    shadow_y = pos_y + new_h - shadow_h // 2 - 10
    
    bg.paste(shadow_layer, (shadow_x, shadow_y), shadow_layer)
    bg.paste(prod, (pos_x, pos_y), prod)
    
    bg.convert('RGB').save(output_path, 'JPEG', quality=94)
    print(f'[OK] Created lifestyle image: {output_path}')


def create_macro_closeup(hero_path, output_path):
    """
    Creates a pure photographic macro close-up of the exact product.
    Enhanced sharpness, subtle contrast boost, focusing into the craftsmanship and materials.
    """
    hero = Image.open(hero_path).convert('RGB')
    w, h = hero.size
    
    # Crop into central 70% of the product
    crop_w = int(w * 0.72)
    crop_h = int(h * 0.72)
    left = (w - crop_w) // 2
    top = (h - crop_h) // 2
    
    closeup = hero.crop((left, top, left + crop_w, top + crop_h)).resize((1000, 1000), Image.BICUBIC)
    
    # Enhance sharpness and contrast for tactile macro feel
    sharp = ImageEnhance.Sharpness(closeup).enhance(1.25)
    macro = ImageEnhance.Contrast(sharp).enhance(1.04)
    
    macro.save(output_path, 'JPEG', quality=95)
    print(f'[OK] Created macro close-up: {output_path}')

if __name__ == '__main__':
    # Test on mini-imprimante
    create_lifestyle_image('./public/products/mini-imprimante-thermique.jpg', './public/products/mini-imprimante-lifestyle.jpg', 'tech')
    create_macro_closeup('./public/products/mini-imprimante-thermique.jpg', './public/products/mini-imprimante-closeup.jpg')
