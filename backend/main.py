from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io, json, os
from datetime import datetime

from model import load_model, predict
from gradcam import generate_gradcam

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ANALYSES_FILE = "analyses.json"
USERS_FILE    = "users.json"

def load_analyses():
    if not os.path.exists(ANALYSES_FILE):
        return []
    with open(ANALYSES_FILE, "r") as f:
        return json.load(f)

def save_analyses(data):
    with open(ANALYSES_FILE, "w") as f:
        json.dump(data, f, indent=2)

def load_users():
    if not os.path.exists(USERS_FILE):
        return [
            {"username": "admin",  "password": "admin123",  "role": "admin"},
            {"username": "doctor1","password": "doctor123", "role": "doctor"},
            {"username": "patient1","password":"patient123","role": "patient"},
        ]
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(data):
    with open(USERS_FILE, "w") as f:
        json.dump(data, f, indent=2)

print("Loading model...")
model = load_model("skin_disease_model.pth")
print("Model ready!")

@app.get("/")
def root():
    return {"status": "Skin Disease API is running"}

@app.post("/login")
async def login(body: dict):
    users = load_users()
    for u in users:
        if u["username"] == body.get("username") and u["password"] == body.get("password"):
            return {"success": True, "role": u["role"], "username": u["username"]}
    return {"success": False}

@app.post("/predict")
async def predict_disease(file: UploadFile = File(...), username: str = "unknown"):
    contents = await file.read()
    image    = Image.open(io.BytesIO(contents)).convert("RGB")
    predictions = predict(model, image)
    heatmap     = generate_gradcam(model, image)
    analysis = {
        "id":          datetime.now().strftime("%Y%m%d%H%M%S"),
        "username":    username,
        "date":        datetime.now().strftime("%Y-%m-%d %H:%M"),
        "predictions": predictions,
        "heatmap":     heatmap,
        "comment":     "",
        "urgency":     "",
        "rating":      0,
        "feedback":    ""
    }
    db = load_analyses()
    db.append(analysis)
    save_analyses(db)
    return {"id": analysis["id"], "predictions": predictions, "heatmap": heatmap}

@app.get("/analyses")
def get_all_analyses():
    return load_analyses()

@app.get("/analyses/{username}")
def get_user_analyses(username: str):
    db = load_analyses()
    return [a for a in db if a["username"] == username]

@app.post("/comment/{analysis_id}")
async def add_comment(analysis_id: str, body: dict):
    db = load_analyses()
    for a in db:
        if a["id"] == analysis_id:
            a["comment"] = body.get("comment", "")
            a["urgency"] = body.get("urgency", "")
            save_analyses(db)
            return {"status": "Comment saved"}
    return {"error": "Not found"}

@app.post("/rating/{analysis_id}")
async def add_rating(analysis_id: str, body: dict):
    db = load_analyses()
    for a in db:
        if a["id"] == analysis_id:
            a["rating"]   = body.get("rating", 0)
            a["feedback"] = body.get("feedback", "")
            save_analyses(db)
            return {"status": "Rating saved"}
    return {"error": "Not found"}

@app.delete("/analyses/{analysis_id}")
def delete_analysis(analysis_id: str):
    db = load_analyses()
    db = [a for a in db if a["id"] != analysis_id]
    save_analyses(db)
    return {"status": "Deleted"}

@app.get("/users")
def get_users():
    users = load_users()
    return [{"username": u["username"], "role": u["role"]} for u in users]

@app.post("/users")
async def add_user(body: dict):
    users = load_users()
    for u in users:
        if u["username"] == body.get("username"):
            return {"error": "Username already exists"}
    users.append({
        "username": body.get("username"),
        "password": body.get("password"),
        "role":     body.get("role", "patient")
    })
    save_users(users)
    return {"status": "User created"}

@app.delete("/users/{username}")
def delete_user(username: str):
    users = load_users()
    users = [u for u in users if u["username"] != username]
    save_users(users)
    return {"status": "Deleted"}

@app.get("/stats")
def get_stats():
    db    = load_analyses()
    users = load_users()
    ratings = [a["rating"] for a in db if a.get("rating", 0) > 0]
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
    return {
        "total_analyses": len(db),
        "total_patients": len([u for u in users if u["role"] == "patient"]),
        "total_doctors":  len([u for u in users if u["role"] == "doctor"]),
        "avg_rating":     avg_rating,
        "urgent_count":   len([a for a in db if a.get("urgency") == "urgent"]),
        "normal_count":   len([a for a in db if a.get("urgency") == "normal"]),
    }