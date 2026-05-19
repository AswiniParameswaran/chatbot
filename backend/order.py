from fastapi import APIRouter

try:
    from backend.openai_service import get_order_from_text
    from backend.recipt import create_receipt
except ModuleNotFoundError:
    from openai_service import get_order_from_text
    from recipt import create_receipt

import json

router = APIRouter()

@router.post("/order")
async def process_order(user_text: str):
    try:
        
        order_json = get_order_from_text(user_text)

        receipt = create_receipt(order_json)
        # order_data = json.loads(order_json)

        
        

        return {
            "order_data": order_json,
            "receipt": receipt
        }

    except Exception as e:
        return {"error": str(e)}
