"""
Image Captioner Service
Uses Google Gemini Vision to describe images extracted from PDFs.
This is critical for math books — equation images get converted to text descriptions.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import base64
from typing import List, Dict
from langchain.schema import Document
from app.core.config import settings

def caption_images(images: List[Dict]) -> List[Document]:
    """
    Take extracted images and use Gemini Vision to generate text descriptions.
    Returns LangChain Document objects with the captions as content.
    """
    if not images:
        return []

    if not settings.GOOGLE_API_KEY:
        print("No GOOGLE_API_KEY set, skipping image captioning")
        return []

    documents = []
    
    # Initialize LangChain Gemini model (multimodal supported)
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.1,
        max_output_tokens=1024
    )

    for img_data in images:
        try:
            # Convert bytes to base64
            img_b64 = base64.b64encode(img_data["image_bytes"]).decode("utf-8")
            img_ext = img_data.get("ext", "jpeg")
            if img_ext.lower() == "jpg":
                img_ext = "jpeg"
            mime_type = f"image/{img_ext.lower()}"

            # Create multimodal message
            message = HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": "Describe this image from a textbook in detail. "
                                "If it contains mathematical equations, write them out in text/LaTeX notation. "
                                "If it's a chart or diagram, describe the data and relationships shown. "
                                "If it's a table, reproduce the table content. "
                                "Be thorough and precise."
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{img_b64}"}
                    }
                ]
            )

            # Ask Gemini to describe the image
            response = llm.invoke([message])

            if response.content:
                caption = f"[Image on page {img_data['page']}]: {response.content}"
                documents.append(
                    Document(
                        page_content=caption,
                        metadata={
                            "page": img_data["page"],
                            "type": "image_caption"
                        }
                    )
                )
                print(f"  Captioned image on page {img_data['page']}")

        except Exception as e:
            print(f"  Failed to caption image on page {img_data['page']}: {e}")
            continue

    print(f"Generated {len(documents)} image captions")
    return documents