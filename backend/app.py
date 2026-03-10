from fastapi import FastAPI
from fastapi.responses import FileResponse,StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from pydantic import BaseModel
from typing import Optional
import edge_tts
import uuid
import os
import asyncio

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://172.16.50.24:3000","http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def speed_to_rate(speed: float) -> str:
    # 1.0 → +0%
    # 1.25 → +25%
    # 0.75 → -25%
    percent = int((speed - 1.0) * 100)
    sign = "+" if percent >= 0 else ""
    return f"{sign}{percent}%"



OUTPUT_DIR = "generated_audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)


class TTSRequest(BaseModel):
    text: str
    language: str
    voice: Optional[str] = None
    speed: Optional[float] = 1.0
    pitch: Optional[str] = "+0Hz"   

# Language -> Voice mapping
VOICE_MAP = {
    "tamil": ["ta-IN-PallaviNeural","ta-IN-ValluvarNeural","ta-LK-SaranyaNeural",]
,
    "english": [
    "en-IN-NeerjaNeural",
    "en-IN-PrabhatNeural"]
,
    "hindi": [
        "hi-IN-SwaraNeural",
        "hi-IN-MadhurNeural",]
,
    "telugu": ["te-IN-ShrutiNeural","te-IN-MohanNeural","te-IN-ChitraNeural"]
,
    "kannada": ["kn-IN-SapnaNeural","kn-IN-VishnuNeural","kn-IN-GowriNeural"]
,
    "malayalam": ["ml-IN-SobhanaNeural","ml-IN-MidhunNeural","ml-IN-AnilaNeural"]

}


@app.post("/generate")
async def generate_audio(data: TTSRequest):

    voices = VOICE_MAP.get(data.language)
    if not voices:
        return {"error": "Unsupported language"}

    selected_voice = data.voice if data.voice in voices else voices[0]
    rate = speed_to_rate(data.speed or 1.0)
    pitch = data.pitch or "+0Hz"

    if not pitch.startswith(("+", "-")):
        pitch = "+" + pitch

    try:
        communicate = edge_tts.Communicate(
            text=data.text,
            voice=selected_voice,
            rate=rate,
            pitch=pitch
        )

        audio_bytes = b""

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_bytes += chunk["data"]

        audio_buffer = BytesIO(audio_bytes)

        return StreamingResponse(
            audio_buffer,
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=tts.wav"}
        )

    except Exception as e:
        print("TTS ERROR:", e)
        return {"error": str(e)}
    
    
@app.get("/audio/{filename}")
def get_audio(filename: str):
    path = os.path.join(OUTPUT_DIR, filename)
    return FileResponse(
    path,
    media_type="audio/wav",
    filename=filename,
    headers={"Content-Disposition": f"attachment; filename={filename}"}
)
