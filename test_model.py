from model import predict_image

result = predict_image("Tom And Jerry Meme.jpg")

print("Product:", result["product"])
print("Confidence:", result["confidence"])

