// frontend/src/components/LoginModal.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth"; 
import Modal from "./Modal";

function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(nickname, password);

      if (!data.access_token) {
        throw new Error("Неверный логин или пароль");
      }


      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_id", data.user_id);

      const meResponse = await fetch("http://127.0.0.1:8000/users/me", {
        headers: {
          Authorization: `Bearer ${data.access_token}`
        }
      });

      if (!meResponse.ok) throw new Error("Ошибка получения данных пользователя");
      
      const user = await meResponse.json();
      localStorage.setItem("role", user.role); 


      onClose();
      setNickname("");
      setPassword("");
      
      if (user.role === "organizer") {
        navigate("/organizer");
      } else {
        navigate("/student");
      }
      
    } catch (err) {
      console.error(err);
      setError(err.message || "Ошибка входа. Проверьте консоль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Вход">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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

        <div>
          <label style={styles.label}>Имя пользователя</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={styles.input}
            placeholder="Имя пользователя"
            required
            autoFocus
          />
        </div>

        <div>
          <label style={styles.label}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="Пароль"
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
          style={{ 
            ...styles.button, 
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Вход..." : "Войти"}
        </button>
        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", color: "#6b7280" }}>
        Нет аккаунта?{" "}
        <span 
            onClick={() => {
            onClose();
            onSwitchToRegister(); 
            }}
            style={{ 
            color: "#2563eb", 
            cursor: "pointer", 
            textDecoration: "underline",
            fontWeight: "500"
            }}
        >
            Зарегистрироваться
        </span>
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
    marginTop: "8px"
  }
};

export default LoginModal;