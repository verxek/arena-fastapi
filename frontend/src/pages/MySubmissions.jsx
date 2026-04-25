import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/global.css";

function MySubmissions() {
  const [solutions, setSolutions] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("access_token");
  const taskId = location.state?.taskId;

  useEffect(() => {
    const loadSolutions = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/solutions/my?user_id=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setSolutions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setSolutions([]);
      }
    };

    loadSolutions();
  }, [userId, token]);

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-main-container">

        {/* HEADER */}
        <div className="header-row">

          <h1 className="page-title">Мои отправления</h1>

          {taskId && (
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/tasks/${taskId}`)}
            >
              ← Вернуться к задаче
            </button>
          )}

        </div>

        {/* TABLE */}
        <div className="section">

          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Время</th>
                  <th>Задача</th>
                  <th>Язык</th>
                  <th>Вердикт</th>
                </tr>
              </thead>

              <tbody>
                {solutions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      Пока нет отправок
                    </td>
                  </tr>
                ) : (
                  solutions.map((s, index) => (
                    <tr key={s.id}>
                      <td>{index + 1}</td>
                      <td>{new Date(s.time).toLocaleString()}</td>
                      <td>{s.task || "-"}</td>
                      <td>{s.language || "-"}</td>
                      <td>
                        <span
                          style={{
                            color:
                              s.status === "Accepted"
                                ? "green"
                                : s.status === "Wrong Answer"
                                ? "red"
                                : "#f59e0b",
                            fontWeight: "500",
                          }}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}

export default MySubmissions;