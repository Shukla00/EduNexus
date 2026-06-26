from .vector_services import search_context
from .llm_services import ask_ai

def chunk_text(text, chunk_size=500):

    chunks = []

    for i in range(0, len(text), chunk_size):
        chunks.append(text[i:i+chunk_size])
    return chunks


def generate_answer(
    question,
    student_context=""
):

    pdf_context = search_context(question)

    prompt = f"""
You are EduNexus AI Assistant.

Student Information:
{student_context}

PDF Context:
{pdf_context}

Question:
{question}

Rules:

1. If the question is about the student,
use Student Information.

2. If the question is about policies,
rules or notes,
use PDF Context.

3. If the user says hello,
greet politely.

4. Never make up information.

5. If information is unavailable,
say so clearly.
"""

    return ask_ai(prompt)