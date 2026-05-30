from PIL import Image
import os

logo_path = r"C:\Users\dames\.gemini\antigravity\brain\89c5e20d-2621-4d90-a8aa-5332e28a7210\lingopeak_logo_1780112889288.png"
dest_ico = r"C:\Users\dames\.gemini\antigravity\scratch\lingopeak\public\favicon.ico"

try:
    if os.path.exists(logo_path):
        img = Image.open(logo_path)
        img.save(dest_ico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
        print("SUCCESS: Favicon created at public/favicon.ico")
    else:
        print(f"ERROR: Logo path not found: {logo_path}")
except Exception as e:
    print(f"ERROR: {e}")
