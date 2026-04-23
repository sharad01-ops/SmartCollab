import httpx
import re
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# Configuration
OLLAMA_URL = "http://localhost:11434/api/chat"
# This MUST match your 'ollama list' exactly
MODEL_NAME = "llama3.1:8b-instruct-q4_K_M" 

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
    if not messages: 
        return "Not enough content to generate a summary."

    conversation = format_conversation(messages)

    # Use the Chat API for Llama-3.1 Instruct
    payload = {
        "model": MODEL_NAME, 
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a professional meeting assistant. Summarize the transcript into paragraphs, more than 1 paragraph if the transcript is long . "
                    "Always use English for the summary, even if the transcript contains Hindi or Marathi. "
                    "Use exact User IDs like [user1] and [user2]. Focus only ncluding exon facts provided in the text."
                )
            },
            {
                "role": "user",
                "content": f"Summarize this conversation:\n\n{conversation}"
            }
        ],
        "stream": False,
        "options": {
            "temperature": 0.1  # Low temperature ensures factual accuracy
            #"num_thread": 4 
        }
    }

    async with httpx.AsyncClient(timeout=180) as client:
        try:
            resp = await client.post(OLLAMA_URL, json=payload)
            resp.raise_for_status()
            result = resp.json()
            
            # Extract content from the chat message structure
            return result.get("message", {}).get("content", "").strip()
        except httpx.HTTPStatusError as e:
            return f"Ollama Error: {e.response.status_code} - Make sure model '{MODEL_NAME}' is loaded."
        except Exception as e:
            return f"Connection Error: {str(e)}"

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
    # Start the server on port 8001
    uvicorn.run("summary:app", host="0.0.0.0", port=8001, reload=True)
