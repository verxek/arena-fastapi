import { useState } from "react";
import Modal from "./Modal";

function SubmitModal({ task, onClose }) {
  const [file, setFile] = useState(null);
  const [lang, setLang] = useState(1);

  const submit = async () => {
    const formData = new FormData();

    formData.append("task_id", task.task_id);
    formData.append("language_id", lang);
    formData.append("file", file);

    const token = localStorage.getItem("access_token");

    await fetch("http://127.0.0.1:8000/solutions/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Отправка решения">

      <label>Язык</label>
      <select onChange={(e) => setLang(e.target.value)} style={{ width: "100%", padding: "8px" }}>
        <option value={1}>Python 3.8</option>
        <option value={2}>C++ 20</option>
      </select>

      <label style={{ marginTop: "10px", display: "block" }}>Файл</label>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={submit} style={{
          flex: 1,
          padding: "10px",
          background: "#111827",
          color: "white",
          border: "none",
          borderRadius: "8px"
        }}>
          Отправить
        </button>

        <button onClick={onClose} style={{
          flex: 1,
          padding: "10px",
          background: "#e5e7eb",
          border: "none",
          borderRadius: "8px"
        }}>
          Отмена
        </button>
      </div>

    </Modal>
  );
}

export default SubmitModal;