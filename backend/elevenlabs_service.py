import os

from elevenlabs.client import ElevenLabs



ELEVENLABS_API_KEY = "sk_0035a9d1f90817fe5b42bfe228ad8f4388954a595b245eae"

client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

def speak(text: str):
    print(f"[Speaking]: {text}")
    audio_generator = client.text_to_speech.convert(
        text=text,
        voice_id="JBFqnCBsd6RMkjVDRZzb",
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128"
    )

    audio_bytes = b"".join(list(audio_generator))
    return audio_bytes


def save_audio(audio_bytes: bytes, filename: str = "kfc_voice_output.mp3"):
    output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), filename)
    with open(output_path, "wb") as audio_file:
        audio_file.write(audio_bytes)
    return output_path



if __name__ == "__main__":
    first_audio = speak("Welcome to KFC. Please tell me your order.")
    first_path = save_audio(first_audio, "kfc_welcome.mp3")
    print(f"Saved audio to: {first_path}")
    os.startfile(first_path)

    second_audio = speak("Would you like a Zinger Meal today?")
    second_path = save_audio(second_audio, "kfc_offer.mp3")
    print(f"Saved audio to: {second_path}")
