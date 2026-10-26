import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from PIL import Image

CLASS_NAMES = [
    "Eczema Photos",
    "Exanthems And Drug Eruptions",
    "Melanoma Skin Cancer Nevi And Moles",
    "Nail Fungus And Other Nail Disease",
]

NUM_CLASSES = len(CLASS_NAMES)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

def load_model(path="skin_disease_model.pth"):
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(1280, NUM_CLASSES)
    model.load_state_dict(torch.load(path, map_location="cpu"))
    model.eval()
    return model

def predict(model, image: Image.Image):
    tensor = transform(image).unsqueeze(0)
    with torch.no_grad():
        probs = torch.nn.functional.softmax(model(tensor)[0], dim=0)
    top3 = torch.topk(probs, 3)
    return [
        {
            "disease":    CLASS_NAMES[top3.indices[i].item()],
            "confidence": round(top3.values[i].item() * 100, 2)
        }
        for i in range(3)
    ]