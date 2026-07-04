from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.ai_agent import query_fiscal_ai

router = APIRouter(prefix="/api/v1/chat", tags=["Chat AI"])

# Define the expected JSON body from the frontend
class ChatRequest(BaseModel):
    prompt: str

@router.post("/query")
async def chat_with_agent(request: ChatRequest):
    """Receives user prompt, queries the AI, and returns the generated text."""
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    
    answer = query_fiscal_ai(request.prompt)
    
    return {
        "status": "success",
        "response": answer
    }
