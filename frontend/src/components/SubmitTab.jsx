// frontend/src/components/SubmitTab.jsx
import { useState } from "react";

const SubmitTab = ({ tasks, token, onSubmitted }) => {
  const [localFile, setLocalFile] = useState(null);
  const [localSelectedTask, setLocalSelectedTask] = useState("");
  const [localSelectedLang, setLocalSelectedLang] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    
    // Валидация
    if (!localFile) {
      setError("Выберите файл с решением");
      return;
    }
    if (!localSelectedTask) {
      setError("Выберите задачу");
      return;
    }
    if (!localSelectedLang) {
      setError("Выберите язык программирования");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("task_id", localSelectedTask);
    formData.append("language_id", localSelectedLang);
    formData.append("file", localFile);

    try {
      const res = await fetch("http://127.0.0.1:8000/solutions/submit", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        // Успех
        alert("Решение отправлено");
        
        // Сброс формы
        setLocalFile(null);
        setLocalSelectedTask("");
        setLocalSelectedLang("");
        const input = document.getElementById('solution-file-submit');
        if (input) input.value = '';
        
        // Уведомляем родителя
        onSubmitted?.();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.detail || `Ошибка: ${res.statusText}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Ошибка сети. Проверьте подключение.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="submit-container">
      <div className="submit-form">
        
        {/* Сообщение об ошибке */}
        {error && (
          <div className="error-box" style={{ marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {/* Выбор языка */}
        <div className="form-group">
          <label className="label">Выберите язык программирования:</label>
          <select
            className="select"
            value={localSelectedLang}
            onChange={(e) => setLocalSelectedLang(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={submitting}
          >
            <option value="" disabled>Выберите язык</option>
            <option value="1">Python 3.8</option>
            <option value="2">C++ 20</option>
          </select>
        </div>

        {/* Выбор задачи */}
        <div className="form-group">
          <label className="label">Выберите задачу:</label>
          <select
            className="select"
            value={localSelectedTask}
            onChange={(e) => setLocalSelectedTask(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={submitting}
          >
            <option value="" disabled>Выберите задачу</option>
            {tasks.map((task, index) => {
              const taskLetter = String.fromCharCode(1040 + index);
              return (
                <option key={task.task_id} value={task.task_id}>
                  {taskLetter}. {task.task_name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Выбор файла (в стиле CreateTask) */}
        <div className="form-group">
          <label className="label">Файл с решением:</label>

          <div className="file-input-group">
            <span className="file-hint">Файл с решением (.py, .cpp)</span>
            
            <div className="file-input-wrapper">
              <input
                type="file"
                accept=".py,.cpp,.c,.java,.js"
                onChange={(e) => setLocalFile(e.target.files?.[0])}
                className="file-input"
                id="solution-file-submit"
                disabled={submitting}
              />
              <label 
                htmlFor="solution-file-submit" 
                className="file-button"
                style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {localFile ? localFile.name : "Импортировать файл с решением"}
              </label>
            </div>
            
            {/* Кнопка удаления файла */}
            {localFile && !submitting && (
              <button
                type="button"
                onClick={() => {
                  setLocalFile(null);
                  const input = document.getElementById('solution-file-submit');
                  if (input) input.value = '';
                }}
                style={{
                  background: '#fee2e2',
                  color: '#ef4444',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  marginTop: '8px'
                }}
                title="Удалить файл"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Кнопка отправки */}
        <button 
          className="submit-button btn btn-primary full-width" 
          onClick={handleSubmit}
          disabled={submitting}
          style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
        >
          {submitting ? "Отправка..." : "Отправить решение"}
        </button>

      </div>
    </div>
  );
};

export default SubmitTab;