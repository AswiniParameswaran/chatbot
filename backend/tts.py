from fastapi import APIRouter
from fastapi.responses import Response
from backend.elevenlabs_service import speak

router = APIRouter()

@router.post("/text-to-speech")
async def tts(text: str):
    audio = speak(text)
    

    return Response(content=audio, media_type="audio/mpeg")

