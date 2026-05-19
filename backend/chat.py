from backend.reply import ask_gemini
from fastapi import APIRouter
from fastapi.responses import JSONResponse
import traceback
# from .openai_service import get_order_from_tex

router = APIRouter()

@router.post("/chat")
async def chat(user_text: str):
    try:
        # reply=get_order_from_text(user_text)
        reply = ask_gemini(user_text)
        
        return {"reply": reply}
    except Exception as exc:
      
        traceback.print_exc()
        return JSONResponse(
            status_code=502,
            content={
                "reply": "Sorry, I am having trouble reaching the assistant service right now. Please try again.",
                "error": str(exc),
            },
        )
