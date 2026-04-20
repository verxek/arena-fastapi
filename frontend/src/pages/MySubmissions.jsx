import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

function MySubmissions() {
  const [solutions, setSolutions] = useState([]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("access_token");

  const location = useLocation();
  const taskId = location.state?.taskId;


  useEffect(() => {
    const loadSolutions = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/solutions/my?user_id=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await res.json();

        if (Array.isArray(data)) {
          setSolutions(data);
        } else {
          setSolutions([]);
        }
      } catch (err) {
        console.error(err);
        setSolutions([]);
      }
    };

    loadSolutions();
  }, [userId, token]);

  return (
    <div>
      <Navbar />

      <div style={{ padding: "120px 40px" }}>
        
        {/* КНОПКА ВОЗВРАТА */}
        {taskId && (
          <button
            onClick={() => navigate(`/tasks/${taskId}`)}
            style={{
              marginBottom: "20px",
              padding: "13px 15px",
              background: "#272a2e",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            ← Вернуться к задаче
          </button>
        )}

        <h2 style={{ marginBottom: "20px" }}>Мои отправления</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={styles.th}>№</th>
                <th style={styles.th}>Время</th>
                <th style={styles.th}>Задача</th>
                <th style={styles.th}>Язык</th>
                <th style={styles.th}>Вердикт</th>
              </tr>
            </thead>

            <tbody>
              {solutions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.emptyCell}>
                    Пока нет отправок
                  </td>
                </tr>
              ) : (
                solutions.map((s, index) => (
                  <tr key={s.id}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      {new Date(s.time).toLocaleString()}
                    </td>
                    <td style={styles.td}>{s.task || "-"}</td>
                    <td style={styles.td}>{s.language || "-"}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          color:
                            s.status === "Accepted"
                              ? "green"
                              : s.status === "Wrong Answer"
                              ? "red"
                              : "#f59e0b",
                          fontWeight: "500"
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
  );
}

const styles = {
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #e5e7eb",
    fontWeight: "600",
    color: "#374151",
    whiteSpace: "nowrap"
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f3f4f6",
    color: "#6b7280"
  },
  emptyCell: {
    textAlign: "center",
    padding: "40px",
    color: "#9ca3af"
  }
};

export default MySubmissions;