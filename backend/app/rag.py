import os
import uuid
from typing import List, Dict, Any
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_community.document_loaders import WebBaseLoader

# from langchain_community.document_loaders import UnstructuredURLLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
# from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

EMBED_MODEL_NAME = "all-MiniLM-L6-v2"

prompt = ChatPromptTemplate.from_template("""
Answer the question using only the context below.

Context:
{context}

Question:
{question}
""")

def format_docs(docs):
    return "\n\n".join(d.page_content for d in docs)

def get_embeddings():
    # return HuggingFaceEmbeddings(model_name=EMBED_MODEL_NAME)
    return FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")

def get_llm():
    return ChatGroq(
        model="openai/gpt-oss-safeguard-20b",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.2,
    )

def ingest_urls(urls: List[str], base_dir: str = "indexes") -> Dict[str, Any]:
    session_id = str(uuid.uuid4())
    session_path = os.path.join(base_dir, session_id)
    os.makedirs(session_path, exist_ok=True)

    loader = WebBaseLoader(web_paths=urls)
    data = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = splitter.split_documents(data)

    embeddings = get_embeddings()
    vectorstore = FAISS.from_documents(docs, embeddings)
    vectorstore.save_local(session_path)

    return {"session_id": session_id, "chunks": len(docs)}

def ask_question(session_id: str, question: str, base_dir: str = "indexes") -> Dict[str, Any]:
    session_path = os.path.join(base_dir, session_id)
    if not os.path.isdir(session_path):
        raise FileNotFoundError("Invalid session_id or index not found")

    embeddings = get_embeddings()
    vectorstore = FAISS.load_local(session_path, embeddings, allow_dangerous_deserialization=True)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    retrieved_docs = retriever.invoke(question)

    llm = get_llm()
    rag_chain = (
        {"context": retriever | format_docs, "question": lambda x: x}
        | prompt
        | llm
        | StrOutputParser()
    )

    answer = rag_chain.invoke(question)

    sources = []
    seen = set()
    for d in retrieved_docs:
        src = d.metadata.get("source")
        if src and src not in seen:
            sources.append(src)
            seen.add(src)

    return {"answer": answer, "sources": sources}