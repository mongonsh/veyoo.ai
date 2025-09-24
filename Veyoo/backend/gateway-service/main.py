from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx

app = FastAPI()

# Allow frontend on Vercel (adjust or add more origins as needed)
origins = [
    "https://veyoo-ai.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def read_root():
    return {"message": "Gateway Service"}

IMAGEN_SERVICE_URL = os.getenv("IMAGEN_SERVICE_URL")  # e.g., https://imagen-service-xxxx-uc.a.run.app

@app.post("/generate-video")
async def generate_video(payload: dict):
    if not IMAGEN_SERVICE_URL:
        raise HTTPException(status_code=500, detail="IMAGEN_SERVICE_URL is not configured")
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(f"{IMAGEN_SERVICE_URL}/generate-video", json=payload)
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))