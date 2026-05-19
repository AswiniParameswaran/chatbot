import requests

try:
    from backend.config import DEEPGRAM_API_KEY
except ModuleNotFoundError:
    from config import DEEPGRAM_API_KEY

print(f"Using DEEPGRAM_API_KEY: {DEEPGRAM_API_KEY[:4]}...")


def transcribe_audio(audio_bytes, content_type="audio/webm"):
    response = requests.post(
        "https://api.deepgram.com/v1/listen",
        headers={
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": content_type,
        },
        data=audio_bytes,
        timeout=30,
    )
    response.raise_for_status()

    result = response.json()
    print(f"Deepgram response: {result}")

    transcript = (
        result.get("results", {})
        .get("channels", [{}])[0]
        .get("alternatives", [{}])[0]
        .get("transcript", "")
        .strip()
    )
    if not transcript:
        raise ValueError("Deepgram returned an empty transcript.")

    return transcript
