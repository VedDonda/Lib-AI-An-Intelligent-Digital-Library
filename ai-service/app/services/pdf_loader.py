"""
PDF Loader Service
Downloads a PDF from a Cloudinary URL, extracts text page-by-page,
and optionally extracts images for captioning.
"""

import os
import tempfile
import requests
import fitz  # PyMuPDF — better than PyPDF for math/image extraction
from typing import List, Dict
from langchain.schema import Document


def download_pdf(pdf_url: str) -> str:
    """Download a PDF from a URL and save to a temp file. Returns the local path."""
    try:
        response = requests.get(pdf_url, timeout=60, stream=True)
        response.raise_for_status()

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        for chunk in response.iter_content(chunk_size=8192):
            temp_file.write(chunk)
        temp_file.close()

        print(f"PDF downloaded to: {temp_file.name}")
        return temp_file.name

    except Exception as e:
        print(f"Failed to download PDF: {e}")
        raise


def extract_text_from_pdf(pdf_path: str) -> List[Document]:
    """
    Extract text from a PDF page-by-page using PyMuPDF.
    Returns a list of LangChain Document objects with page metadata.

    PyMuPDF preserves math notation and layout better than PyPDF.
    """
    documents = []

    try:
        doc = fitz.open(pdf_path)

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")  # plain text extraction

            # Skip pages with very little text (likely full-image pages)
            if text and len(text.strip()) > 30:
                documents.append(
                    Document(
                        page_content=text.strip(),
                        metadata={
                            "page": page_num + 1,
                            "source": pdf_path
                        }
                    )
                )

        doc.close()
        print(f"Extracted text from {len(documents)} pages")

    except Exception as e:
        print(f"Error extracting text: {e}")
        raise

    return documents


def extract_images_from_pdf(pdf_path: str) -> List[Dict]:
    """
    Extract images from a PDF using PyMuPDF.
    Returns a list of dicts with image bytes and page number.
    Used for Gemini Vision captioning of charts/diagrams/equations.
    """
    images = []

    try:
        doc = fitz.open(pdf_path)

        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)

            for img_index, img_info in enumerate(image_list):
                xref = img_info[0]
                base_image = doc.extract_image(xref)

                if base_image:
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]

                    # Only process reasonably sized images (skip tiny icons)
                    if len(image_bytes) > 5000:
                        images.append({
                            "image_bytes": image_bytes,
                            "ext": image_ext,
                            "page": page_num + 1,
                            "index": img_index
                        })

        doc.close()
        print(f"Extracted {len(images)} significant images from PDF")

    except Exception as e:
        print(f"Image extraction failed (non-fatal): {e}")

    return images


def cleanup_temp_file(file_path: str):
    """Remove a temporary file."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Cleaned up temp file: {file_path}")
    except Exception as e:
        print(f"Failed to clean up {file_path}: {e}")
