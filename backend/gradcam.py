import torch
import numpy as np
from PIL import Image
from torchvision import transforms
import base64
from io import BytesIO
import matplotlib.pyplot as plt
import matplotlib.cm as cm

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

def generate_gradcam(model, image: Image.Image) -> str:
    tensor       = transform(image).unsqueeze(0)
    target_layer = model.features[-1]
    gradients    = []
    activations  = []

    def save_gradient(grad):
        gradients.append(grad)

    def forward_hook(module, input, output):
        activations.append(output)
        output.register_hook(save_gradient)

    handle = target_layer.register_forward_hook(forward_hook)

    output = model(tensor)
    pred   = output.argmax(dim=1)
    model.zero_grad()
    output[0, pred].backward()
    handle.remove()

    grad = gradients[0].squeeze().mean(dim=(1, 2))
    act  = activations[0].squeeze()
    cam  = torch.zeros(act.shape[1:])

    for i, w in enumerate(grad):
        cam += w * act[i]

    cam = torch.relu(cam)
    cam -= cam.min()
    if cam.max() != 0:
        cam /= cam.max()

    cam_np  = cam.detach().numpy()
    cam_img = Image.fromarray((cam_np * 255).astype(np.uint8)).resize(
        image.size, Image.BILINEAR
    )

    colormap = cm.get_cmap("jet")
    heatmap  = colormap(np.array(cam_img) / 255.0)
    heatmap  = (heatmap[:, :, :3] * 255).astype(np.uint8)
    heatmap  = Image.fromarray(heatmap)
    blended  = Image.blend(image.convert("RGB"), heatmap, alpha=0.4)

    buffer  = BytesIO()
    blended.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"