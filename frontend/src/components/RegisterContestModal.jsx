import { useState } from "react";
import { registerToContest } from "../api/contests";

function RegisterContestModal({ contest, onClose, onSuccess }) {
  const [checked, setChecked] = useState(false);
  const [registering, setRegistering] = useState(false); 

  const handleRegister = async () => {
    if (!checked) return;

    setRegistering(true);
    
    try {
      await registerToContest(contest.contest_id);
      
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
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">Регистрация в контест</h2>
        </div>

        <div className="modal-content">
          <p>
            Перед участием подтвердите, что вы согласны с правилами:
          </p>

          <ul className="rules-list">
            <li>Нельзя списывать</li>
            <li>Нельзя использовать сторонние решения</li>
            <li>Результаты финальные</li>
          </ul>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={registering}  
            />
            Я согласен с правилами
          </label>

          <div className="modal-buttons">
            <button 
              onClick={onClose} 
              disabled={registering}
              className="btn btn-secondary"
            >
              Отмена
            </button>

            <button
              onClick={handleRegister}
              disabled={!checked || registering}  
              className="btn btn-primary"
            >
              {registering ? "Регистрация..." : "Зарегистрироваться"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterContestModal;