from .pdf_services import extract_pdf_text
from .vector_services import create_vector_store

def process_document(
    pdf_path
):

    text = extract_pdf_text(
        pdf_path
    )

    index, chunks = create_vector_store(
        text
    )

    return index, chunks