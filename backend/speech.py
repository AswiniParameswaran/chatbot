from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import traceback

try:
    from backend.deepgram_service import transcribe_audio
    # from backend.openai_service import get_order_from_text
    # from backend.recipt import create_receipt
    from backend.reply import ask_gemini
except ModuleNotFoundError:
    from deepgram_service import transcribe_audio
    # from openai_service import get_order_from_text
    # from recipt import create_receipt
    from reply import ask_gemini

router = APIRouter()

@router.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    try:
        audio = await file.read()
        text = transcribe_audio(audio, file.content_type or "audio/webm")
        print(f"Transcribed text: {text}")

        
        reply = ask_gemini(text)
        # order_json = get_order_from_text(text)
        # receipt = create_receipt(reply)

        return {
            "text": text,
            "reply": reply,
            # "order": order_json,
            # "receipt": receipt
        }
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(
            status_code=502,
            content={
                "reply": "Sorry, I couldn't process the voice order right now. Please try again.",
                "error": str(exc),
            },
        )
