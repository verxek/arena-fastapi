import { useState } from "react";

function RegisterContestModal({ contest, onClose, onSuccess }) {
  const [checked, setChecked] = useState(false);
  const token = localStorage.getItem("access_token");

  const handleRegister = async () => {
    if (!checked) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/contests/${contest.contest_id}/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Ошибка регистрации");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Регистрация в контест</h2>

        <p>
          Перед участием подтвердите, что вы согласны с правилами:
        </p>

        <ul>
          <li>Нельзя списывать</li>
          <li>Нельзя использовать сторонние решения</li>
          <li>Результаты финальные</li>
        </ul>

        <label style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          Я согласен с правилами
        </label>

        <div style={styles.buttons}>
          <button onClick={onClose}>Отмена</button>

          <button
            onClick={handleRegister}
            disabled={!checked}
            style={{
              background: checked ? "#3b82f6" : "#e5e7eb",
              color: checked ? "white" : "#9ca3af",
              cursor: checked ? "pointer" : "not-allowed"
            }}
          >
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  modal: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    width: "400px"
  },
  buttons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px"
  }
};

export default RegisterContestModal;