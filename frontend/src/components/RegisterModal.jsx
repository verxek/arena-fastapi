// frontend/src/components/RegisterModal.jsx
import { useState } from "react";
import Modal from "./Modal";

function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    nickname: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setStep(1);
    setFormData({ email: "", code: "", nickname: "", password: "" });
    setError("");
    onClose();
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/register/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Ошибка отправки кода");
      }

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/register/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formData.email,
          code: formData.code 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Неверный код подтверждения");
      }

      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          nickname: formData.nickname,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Ошибка регистрации");
      }

      handleClose();
      onSwitchToLogin();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Регистрация участника">
      <form onSubmit={step === 1 ? handleSendCode : step === 2 ? handleVerifyCode : handleRegister} 
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {error && (
          <div style={{ 
            padding: "12px", 
            background: "#fef2f2", 
            color: "#dc2626", 
            borderRadius: "8px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <div>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={styles.input}
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Отправка..." : "Получить код"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
              Введите код из письма<br/>
              <span style={{ color: "#374151" }}>{formData.email}</span>
            </div>
            <div>
              <label style={styles.label}>Код подтверждения</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                style={{...styles.input, textAlign: "center", fontSize: "24px", letterSpacing: "8px"}}
                placeholder="000000"
                required
                autoFocus
                maxLength={6}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || formData.code.length !== 6}
              style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Проверка..." : "Подтвердить"}
            </button>
            <button 
              type="button"
              onClick={() => setStep(1)}
              style={{ ...styles.button, background: "#f3f4f6", color: "#374151" }}
            >
              Изменить email
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ 
              padding: "12px", 
              background: "#eff6ff", 
              borderRadius: "8px",
              fontSize: "13px",
              color: "#1e40af"
            }}>
              Email подтверждён. Теперь создайте аккаунт.<br/>
              <strong>Роль: Участник</strong>
            </div>

            <div>
              <label style={styles.label}>Никнейм</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                style={styles.input}
                placeholder="Придумайте никнейм"
                required
                minLength={3}
                maxLength={50}
              />
            </div>

            <div>
              <label style={styles.label}>Пароль</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={styles.input}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </button>
          </>
        )}

        {/* Инфо для организаторов */}
        <div style={{ 
          marginTop: "16px", 
          padding: "12px", 
          background: "#fffbeb", 
          borderRadius: "8px",
          fontSize: "13px",
          color: "#92400e",
          textAlign: "center"
        }}>
          Хотите стать организатором?<br/>
          <strong>Свяжитесь с администрацией</strong>
        </div>
      </form>
    </Modal>
  );
}

const styles = {
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px"
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s"
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#1f2739",
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer"
  }
};

export default RegisterModal;