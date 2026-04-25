import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import "../styles/global.css";

function Login() {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (token && role) {
      if (role === "admin") navigate("/admin");
      else if (role === "organizer") navigate("/organizer");
      else navigate("/student");
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      const data = await login(nickname, password);

      if (!data.access_token) {
        alert("Неверный логин или пароль");
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("role", data.role);

      if (data.role === "admin") {
        navigate("/admin");
      } else if (data.role === "organizer") {
        navigate("/organizer");
      } else {
        navigate("/student");
      }
      console.log("LOGIN RESPONSE:", data);

    } catch (error) {
      console.error(error);
      alert("Ошибка входа");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f3f4f6",
      }}
    >
      <div className="card" style={{ width: "360px" }}>

        {/* TITLE */}
        <h2 className="form-title" style={{ textAlign: "center" }}>
          Contester
        </h2>

        {/* INPUTS */}
        <div className="form-group">
          <label className="label">Имя пользователя</label>
          <input
            className="input-field"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Введите логин"
          />
        </div>

        <div className="form-group">
          <label className="label">Пароль</label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
          />
        </div>

        {/* BUTTON */}
        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "10px" }}
          onClick={handleLogin}
        >
          Войти
        </button>

      </div>
    </div>
  );
}

export default Login;