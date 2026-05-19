try:
    from backend.openai_service import get_order_from_text
except ModuleNotFoundError:
    from openai_service import get_order_from_text

def create_receipt(order_data):
    receipt_lines = []
    for item in order_data:  
        receipt_lines.append(f"{item['quantity']} x {item['item']}")
    return "\n".join(receipt_lines)
