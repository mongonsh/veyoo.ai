from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import time
import google.generativeai as genai
from google.cloud import storage
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set.")
genai.configure(api_key=GEMINI_API_KEY)

# Configure Google Cloud Storage
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")
if not GCS_BUCKET_NAME:
    raise ValueError("GCS_BUCKET_NAME environment variable not set.")
storage_client = storage.Client()
bucket = storage_client.bucket(GCS_BUCKET_NAME)

@app.post("/images")
def create_image():
    # Placeholder for calling Imagen API
    # model = ImageGenerationModel.from_pretrained("imagegeneration@005")
    # images = model.generate_images(prompt="a poster for a career in software engineering")
    return {"message": "Image created"}

@app.post("/generate-video")
async def generate_video(prompt: str):
    try:
        print(f"Generating video for prompt: {prompt}")
        model = genai.get_model("veo-3.0-generate-001")
        
        operation = model.generate_videos(
            prompt=prompt,
            duration_seconds=8, # Veo 3 models support 4, 6, or 8 seconds
            aspect_ratio="16:9",
            generate_audio=True,
        )

        print("Waiting for video generation to complete...")
        while not operation.done:
            print("Still processing... waiting 10 seconds.")
            time.sleep(10)
            operation = genai.get_default_retriever().operations.get(operation) # Corrected way to get operation status

        if operation.response and operation.response.generated_videos:
            generated_video = operation.response.generated_videos[0]
            
            # Save video to a temporary file
            temp_video_path = f"/tmp/generated_video_{int(time.time())}.mp4"
            generated_video.video.save(temp_video_path)

            # Upload to GCS
            destination_blob_name = f"videos/{os.path.basename(temp_video_path)}"
            blob = bucket.blob(destination_blob_name)
            blob.upload_from_filename(temp_video_path)
            
            # Make the blob publicly accessible (adjust permissions as needed)
            blob.make_public()
            public_url = blob.public_url
            
            os.remove(temp_video_path) # Clean up temp file

            print(f"Generated video public URL: {public_url}")
            return {"video_url": public_url}
        else:
            error_message = "Video generation failed or no video was returned."
            if operation.error:
                error_message += f" Error: {operation.error.message}"
            print(error_message)
            raise HTTPException(status_code=500, detail=error_message)

    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))
