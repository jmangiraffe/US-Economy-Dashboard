import os
import json
from google import genai
from google.genai import types
from backend.services.db_service import get_latest_snapshot

# Initialize the new SDK client (it automatically picks up GEMINI_API_KEY from the environment)
client = genai.Client()

def query_fiscal_ai(user_prompt: str) -> str:
    """Combines live database context with the user's prompt and queries the LLM."""
    
    # 1. Get current data context
    current_data = get_latest_snapshot()
    
    # 2. Build the System Prompt with RAG context
    system_instruction = f"""
    You are the US Fiscal Intelligence AI Assistant. 
    Your job is to answer user questions about the US economy based strictly on the current real-time data provided below.
    If the user asks something outside the scope of macroeconomics or the provided data, politely decline to answer.
    Be concise, professional, and use formatting (bullet points, bold text) to make numbers easy to read. Do not use markdown headers.
    
    CURRENT FISCAL DATA SNAPSHOT (JSON):
    {json.dumps(current_data, indent=2)}
    """
    
    try:
        # Use the new generate_content syntax with the GenerateContentConfig object
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2 # Lower temperature for factual, analytical responses
            )
        )
        
        return response.text
        
    except Exception as e:
        print(f"[AI Agent Error] {e}")
        return "I am currently experiencing connectivity issues with my intelligence core. Please try again later."
