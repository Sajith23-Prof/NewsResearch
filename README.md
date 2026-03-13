News Research AI (RAG System)

An AI-powered news research assistant built using Retrieval-Augmented Generation (RAG).

The system allows users to provide news article URLs, automatically builds a knowledge base from those articles, and answers questions grounded in the article content with source references.

This project demonstrates how modern AI applications integrate LLMs, vector search, and document retrieval pipelines.

🌐 Live Demo

Frontend:
👉 https://newsresearch.pages.dev

Backend API:
👉 https://newsresearch-production.up.railway.app

🚀 Features

• Ingest news article URLs
• Extract and process article content
• Generate semantic embeddings
• Store vectors using FAISS
• Retrieve relevant context via vector search
• Generate answers using Groq LLM
• Display answers with source references

⚙️ Tech Stack

Frontend
React + Vite

Backend
FastAPI

AI Pipeline
LangChain
FastEmbed Embeddings
FAISS Vector Store
Groq LLM

User
 │
 ▼
React Frontend
 │
 ▼
FastAPI Backend
 │
 ▼
Embedding Model
 │
 ▼
FAISS Vector Store
 │
 ▼
Groq LLM
 │
 ▼
Answer + Sources

Infrastructure
Docker
GitHub Actions (CI Pipeline)
