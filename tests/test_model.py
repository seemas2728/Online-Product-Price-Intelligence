import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(os.path.join(parent_dir, "backend"))

from model import predict_image

image_path = os.path.join(parent_dir, "Tom And Jerry Meme.jpg")
result = predict_image(image_path)

print("Product:", result["product"])
print("Confidence:", result["confidence"])
