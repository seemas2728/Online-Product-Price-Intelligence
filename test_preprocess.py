from preprocess import preprocess_image

# give correct image name (exact file name)
image_path = "Tom And Jerry Meme.jpg"

processed = preprocess_image(image_path)

print("Image preprocessing successful")
print("Shape:", processed.shape)
print("Preprocessing pipeline working correctly ✅")

