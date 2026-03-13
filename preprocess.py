import cv2
import numpy as np

# 1. Read Image
def load_image(path):
    image = cv2.imread(path)
    return image

# 2. Convert to RGB
def convert_to_rgb(image):
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# 3. Resize Image (224x224)
def resize_image(image, size=(224, 224)):
    return cv2.resize(image, size)

# 4. Noise Reduction (Gaussian Blur)
def remove_noise(image):
    return cv2.GaussianBlur(image, (5, 5), 0)

# 5. Normalize Image (0 to 1)
def normalize_image(image):
    return image / 255.0

# 6. Brightness & Contrast Adjustment
def enhance_image(image):
    alpha = 1.5   # contrast
    beta = 30     # brightness
    return cv2.convertScaleAbs(image, alpha=alpha, beta=beta)

# 7. Full Pipeline
def preprocess_image(path):
    image = load_image(path)
    
    if image is None:
        raise ValueError("Image not found")

    image = convert_to_rgb(image)
    image = resize_image(image)
    image = remove_noise(image)
    image = enhance_image(image)
    image = normalize_image(image)

    return image
