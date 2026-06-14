import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { usersApi } from "../api/users";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    usersApi.getCurrent()
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        
        if (err.message?.includes("401")) {
          localStorage.clear();
          navigate("/login");
        }
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-text">Загрузка профиля...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-main-container">

        {/* PROFILE CARD */}
        <div className="section">
          <div className="section-header">
            <h1 className="page-title">Профиль</h1>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontSize: "15px",
              color: "#374151",
            }}
          >
            <div><b>Имя пользователя:</b> {user.nickname || "—"}</div>
            <div><b>Роль:</b> {user.role}</div>
          </div>
        </div>

        {/* STATS */}
        <div className="section">
          <div className="section-header">
            <h2 className="page-title">Статистика</h2>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-title">Создано задач</div>
              <div className="stat-value">
                {user.authored_tasks_count || 0}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Проведено контестов</div>
              <div className="stat-value">
                {user.organized_contests_count || 0}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="section">
          <div className="section-header">
            <h2 className="page-title">Действия</h2>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/tasks")}
            >
              Мои задачи
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => navigate("/contests")}
            >
              Контесты
            </button>

            <button
              className="btn btn-primary"
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
            >
              Выйти
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;