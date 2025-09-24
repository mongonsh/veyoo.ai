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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # Vertex AI Studio API key

@app.post("/generate-video")
async def generate_video(payload: dict):
    """
    If IMAGEN_SERVICE_URL is set, proxy to that service's /generate-video.
    Otherwise, call Vertex AI (Gemini) streamGenerateContent with GEMINI_API_KEY
    and aggregate streamed text into a single string. Returns JSON with fields:
      { "text": <aggregated_text>, "video_url": null }
    """
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Missing 'prompt'")

    # Prefer proxy if configured
    if IMAGEN_SERVICE_URL:
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(f"{IMAGEN_SERVICE_URL}/generate-video", json={"prompt": prompt})
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Fallback: Vertex AI direct call using API key (no auth headers required)
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")

    url = (
        "https://aiplatform.googleapis.com/v1/publishers/google/models/"
        "gemini-2.5-flash-lite:streamGenerateContent?key=" + GEMINI_API_KEY
    )
    request_json = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ]
    }

    try:
        aggregated_text = ""
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", url, json=request_json, headers={"Content-Type": "application/json"}) as r:
                r.raise_for_status()
                async for line in r.aiter_lines():
                    if not line:
                        continue
                    # Expect lines like: "data: {json}"
                    if line.startswith("data:"):
                        data_str = line[len("data:"):].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            import json as _json
                            obj = _json.loads(data_str)
                            # Extract text parts if present
                            candidates = obj.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                for p in parts:
                                    if "text" in p:
                                        aggregated_text += p["text"]
                        except Exception:
                            # Ignore malformed chunks
                            pass
        return {"text": aggregated_text, "video_url": None}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))