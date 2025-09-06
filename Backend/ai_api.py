from flask import Blueprint, request, jsonify
import os
import pandas as pd
from ai_matchmaker import SmartMatchmakingEngineFAISS, load_csv_to_dataframe

ai_bp = Blueprint('ai_bp', __name__)

@ai_bp.route('/api/ai-matchmaker', methods=['POST'])
def ai_matchmaker_endpoint():
    """
    Expects a multipart/form-data POST request with a CSV file under the key 'file'.
    Optionally, JSON fields for required_domains and required_skills can be provided.
    Returns: JSON with best matches, formed team, and skill gap report.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No CSV file provided'}), 400
    file = request.files['file']
    if not file or not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    try:
        # Save file temporarily
        temp_path = os.path.join('/tmp' if os.name != 'nt' else os.environ.get('TEMP', '.'), file.filename)
        file.save(temp_path)
        df = pd.read_csv(temp_path)
        os.remove(temp_path)
    except Exception as e:
        return jsonify({'error': f'Failed to read CSV: {str(e)}'}), 400

    # Get requirements from form or default
    required_domains = request.form.get('required_domains')
    required_skills = request.form.get('required_skills')
    try:
        required_domains = eval(required_domains) if required_domains else None
        required_skills = eval(required_skills) if required_skills else None
    except Exception:
        required_domains = None
        required_skills = None

    # Get participant_id for matching (default: first row)
    participant_id = request.form.get('participant_id')
    if not participant_id:
        participant_id = df.iloc[0]['participant_id'] if 'participant_id' in df.columns else None
    if not participant_id:
        return jsonify({'error': 'participant_id not provided and not found in CSV.'}), 400

    # Team size (optional)
    try:
        team_size = int(request.form.get('team_size', 4))
    except Exception:
        team_size = 4

    # Instantiate engine
    engine = SmartMatchmakingEngineFAISS(
        n_clusters=3,
        required_domains=required_domains,
        required_skills=required_skills
    )
    engine.load_users_from_df(df)

    # Find matches
    matches = engine.find_matches(participant_id=participant_id, num_matches=5)
    # Form team
    team = engine.form_instant_team(initiator_id=participant_id, team_size=team_size)
    # Skill gaps
    gaps = engine.report_skill_gaps(team.get('team_members', [])) if team else {}

    return jsonify({
        'matches': matches,
        'team': team,
        'skill_gaps': gaps
    })
