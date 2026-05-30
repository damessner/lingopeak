from PIL import Image
import os

logo_path = r"C:\Users\dames\.gemini\antigravity\brain\89c5e20d-2621-4d90-a8aa-5332e28a7210\lingopeak_logo_1780112889288.png"
dest_png = r"C:\Users\dames\.gemini\antigravity\scratch\lingopeak\public\icons\icon-512-maskable.png"

try:
    if os.path.exists(logo_path):
        img = Image.open(logo_path)
        
        # Solid background matching the theme background color (#090d16)
        bg_color = (9, 13, 22)  # #090d16
        
        # Scale the logo to occupy 60% of the 512x512 box to keep it safely within the PWA maskable safe zone
        target_size = int(512 * 0.6)
        img.thumbnail((target_size, target_size), Image.Resampling.LANCZOS)
        
        # Create background image
        bg = Image.new("RGBA", (512, 512), bg_color + (255,))
        
        # Paste logo centered
        x = (512 - img.width) // 2
        y = (512 - img.height) // 2
        bg.paste(img, (x, y), img if img.mode == 'RGBA' else None)
        
        # Save as PNG
        bg.save(dest_png, format="PNG")
        print("SUCCESS: 512x512 maskable icon created.")
    else:
        print(f"ERROR: Logo path not found: {logo_path}")
except Exception as e:
    print(f"ERROR: {e}")
