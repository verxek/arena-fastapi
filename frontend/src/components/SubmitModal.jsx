import { useState } from "react";

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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        
        <h3>Отправка решения</h3>

        <label>Язык</label>
        <select onChange={(e) => setLang(e.target.value)} style={styles.select}>
          <option value={1}>Python 3.8</option>
          <option value={2}>C++ 20</option>
        </select>

        <label>Файл</label>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={submit} style={styles.btnPrimary}>
            Отправить
          </button>

          <button onClick={onClose} style={styles.btnSecondary}>
            Отмена
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },
  modal: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    width: "400px"
  },
  select: {
    width: "100%",
    padding: "8px",
    marginBottom: "10px"
  },
  btnPrimary: {
    flex: 1,
    padding: "10px",
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: "8px"
  },
  btnSecondary: {
    flex: 1,
    padding: "10px",
    background: "#e5e7eb",
    border: "none",
    borderRadius: "8px"
  }
};

export default SubmitModal;