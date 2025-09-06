import pandas as pd
import os
import random
import ast
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from datetime import datetime


def load_csv_to_dataframe(filename, directory="."):
    """
    Load a CSV file from the specified directory into a Pandas DataFrame.
    """
    file_path = os.path.join(directory, filename)
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"CSV file not found at path: {file_path}")
    return pd.read_csv(file_path)


class SmartMatchmakingEngineFAISS:
    def __init__(self, n_clusters=8, required_domains=None, required_skills=None):
        # Embedding model
        self.embedder = SentenceTransformer("all-mpnet-base-v2")

        # FAISS index
        self.dimension = 768
        self.index = faiss.IndexFlatL2(self.dimension)

        # Storage
        self.user_profiles = pd.DataFrame()
        self.embeddings = None

        # Clustering
        self.n_clusters = n_clusters
        self.clustering_model = KMeans(n_clusters=n_clusters, random_state=42)

        # Organizer-defined requirements
        self.required_domains = set(required_domains) if required_domains else None
        self.required_skills = set(required_skills) if required_skills else None

    # ---------- Helpers ----------
    def compute_experience_score(self, initiator_level, candidate_level):
        level_map = {"beginner": 1, "intermediate": 2, "advanced": 3}
        init_lvl = level_map.get(initiator_level, 2)
        cand_lvl = level_map.get(candidate_level, 2)

        if init_lvl == cand_lvl:
            return 1.0
        elif cand_lvl > init_lvl:  # candidate is more experienced
            return 0.8
        else:  # candidate is less experienced
            return 0.6

    def preprocess_list_column(self, val):
        """Return a python list for column values that may be list, stringified list, or other."""
        if isinstance(val, list):
            return val
        if pd.isna(val):
            return []
        if isinstance(val, str):
            try:
                parsed = ast.literal_eval(val)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [s.strip() for s in val.split(",") if s.strip()]
        return []

    def ensure_list(self, val):
        """Safely convert various types (pd.Series, str, list) to a python list."""
        if isinstance(val, list):
            return val
        if isinstance(val, pd.Series):
            if len(val) == 1:
                return self.ensure_list(val.iloc[0])
            return val.tolist()
        if isinstance(val, str):
            try:
                parsed = ast.literal_eval(val)
                return parsed if isinstance(parsed, list) else [val]
            except Exception:
                return [s.strip() for s in val.split(",") if s.strip()]
        if pd.isna(val):
            return []
        return [val]

    def _compute_coverage(self, covered_skills, covered_domains):
        """Compute skill, domain, and overall coverage percentages."""
        skill_coverage = min(100,
            len(covered_skills) / len(self.required_skills) * 100
            if self.required_skills else 100.0
        )
        domain_coverage = min(100,
            len(covered_domains) / len(self.required_domains) * 100
            if self.required_domains else 100.0
        )
        coverage_percent = round((skill_coverage + domain_coverage) / 2, 2)

        return round(skill_coverage, 2), round(domain_coverage, 2), coverage_percent

    # ---------- Load Users ----------
    def load_users_from_df(self, df: pd.DataFrame):
        df = df.copy()

        if "domains" not in df.columns and "domain" in df.columns:
            df["domains"] = df["domain"].apply(lambda d: [d] if not isinstance(d, list) else d)

        df["skills"] = df["skills"].apply(self.preprocess_list_column)
        df["domains"] = df["domains"].apply(self.preprocess_list_column)

        df["is_available"] = df.get("is_available", True).fillna(True)
        df["availability"] = df.get("availability", "medium").fillna("medium").str.lower()

        if "experience_level" not in df.columns:
            df["experience_level"] = "intermediate"
        df["experience_level"] = df["experience_level"].fillna("intermediate").astype(str).str.lower()

        if "primary_goal" not in df.columns:
            df["primary_goal"] = ""
        if "communication_style" not in df.columns:
            df["communication_style"] = "mixed"

        self.user_profiles = df.reset_index(drop=True)

        # Embedding text = skills + domains + goals + comm style
        profiles_text = self.user_profiles.apply(
            lambda row: " ".join(self.ensure_list(row["skills"]))
            + " "
            + " ".join(self.ensure_list(row["domains"]))
            + " "
            + str(row.get("primary_goal", "")) + " "
            + str(row.get("communication_style", "")),
            axis=1,
        )

        embeddings = self.embedder.encode(profiles_text.tolist(), show_progress_bar=False)
        self.embeddings = np.array(embeddings).astype("float32")

        self.index.reset()
        if len(self.embeddings) > 0:
            self.index.add(self.embeddings)

        try:
            if len(self.embeddings) >= max(2, self.n_clusters):
                self.clustering_model.fit(self.embeddings)
                self.user_profiles["skill_cluster"] = self.clustering_model.labels_
            else:
                self.user_profiles["skill_cluster"] = 0
        except Exception:
            self.user_profiles["skill_cluster"] = 0

        return self.user_profiles

    # ---------- Candidate Ranking ----------
    def find_matches(self, participant_id, num_matches=10, search_k=50):
        if self.user_profiles.empty:
            return []
        if participant_id not in self.user_profiles["participant_id"].values:
            return []

        initiator_idx = int(self.user_profiles[self.user_profiles["participant_id"] == participant_id].index[0])
        initiator_row = self.user_profiles.iloc[initiator_idx]

        required_domains = set(self.required_domains or [])
        required_skills = set(self.required_skills or [])

        covered_domains = set(self.ensure_list(initiator_row["domains"]))
        covered_skills = set(self.ensure_list(initiator_row["skills"]))

        n_users = len(self.embeddings)
        k = min(max(1, search_k), n_users)

        D, I = self.index.search(self.embeddings[initiator_idx:initiator_idx + 1], k=k)
        candidate_indices = I[0]

        candidates = []
        for j, idx in enumerate(candidate_indices):
            if idx == initiator_idx:
                continue

            row = self.user_profiles.iloc[int(idx)]
            if not bool(row.get("is_available", True)):
                continue

            cid = row["participant_id"]
            domains = self.ensure_list(row["domains"])
            skills = self.ensure_list(row["skills"])

            domain_gain = sum(1 for d in domains if d not in covered_domains)
            skill_gain = sum(1 for s in skills if s not in covered_skills)

            avail_map = {"low": 0.3, "medium": 0.6, "high": 1.0}
            availability_score = avail_map.get(str(row.get("availability", "medium")).lower(), 0.6)

            exp_score = self.compute_experience_score(
                initiator_row["experience_level"],
                row["experience_level"]
            )

            dist = float(D[0][j]) if D is not None else 0.0
            emb_sim = 1.0 / (1.0 + dist)

            overlap_penalty = len(set(skills) & covered_skills) * 0.05

            total_score = (
                domain_gain * 0.4
                + skill_gain * 0.3
                + availability_score * 0.15
                + exp_score * 0.15
                + emb_sim * 0.1
                - overlap_penalty
            )

            candidates.append({
                "participant_id": cid,
                "name": row.get("name", ""),
                "domain_gain": int(domain_gain),
                "skill_gain": int(skill_gain),
                "compatibility_score": float(round(total_score, 4))
            })

        return sorted(candidates, key=lambda x: x["compatibility_score"], reverse=True)[:num_matches]

    # ---------- Team Formation ----------
    def form_instant_team(self, initiator_id, team_size=5, search_k=50):
        if self.user_profiles.empty:
            return {}
        if initiator_id not in self.user_profiles["participant_id"].values:
            return {}

        team = [initiator_id]
        initiator_idx = int(self.user_profiles[self.user_profiles["participant_id"] == initiator_id].index[0])
        initiator_row = self.user_profiles.iloc[initiator_idx]

        required_domains = set(self.required_domains or [])
        required_skills = set(self.required_skills or [])

        covered_domains = set(self.ensure_list(initiator_row["domains"]))
        covered_skills = set(self.ensure_list(initiator_row["skills"]))

        n_users = len(self.embeddings)
        k = min(max(1, search_k), n_users)

        while len(team) < team_size:
            D, I = self.index.search(self.embeddings[initiator_idx:initiator_idx + 1], k=k)
            candidate_indices = I[0]

            best_candidate = None
            best_score = -1.0

            for j, idx in enumerate(candidate_indices):
                if int(idx) == initiator_idx:
                    continue

                row = self.user_profiles.iloc[int(idx)]
                cid = row["participant_id"]

                if cid in team or not bool(row.get("is_available", True)):
                    continue

                candidate_domains = set(self.ensure_list(row["domains"]))
                candidate_skills = set(self.ensure_list(row["skills"]))

                domain_gain = len((required_domains - covered_domains) & candidate_domains)
                skill_gain = len((required_skills - covered_skills) & candidate_skills)

                avail_map = {"low": 0.3, "medium": 0.6, "high": 1.0}
                availability_score = avail_map.get(str(row.get("availability", "medium")).lower(), 0.6)

                exp_score = self.compute_experience_score(
                    initiator_row["experience_level"],
                    row["experience_level"]
                )

                dist = float(D[0][j]) if D is not None else 0.0
                emb_sim = 1.0 / (1.0 + dist)

                overlap_penalty = len(candidate_skills & covered_skills) * 0.05

                score = (
                    domain_gain * 0.25
                    + skill_gain * 0.2
                    + availability_score * 0.1
                    + exp_score * 0.05
                    - overlap_penalty
                )

                if score > best_score:
                    best_score = score
                    best_candidate = row

            if best_candidate is None:
                break

            cid = best_candidate["participant_id"]
            team.append(cid)
            covered_domains.update(self.ensure_list(best_candidate["domains"]))
            covered_skills.update(self.ensure_list(best_candidate["skills"]))

        missing_domains = required_domains - covered_domains
        missing_skills = required_skills - covered_skills

        skill_coverage, domain_coverage, coverage_percent = self._compute_coverage(
            covered_skills, covered_domains
        )

        return {
            "team_members": team,
            "covered_domains": list(covered_domains),
            "covered_skills": list(covered_skills),
            "missing_domains": list(missing_domains),
            "missing_skills": list(missing_skills),
            "skill_coverage_percent": skill_coverage,
            "domain_coverage_percent": domain_coverage,
            "coverage_percent": coverage_percent
        }

    # ---------- Skill Gap Reporting ----------
    def report_skill_gaps(self, team_ids):
        team_skills = set()
        team_domains = set()

        for pid in team_ids:
            rows = self.user_profiles[self.user_profiles["participant_id"] == pid]
            if rows.empty:
                continue
            row = rows.iloc[0]
            team_skills.update(self.ensure_list(row["skills"]))
            team_domains.update(self.ensure_list(row["domains"]))

        if not self.required_skills:
            all_skills = set(s for skills in self.user_profiles["skills"] for s in self.ensure_list(skills))
            self.required_skills = set(all_skills)

        if not self.required_domains:
            all_domains = set(d for domains in self.user_profiles["domains"] for d in self.ensure_list(domains))
            self.required_domains = set(all_domains)

        missing_skills = self.required_skills - team_skills
        covered_skills = team_skills.intersection(self.required_skills)

        missing_domains = self.required_domains - team_domains
        covered_domains = team_domains.intersection(self.required_domains)

        skill_coverage, domain_coverage, coverage_percent = self._compute_coverage(
            covered_skills, covered_domains
        )

        return {
            "team_members": team_ids,
            "covered_domains": list(covered_domains),
            "covered_skills": list(covered_skills),
            "missing_domains": list(missing_domains),
            "missing_skills": list(missing_skills),
            "skill_coverage_percent": skill_coverage,
            "domain_coverage_percent": domain_coverage,
            "coverage_percent": coverage_percent
        }


# ------------------------- RUN EXAMPLE -------------------------
if __name__ == "__main__":
    participants_df = load_csv_to_dataframe("Backend/dataset/participants.csv", "")
    event = {
        "required_domains": ["frontend", "backend", "ai_ml"],
        "required_skills": ['react', 'Node.js', 'Python', 'Django',
                            'JavaScript', 'HTML', 'CSS', 'AI/ML', 'Computer Vision', 'NLP']
    }

    engine = SmartMatchmakingEngineFAISS(
        n_clusters=3,
        required_domains=event["required_domains"],
        required_skills=event["required_skills"]
    )

    engine.load_users_from_df(participants_df)

    matches = engine.find_matches(participant_id="P_001", num_matches=3)
    print("Top Matches:", matches)

    team = engine.form_instant_team(initiator_id="P_001", team_size=4)
    print("Formed Team:", team)

    if team and "team_members" in team:
        gaps = engine.report_skill_gaps(team["team_members"])
        print("Skill Gaps:", gaps)
    else:
        print("No team formed.")
