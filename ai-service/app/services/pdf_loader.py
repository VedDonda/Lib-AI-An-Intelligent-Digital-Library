import io
import requests
import fitz
from typing import List
from langchain.schema import Document


def extract_text_from_pdf_url(pdf_url: str) -> List[Document]:
    response = requests.get(pdf_url, timeout=120, stream=True)
    response.raise_for_status()

    pdf_bytes = io.BytesIO(response.content)
    documents = []

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        if text and len(text.strip()) > 30:
            documents.append(
                Document(
                    page_content=text.strip(),
                    metadata={
                        "page": page_num + 1,
                        "source": pdf_url
                    }
                )
            )
    doc.close()
    return documents
