"""
Embedding pipeline: chunk documents → generate BGE-M3 embeddings → insert into Supabase doc_chunks.

This script runs LOCALLY on the developer machine (not on the server). BGE-M3 runs on CPU,
which is free and sufficient for the scale we're targeting (hundreds to low thousands of docs).

Prerequisites:
    pip install sentence-transformers supabase psycopg2-binary python-docx PyPDF2

Usage:
    python embed_documents.py <input_file> \
        --supabase-url <url> \
        --supabase-key <service_role_key> \
        --document-id <existing_document_uuid> \
        --mall-id <mall_uuid>

Workflow:
    1. Upload document to Supabase Storage → get document record
    2. Run this script to chunk + embed → insert into doc_chunks
"""

import sys
import json
import os
import argparse
import uuid
from pathlib import Path

# ── Import chunking logic from sibling module ───────────────────────────────
# In production, run from the ai-pipeline directory:
#   cd ai-pipeline && python embed_documents.py ...
try:
    from chunk_documents import chunk_text, read_text, read_pdf, read_docx, read_markdown, detect_file_type
except ImportError:
    print("ERROR: chunk_documents.py must be in the same directory.", file=sys.stderr)
    sys.exit(1)


def load_embedding_model(model_name: str = "BAAI/bge-m3"):
    """Load BGE-M3 model via sentence-transformers (runs on CPU)."""
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("sentence-transformers not installed. pip install sentence-transformers", file=sys.stderr)
        sys.exit(1)

    print(f"Loading embedding model: {model_name} ...")
    model = SentenceTransformer(model_name)
    print(f"Model loaded. Dimension: {model.get_sentence_embedding_dimension()}")
    return model


def embed_chunks(
    chunks: list[dict],
    model,
    batch_size: int = 8,
) -> list[list[float]]:
    """Generate embeddings for each chunk (batched for memory efficiency)."""
    texts = [c["content"] for c in chunks]
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        embeddings = model.encode(batch, normalize_embeddings=True, show_progress_bar=True)
        all_embeddings.extend(embeddings.tolist())

    return all_embeddings


def insert_to_supabase(
    chunks: list[dict],
    embeddings: list[list[float]],
    supabase_url: str,
    supabase_key: str,
    document_id: str,
    mall_id: str,
) -> int:
    """Insert chunks + embeddings into Supabase doc_chunks table."""
    try:
        from supabase import create_client
    except ImportError:
        print("supabase-py not installed. pip install supabase", file=sys.stderr)
        sys.exit(1)

    client = create_client(supabase_url, supabase_key)

    inserted = 0
    for chunk, embedding in zip(chunks, embeddings):
        record = {
            "id": str(uuid.uuid4()).replace("-", ""),
            "document_id": document_id,
            "mall_id": mall_id,
            "content": chunk["content"],
            "chunk_index": chunk["chunk_index"],
            "embedding": embedding,  # pgvector accepts list[float] → vector
            "metadata": {
                "char_count": chunk["char_count"],
                "title": chunk.get("title", ""),
            },
        }

        try:
            client.table("doc_chunks").insert(record).execute()
            inserted += 1
        except Exception as e:
            print(f"  [WARN] Failed to insert chunk {chunk['chunk_index']}: {e}", file=sys.stderr)

    return inserted


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Embed documents with BGE-M3 and insert into Supabase"
    )
    parser.add_argument("input", help="Path to input document")
    parser.add_argument("--supabase-url", required=True, help="Supabase project URL")
    parser.add_argument("--supabase-key", required=True, help="Supabase service_role key")
    parser.add_argument("--document-id", required=True, help="UUID of existing document record")
    parser.add_argument("--mall-id", required=True, help="UUID of the mall")
    parser.add_argument("--title", help="Document title (default: filename)")
    parser.add_argument("--chunk-size", type=int, default=500)
    parser.add_argument("--chunk-overlap", type=int, default=50)
    parser.add_argument("--model", default="BAAI/bge-m3", help="Embedding model name")
    parser.add_argument("--batch-size", type=int, default=8, help="Embedding batch size")
    parser.add_argument("--dry-run", action="store_true", help="Chunk only, skip embedding+insert")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"File not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    title = args.title or Path(args.input).stem
    ext = detect_file_type(args.input)

    # ── Read document ───────────────────────────────────────────────────────
    print(f"Reading: {args.input} ({ext})")
    if ext == ".pdf":
        text = read_pdf(args.input)
    elif ext == ".docx":
        text = read_docx(args.input)
    elif ext in (".md", ".markdown"):
        text = read_markdown(args.input)
    else:
        text = read_text(args.input)

    print(f"  Total characters: {len(text)}")

    # ── Chunk ───────────────────────────────────────────────────────────────
    chunks = chunk_text(text, args.chunk_size, args.chunk_overlap, title)
    print(f"  Chunks: {len(chunks)}")

    if args.dry_run:
        # Preview first 2 chunks
        for chunk in chunks[:2]:
            print(f"\n  --- Chunk {chunk['chunk_index']} ({chunk['char_count']} chars) ---")
            print(f"  {chunk['content'][:200]}...")
        print(f"\n[Dry run complete. {len(chunks)} chunks would be embedded.]")
        return

    # ── Embed ───────────────────────────────────────────────────────────────
    model = load_embedding_model(args.model)
    embeddings = embed_chunks(chunks, model, args.batch_size)
    print(f"  Embeddings generated: {len(embeddings)} vectors")

    # ── Insert to Supabase ──────────────────────────────────────────────────
    print(f"Inserting into Supabase doc_chunks (document_id={args.document_id})...")
    inserted = insert_to_supabase(
        chunks, embeddings, args.supabase_url, args.supabase_key,
        args.document_id, args.mall_id,
    )
    print(f"Done. {inserted}/{len(chunks)} chunks inserted.")


if __name__ == "__main__":
    main()
