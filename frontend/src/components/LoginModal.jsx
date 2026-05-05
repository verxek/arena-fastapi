// frontend/src/components/LoginModal.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import Modal from "./Modal";
import { GrCodeSandbox } from "react-icons/gr";
import { FaUser, FaLock } from "react-icons/fa";
import "../styles/global.css";

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

      if (!data?.access_token) {
        throw new Error("Неверный логин или пароль");
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("role", data.role);

      setNickname("");
      setPassword("");

      onClose();

      setTimeout(() => {
        if (data.role === "admin") navigate("/admin");
        else if (data.role === "organizer") navigate("/organizer");
        else navigate("/student");
      }, 50);

    } catch (err) {
      console.error(err);
      setError(err.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="login-modal">
        
        {/* Логотип на чёрном фоне */}
        <div className="login-logo-section">
          
          <h2 className="login-title">С возвращением!</h2>
          <p className="login-subtitle">
            Войдите, чтобы продолжить участие в контестах
          </p>
        </div>

        {/* Форма с вашими классами из global.css */}
        <form className="form" onSubmit={handleSubmit}>
          
          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="label input-with-icon">
              <FaUser className="input-icon" />
              Имя пользователя
            </label>
            <input
              className="input-field"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Введите имя пользователя"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="label input-with-icon">
              <FaLock className="input-icon" />
              Пароль
            </label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary full-width login-submit"
            disabled={loading}
          >
            {loading ? "Вход..." : "Войти"}
          </button>

          <div className="modal-footer">
            Нет аккаунта?{" "}
            <span
              className="link"
              onClick={() => {
                onClose();
                onSwitchToRegister();
              }}
            >
              Зарегистрироваться
            </span>
          </div>

        </form>
      </div>
    </Modal>
  );
}

export default LoginModal;