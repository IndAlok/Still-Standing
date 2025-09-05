# ===============================
# 1. Install dependencies
# ===============================


# ===============================
# 2. Imports
# ===============================
import re
import os
import json
import pandas as pd
from datasets import load_dataset
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
import pdfplumber
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm

# ===============================
# 3. Configure Gemini API
# ===============================
genai.configure(api_key="YOUR_GEMINI_API_KEY")  # Replace with your key
model = genai.GenerativeModel("gemini-2.5-flash")

# ===============================
# 4. Resume Schema
# ===============================
class ResumeSchema(BaseModel):
    name: str
    email: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    domains: Optional[List[str]] = []
    skills: Optional[List[str]] = []
    companies: Optional[List[str]] = []

# ===============================
# 5. Helper Functions
# ===============================
def infer_experience_level(years: float) -> str:
    try:
        years = float(years)
    except:
        return "Unknown"
    if years <= 2:
        return "Beginner"
    elif years <= 6:
        return "Intermediate"
    return "Advanced"

def classify_domains(skills: List[str]) -> List[str]:
    skill_map = {
        "Web Development": ["html", "css", "javascript", "react", "angular", "vue", "node"],
        "App Development": ["flutter", "dart", "kotlin", "swift", "java", "android", "ios"],
        "AI/ML": ["ml", "tensorflow", "pytorch", "scikit", "nlp", "ai", "deep learning"],
        "Cloud": ["aws", "gcp", "azure", "docker", "kubernetes", "ci/cd"],
        "DevOps": ["jenkins", "ansible", "terraform", "docker", "kubernetes"]
    }
    skills_text = " ".join(skills).lower()
    found = []
    for domain, keywords in skill_map.items():
        if any(kw.lower() in skills_text for kw in keywords):
            found.append(domain)
    return found or ["General"]

def extract_email(text: str) -> Optional[str]:
    if not text:
        return None
    # Preprocess common "dot" / "at"
    text = text.replace("(dot)", ".").replace(" dot ", ".").replace("(at)", "@").replace(" at ", "@")
    pattern = r"([A-Za-z0-9._%+-]+)\s*(?:@|\[at\]|\(at\)| at )\s*([A-Za-z0-9.-]+\.[A-Za-z]{2,})"
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return f"{match.group(1)}@{match.group(2)}"
    return None

def extract_location(text: str) -> Optional[str]:
    if not text:
        return None
    cities = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata"]
    for city in cities:
        if city.lower() in text.lower():
            return city
    match = re.search(r"\b\d{6}\b", text)
    if match:
        return match.group(0)
    return None

def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\n", " ").replace("\r", " "))

# ===============================
# 6. PDF Parsing
# ===============================
def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += " " + page_text
    return clean_text(text)

# ===============================
# 7. Resume Parsing with Gemini + Fallback
# ===============================
def parse_resume(resume_text: str, name: str = "Unknown", contact: str = "", skills: List[str] = [], years: float = 0, companies: List[str] = []):
    # Normalize skills
    skills = [s.strip().lower() for s in skills if s]

    try:
        prompt = f"""You are an AI resume analyzer. Extract structured information from the following resume. Focus on accuracy and infer missing details intelligently.
Resume Text: {resume_text}

Additional Information (if available):
- Name: {name}
- Contact Info: {contact}
- Skills: {skills}
- Years of Experience: {years}
- Companies: {companies}

Required Output:
Return a JSON object with the following fields:
- name: Full name of the candidate
- email: Email address
- experience_level: One of ["Beginner", "Intermediate", "Advanced"]
- domains: List of main domains ["Web Development", "App Development", "AI/ML", "Data Science", "Cloud", "DevOps", "General"]
- skills: List of all relevant skills mentioned
- companies: List of companies the candidate has worked for
Ensure the JSON is properly formatted."""
        
        response = model.generate_content(prompt)
        json_data = json.loads(response.text)
        data = ResumeSchema.model_validate(json_data)
    except Exception:
        # Fallback heuristics
        data = ResumeSchema(
            name=name,
            email=extract_email(resume_text) or extract_email(contact),
            location=extract_location(resume_text),
            experience_level=infer_experience_level(years),
            domains=classify_domains(skills),
            skills=skills or [],
            companies=companies or []
        )
    return data

# ===============================
# 8. Parse HuggingFace Dataset with Multithreading
# ===============================
def parse_hf_dataset_gemini(num_resumes: int = 10, max_workers: int = 5):
    dataset = load_dataset("bhuvanmdev/resume_parser", split=f"train[:{num_resumes}]")
    parsed_resumes = []

    def process_row(row):
        # Ensure skills and companies are lists
        skills = row.get("skills") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]

        companies = row.get("companies") or []
        if isinstance(companies, str):
            companies = [c.strip() for c in companies.split(",") if c.strip()]

        return parse_resume(
            resume_text=row.get("resume", ""),
            name=row.get("name", "Unknown"),
            contact=row.get("contact", ""),
            skills=skills,
            years=row.get("total_years", 0),
            companies=companies
        ).dict()

    def safe_process(row):
        try:
            return process_row(row)
        except Exception as e:
            print("Failed row:", row.get("name"), e)
            return None

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        for parsed in tqdm(executor.map(safe_process, dataset), total=len(dataset)):
            if parsed:
                parsed_resumes.append(parsed)

    df = pd.DataFrame(parsed_resumes)
    os.makedirs("dataset", exist_ok=True)

    # Save CSV inside dataset folder, overwrite every parse
    csv_path = os.path.join("dataset", "parsed_resumes.csv")
    df.to_csv(csv_path, index=False)
    print(f"✅ Parsed {len(df)} resumes and saved to {csv_path}")
    return df



# ===============================
# 9. Run Parsing on HuggingFace Dataset
# ===============================
df_parsed_resumes = parse_hf_dataset_gemini(num_resumes=10, max_workers=5)
df_parsed_resumes.head()
