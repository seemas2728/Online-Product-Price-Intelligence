import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(os.path.join(parent_dir, "backend"))

from preprocess import preprocess_image

image_path = os.path.join(parent_dir, "Tom And Jerry Meme.jpg")

processed = preprocess_image(image_path)

print("Image preprocessing successful")
print("Shape:", processed.shape)
print("Preprocessing pipeline working correctly ✅")
