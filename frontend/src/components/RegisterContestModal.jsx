import { useState } from "react";
import { contestsApi } from "../api/contests";

function RegisterContestModal({ contest, onClose, onSuccess }) {
  const [checked, setChecked] = useState(false);
  const [registering, setRegistering] = useState(false); 

  const handleRegister = async () => {
    if (!checked) return;

    setRegistering(true);
    
    try {
      await contestsApi.register(contest.contest_id);
      
      onSuccess();
      onClose();
      
    } catch (e) {
      console.error("Registration error:", e);
      alert(e.message || "Ошибка регистрации");
    } finally {
      setRegistering(false);
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
            disabled={registering}  
          />
          Я согласен с правилами
        </label>

        <div style={styles.buttons}>
          <button 
            onClick={onClose} 
            disabled={registering} 
          >
            Отмена
          </button>

          <button
            onClick={handleRegister}
            disabled={!checked || registering}  
            style={{
              background: (!checked || registering) ? "#e5e7eb" : "#3b82f6",
              color: (!checked || registering) ? "#9ca3af" : "white",
              cursor: (!checked || registering) ? "not-allowed" : "pointer"
            }}
          >
            {registering ? "Регистрация..." : "Зарегистрироваться"}
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