import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    print(f"Loaded OPENAI_API_KEY: {OPENAI_API_KEY[:4]}...")
else:
    print("OPENAI_API_KEY not found; some features may be limited.")

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if ELEVENLABS_API_KEY:
    print(f"Loaded ELEVENLABS_API_KEY: {ELEVENLABS_API_KEY[:4]}...")
else:
    print("ELEVENLABS_API_KEY not found; text-to-speech may not work.")

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
if DEEPGRAM_API_KEY:
    print(f"Loaded DEEPGRAM_API_KEY: {DEEPGRAM_API_KEY[:4]}...")
else:
    print("DEEPGRAM_API_KEY not found; speech-to-text may not work.")

