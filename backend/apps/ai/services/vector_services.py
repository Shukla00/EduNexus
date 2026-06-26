import pickle
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def chunk_text(
    text,
    chunk_size=500
):
    chunks = []

    for i in range(
        0,
        len(text),
        chunk_size
    ):
        chunks.append(
            text[i:i+chunk_size]
        )

    return chunks

def create_vector_store(text):

    chunks = chunk_text(text)

    embeddings = model.encode(
        chunks,
        convert_to_numpy=True
    )

    index = faiss.IndexFlatL2(
        embeddings.shape[1]
    )

    index.add(
        embeddings
    )

    return index, chunks
def save_vector_store(index, chunks):

    faiss.write_index(
        index,
        "vector.index"
    )

    with open(
        "chunks.pkl",
        "wb"
    ) as f:
        pickle.dump(chunks, f)

def load_vector_store():

    index = faiss.read_index(
        "vector.index"
    )

    with open(
        "chunks.pkl",
        "rb"
    ) as f:
        chunks = pickle.load(f)

    return index, chunks


def search_context(question):

    index, chunks = load_vector_store()

    query_embedding = model.encode(
        [question],
        convert_to_numpy=True
    )

    D, I = index.search(query_embedding,3)
    if D[0][0] > 1.2:  # Threshold for relevance
        return "No relevant context found."

    context = "\n".join(
        chunks[i]
        for i in I[0]
    )

    return context