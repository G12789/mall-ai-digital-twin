"""
Document chunking pipeline for the mall AI Copilot knowledge base.

Splits documents into overlapping chunks suitable for embedding and retrieval.
Supports .txt, .md, .pdf (via PyPDF2), .docx (via python-docx).

Usage:
    python chunk_documents.py <input_file> [--chunk-size 500] [--chunk-overlap 50]

Output: JSON array of chunks to stdout, or writes to --output file.
"""

import sys
import json
import os
import re
import argparse
from pathlib import Path
from typing import Iterator

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def read_text(path: str) -> str:
    """Read plain text from file."""
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def read_pdf(path: str) -> str:
    """Extract text from PDF."""
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        print("PyPDF2 not installed. pip install PyPDF2", file=sys.stderr)
        sys.exit(1)

    reader = PdfReader(path)
    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n\n".join(pages)


def read_docx(path: str) -> str:
    """Extract text from DOCX."""
    try:
        from docx import Document
    except ImportError:
        print("python-docx not installed. pip install python-docx", file=sys.stderr)
        sys.exit(1)

    doc = Document(path)
    paragraphs: list[str] = []
    for para in doc.paragraphs:
        if para.text.strip():
            paragraphs.append(para.text.strip())
    return "\n".join(paragraphs)


def read_markdown(path: str) -> str:
    """Read markdown, stripping excessive formatting."""
    text = read_text(path)
    # Remove code blocks for cleaner chunking
    text = re.sub(r"```[\s\S]*?```", "[CODE_BLOCK]", text)
    return text


def chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
    title: str = "",
) -> list[dict]:
    """Split text into overlapping chunks.  Returns list of chunk dicts."""
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    chunks: list[dict] = []
    idx = 0
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        # Try to break at a sentence boundary
        if end < len(text):
            # Search for 。！？\n within the last 100 chars of the window
            window = text[end - min(100, chunk_size // 5) : end + min(100, chunk_size // 5)]
            best = -1
            for sep in ["。", "！", "？", "\n", ". ", "! ", "? "]:
                pos = window.rfind(sep)
                if pos > best:
                    best = pos
            if best > 0:
                end = end - min(100, chunk_size // 5) + best + 1

        chunk_content = text[start:end].strip()
        if len(chunk_content) >= 20:  # skip tiny fragments
            chunks.append({
                "chunk_index": idx,
                "content": chunk_content,
                "char_count": len(chunk_content),
                "title": title,
            })
            idx += 1

        start = end - chunk_overlap  # overlap
        if start >= len(text):
            break
        # Prevent infinite loop on very small texts
        if start <= 0 and idx > 0:
            break

    return chunks


def detect_file_type(path: str) -> str:
    ext = Path(path).suffix.lower()
    return ext


def main() -> None:
    parser = argparse.ArgumentParser(description="Chunk documents for RAG knowledge base")
    parser.add_argument("input", help="Path to input document")
    parser.add_argument("--chunk-size", type=int, default=CHUNK_SIZE)
    parser.add_argument("--chunk-overlap", type=int, default=CHUNK_OVERLAP)
    parser.add_argument("--output", "-o", help="Output JSON file (default: stdout)")
    parser.add_argument("--title", help="Document title (default: filename)")
    args = parser.parse_args()

    filepath = args.input
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}", file=sys.stderr)
        sys.exit(1)

    ext = detect_file_type(filepath)
    title = args.title or Path(filepath).stem

    # Read document
    if ext == ".pdf":
        text = read_pdf(filepath)
    elif ext == ".docx":
        text = read_docx(filepath)
    elif ext in (".md", ".markdown"):
        text = read_markdown(filepath)
    else:
        text = read_text(filepath)

    # Chunk
    chunks = chunk_text(text, args.chunk_size, args.chunk_overlap, title)

    result = {
        "source_file": filepath,
        "title": title,
        "total_chars": len(text),
        "chunk_count": len(chunks),
        "chunks": chunks,
    }

    json_output = json.dumps(result, ensure_ascii=False, indent=2)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as fh:
            fh.write(json_output)
        print(f"Wrote {len(chunks)} chunks to {args.output}")
    else:
        print(json_output)


if __name__ == "__main__":
    main()
