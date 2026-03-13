import torch
import torchvision.models as models
import torchvision.transforms as transforms
from torchvision.models import MobileNet_V2_Weights
from PIL import Image

# Load pretrained model
weights = MobileNet_V2_Weights.DEFAULT
model = models.mobilenet_v2(weights=weights)
model.eval()

# Get class labels
class_names = weights.meta["categories"]

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

def predict_image(image_path):
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(image)

    probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
    confidence, predicted_class = torch.max(probabilities, 0)

    return {
        "product": class_names[predicted_class],
        "confidence": float(confidence)
    }

