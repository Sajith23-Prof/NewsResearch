from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List

from app.rag import ingest_urls, ask_question

load_dotenv()

app = FastAPI(title="News RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins = [
    "http://localhost:5173",
    "https://cc5a2a83.newsresearch.pages.dev",
],  # React dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class IngestRequest(BaseModel):
    urls: List[HttpUrl]

class IngestResponse(BaseModel):
    session_id: str
    chunks: int

class AskRequest(BaseModel):
    session_id: str
    question: str

class AskResponse(BaseModel):
    answer: str
    sources: List[str]

@app.post("/ingest", response_model=IngestResponse)
def ingest(req: IngestRequest):
    try:
        return ingest_urls([str(u) for u in req.urls])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    try:
        return ask_question(req.session_id, req.question)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))