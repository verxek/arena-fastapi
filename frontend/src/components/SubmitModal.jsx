import { useState } from "react";
import Modal from "./Modal";
import { solutionsApi } from "../api/solutions";

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
      await solutionsApi.submit(formData);
      
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

      <label>Язык</label>
      <select 
        onChange={(e) => setLang(e.target.value)} 
        style={{ width: "100%", padding: "8px" }}
        disabled={submitting}  
      >
        <option value={1}>Python 3.8</option>
        <option value={2}>C++ 20</option>
      </select>

      <label style={{ marginTop: "10px", display: "block" }}>Файл</label>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files[0])} 
        disabled={submitting} 
      />

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button 
          onClick={submit} 
          disabled={submitting}  
          style={{
            flex: 1,
            padding: "10px",
            background: submitting ? "#6b7280" : "#111827",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: submitting ? "not-allowed" : "pointer"
          }}
        >
          {submitting ? "Отправка..." : "Отправить"}
        </button>

        <button 
          onClick={onClose} 
          disabled={submitting}  
          style={{
            flex: 1,
            padding: "10px",
            background: "#e5e7eb",
            border: "none",
            borderRadius: "8px",
            cursor: submitting ? "not-allowed" : "pointer"
          }}
        >
          Отмена
        </button>
      </div>

    </Modal>
  );
}

export default SubmitModal;