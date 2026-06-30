import { useState } from "react";
import Modal from "./Modal";
import { sendRegistrationCode, verifyRegistrationCode, register } from "../api/auth";

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
      await sendRegistrationCode(formData.email);
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
      await verifyRegistrationCode(formData.email, formData.code);
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
      await register({
        email: formData.email,
        nickname: formData.nickname,
        password: formData.password
      });

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
      <form 
        onSubmit={step === 1 ? handleSendCode : step === 2 ? handleVerifyCode : handleRegister} 
        className="form"
      >
        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary full-width"
              disabled={loading}
            >
              {loading ? "Отправка..." : "Получить код"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-hint">
              Введите код из письма<br/>
              <span>{formData.email}</span>
            </div>
            <div>
              <label className="form-label">Код подтверждения</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="input-field code-input"
                placeholder="000000"
                required
                autoFocus
                maxLength={6}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary full-width"
              disabled={loading || formData.code.length !== 6}
            >
              {loading ? "Проверка..." : "Подтвердить"}
            </button>
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-secondary full-width"
            >
              Изменить email
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="info-box">
              Email подтверждён. Теперь создайте аккаунт.<br/>
              <strong>Роль: Участник</strong>
            </div>

            <div>
              <label className="form-label">Никнейм</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="input-field"
                placeholder="Придумайте никнейм"
                required
                minLength={3}
                maxLength={50}
              />
            </div>

            <div>
              <label className="form-label">Пароль</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary full-width"
              disabled={loading}
            >
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </button>
          </>
        )}

        <div className="warning-box">
          Хотите стать организатором?<br/>
          <strong>Свяжитесь с администрацией</strong>
        </div>
      </form>
    </Modal>
  );
}

export default RegisterModal;