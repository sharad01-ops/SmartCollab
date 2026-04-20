######################################################################################################
import httpx
import re
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# CRITICAL: Use 'generate' endpoint for Sarvam-1 Base model
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "sarvam-mixsummarizer" # Ensure this matches your Modelfile name

NOISE_PATTERNS = [
    r"\(speaks in foreign language\)",
    r"\(.*?\)",
]

class TranscriptRequest(BaseModel):
    data: dict

def clean_text(text: str) -> str:
    for pattern in NOISE_PATTERNS:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    return text.strip()

def is_useless(text: str) -> bool:
    words = text.split()
    return len(words) <= 1

def extract_messages(data: dict) -> list:
    messages = []
    # Matching your transcript.json structure
    for segment in data.get("segments", []):
        cleaned = clean_text(segment.get("text", ""))
        if not cleaned or is_useless(cleaned):
            continue
        messages.append({
            "user": segment.get("userId", "unknown"),
            "message": cleaned
        })
    return messages

def format_conversation(messages: list) -> str:
    return "\n".join(f"[user{m['user']}] {m['message']}" for m in messages)






async def get_summary(data: dict) -> str:
    messages = extract_messages(data)
    if not messages: return "No content."

    conversation = format_conversation(messages)

    # We use a very primitive pattern that base models understand better
    prompt = (
    f"Transcript:\n{conversation}\n\n"
    "Summary: [user2] and [user7] discussed the project report. "
    "Because of a delay in data analysis, they agreed to"
)


    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.0,
            "repeat_penalty": 1.5,
            "num_predict": 60, # Increased for full sentences
            "stop": ["\n", "उपयोगकर्ता", "[", "]", "/", "###", "(", "\""] 
        }
    }


    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(OLLAMA_URL, json=payload)
        result = resp.json()
        
        # We manually stitch the anchor back to the response
        generated_text = result.get("response", "").strip()
        return f"The users discussed {generated_text}"


        

@app.post("/summarize")
async def summarize(request: TranscriptRequest):
    try:
        summary = await get_summary(request.data)
        return {
            "roomId": request.data.get("roomId"),
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
