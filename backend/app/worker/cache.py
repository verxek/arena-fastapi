def cache_key(task_id, file_hash):
    return f"compile:{task_id}:{file_hash}"