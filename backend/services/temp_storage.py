import uuid

# Temporary in-memory storage
temp_storage = {}

def generate_session_id():
    """Generate a unique session identifier."""
    return str(uuid.uuid4())

def store_data(session_id, resume_text, job_description):
    """Store resume text and job description."""
    temp_storage[session_id] = {
        "resume_text": resume_text,
        "job_description": job_description
    }

def get_data(session_id):
    """Retrieve the stored data."""
    return temp_storage.get(session_id)

def clear_data(session_id):
    """Clear the stored data."""
    if session_id in temp_storage:
        del temp_storage[session_id]
