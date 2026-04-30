"""Generate NightShift app icons"""
from PIL import Image, ImageDraw, ImageFont
import os

ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'electron', 'assets')
os.makedirs(ASSETS_DIR, exist_ok=True)

def create_icon(size=256):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle
    margin = size // 16
    draw.ellipse([margin, margin, size - margin, size - margin], 
                 fill='#1a1a2e', outline='#16213e', width=size//64)
    
    # Moon shape
    cx, cy = size // 2, size // 2
    moon_r = size // 5
    draw.ellipse([cx - moon_r, cy - moon_r, cx + moon_r, cy + moon_r],
                 fill='#e94560')
    
    # Stars
    star_positions = [
        (size // 4, size // 4),
        (3 * size // 4, size // 3),
        (size // 3, 3 * size // 4),
        (2 * size // 3, size // 5),
    ]
    for sx, sy in star_positions:
        star_r = size // 32
        draw.ellipse([sx - star_r, sy - star_r, sx + star_r, sy + star_r],
                     fill='#f5f5f5')
    
    return img

# Generate PNG icon
png_icon = create_icon(256)
png_icon.save(os.path.join(ASSETS_DIR, 'icon.png'))
print('Created icon.png')

# Generate ICO (256x256 is supported in modern Windows)
png_icon.save(os.path.join(ASSETS_DIR, 'icon.ico'))
print('Created icon.ico')

# Generate ICNS-like PNG for Mac reference
png_icon.save(os.path.join(ASSETS_DIR, 'icon.icns.png'))
print('Created icon.icns.png')

print('All icons generated successfully!')
