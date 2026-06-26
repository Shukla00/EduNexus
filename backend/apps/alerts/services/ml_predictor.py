import os
import pickle

MODEL_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), "../subject_model.pkl"))

_model = None


def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"AI subject model file not found at {MODEL_PATH}")
    if os.path.getsize(MODEL_PATH) == 0:
        raise ValueError(f"AI subject model file is empty at {MODEL_PATH}")

    try:
        with open(MODEL_PATH, "rb") as model_file:
            return pickle.load(model_file)
    except Exception as exc:
        raise RuntimeError(
            f"Failed to load AI subject model from {MODEL_PATH}: {exc}"
        ) from exc


def get_model():
    global _model
    if _model is None:
        _model = load_model()
    return _model


def clear_model_cache():
    global _model
    _model = None


def predict_subject(academic_score, attendance, exam_count=1):

    final_score = (
        academic_score * 0.7
        +
        attendance * 0.3
    )

    if academic_score < 40:
        prediction = "Fail"

    elif final_score >= 60:
        prediction = "Pass"

    else:
        prediction = "Borderline"

    if final_score >= 75:
        risk = "LOW"

    elif final_score >= 50:
        risk = "MEDIUM"

    else:
        risk = "HIGH"
     # Confidence based on amount of data
    confidence = min(
        50 + (exam_count * 10),
        95
        )

    return {
        "prediction": prediction,
        "risk_level": risk,
        "academic_score": round(academic_score, 2),
        "attendance": round(attendance, 2),
        "final_score": round(final_score, 2),
        "confidence": confidence
    }