import { useState } from "react";
import Modal from "./Modal";
import { submitSolution } from "../api/solutions";

function SubmitModal({ task, isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [lang, setLang] = useState(1);
  const [submitting, setSubmitting] = useState(false); 

  const submit = async () => {
    if (!file) {
      alert("Выберите файл с решением");
      return;
    }

    setSubmitting(true);
    
    const formData = new FormData();
    formData.append("task_id", task.task_id);
    formData.append("language_id", lang);
    formData.append("file", file);

    try {
      await submitSolution(formData);
      
      alert("Решение отправлено");
      onClose();
      
    } catch (e) {
      console.error("Submit error:", e);
      alert(e.message || "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Отправка решения">
      <div className="form">
        <div>
          <label className="form-label">Язык</label>
          <select 
            onChange={(e) => setLang(e.target.value)} 
            className="modal-select"
            disabled={submitting}  
          >
            <option value={1}>Python 3.8</option>
            <option value={2}>C++ 20</option>
          </select>
        </div>

        <div>
          <label className="form-label">Файл</label>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])} 
            className="modal-file-input"
            disabled={submitting} 
          />
        </div>

        <div className="modal-buttons">
          <button 
            onClick={submit} 
            disabled={submitting}  
            className="btn btn-primary full-width"
          >
            {submitting ? "Отправка..." : "Отправить"}
          </button>

          <button 
            onClick={onClose} 
            disabled={submitting}  
            className="btn btn-secondary full-width"
          >
            Отмена
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default SubmitModal;