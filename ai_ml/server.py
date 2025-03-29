from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Import the core analysis function
from ai_ml.backend import analyze_document

app = FastAPI(title="Document Analysis Mockup API")


class AnalysisRequest(BaseModel):
    document: str
    question: str = None
    translate_lang: str = "fr"


@app.post("/analyze")
async def analyze(req: AnalysisRequest):
    try:
        results = analyze_document(
            document=req.document,
            question=req.question,
            translate_lang=req.translate_lang
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Mockup server to test the AI/ML backend before integrating it with the main Express BE
if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
