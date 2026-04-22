import httpx
import json
import os
from fastapi import APIRouter, HTTPException

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRANSCRIPTS_PATH = os.path.join(BASE_DIR, "transcriber", "storage", "transcripts")
LLM_SERVICE_URL = "http://localhost:8001/summarize"

@router.post("/{room_id}")
async def get_room_summary(room_id: str):
    file_path = os.path.join(TRANSCRIPTS_PATH, f"{room_id}_transcript.json")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Transcript for room {room_id} not found")

    # read json
    with open(file_path, "r") as f:
        transcript_data = json.load(f)

    # call llm service
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(LLM_SERVICE_URL, json={"data": transcript_data})

    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="LLM service failed")

    return resp.json()