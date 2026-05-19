

import os
from google import genai  


GEMINI_API_KEY = "AIzaSyB1NnthN0X13xjZlPyloZ2R3IgIk7MSonU"  
client = genai.Client(api_key=GEMINI_API_KEY)

def get_order_from_text(text):
    """
    Given a sentence containing a food order, return a structured list of items with quantities.
    Example input: "I want 2 burgers and 1 large fries"
    Example output:
    [
        {"item": "Burger", "quantity": 2},
        {"item": "Large Fries", "quantity": 1}
    ]
    """

    prompt = f"""
    You are a friendly KFC drive-thru assistant helping understand what the customer wants.

    Read the customer's message carefully and identify only the food or drink items they want to order.
    The customer may speak naturally, ask politely, change their mind, or talk like a friendly chat.

    Customer message:
    "{text}"

    Rules:
    - Extract only actual menu items the customer wants.
    - Include the quantity for each item.
    - If quantity is not mentioned, use 1.
    - Ignore greetings, small talk, and extra words like "please", "I want", "can I get", or "thank you".
    - If the message is only a question or casual chat and does not contain an order, return exactly: no_order

    Return ONLY in one of these formats:
    - item: <item name>, quantity: <number>
    - no_order
    """

   
    response = client.models.generate_content(
        model="gemini-3-flash-preview",  
        contents=prompt
    )

    
    output_text = response.text.strip()
    
   
    order_list = []
    for line in output_text.split("\n"):
        if line.strip():
            try:
                
                line_clean = line.replace("item:", "").replace("Item:", "").replace("ITEM:", "")
                line_clean = line_clean.replace("quantity:", "").replace("Quantity:", "").replace("QUANTITY:", "")
                
               
                parts = [part.strip() for part in line_clean.split(",")]
                
                if len(parts) >= 2:
                    item_name = parts[0].strip()
                    
                    quantity_str = ''.join(filter(str.isdigit, parts[1]))
                    if quantity_str:
                        quantity = int(quantity_str)
                        order_list.append({"item": item_name, "quantity": quantity})
            except Exception as e:
                print(f"Skipping line due to error: {line}, {e}")
    
    return order_list


if __name__ == "__main__":
    user_text = "I would like 1 Zinger Burger and 2 Large Fries, please."
    order = get_order_from_text(user_text)
    print("Extracted Order:", order)
