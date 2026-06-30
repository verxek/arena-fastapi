import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getMySolutions, getSolutionStatus } from "../api/solutions";
import "../styles/global.css";

// Финальные статусы — для них не нужен опрос
const FINAL_STATUSES = [
  "Accepted", "Wrong Answer", "Time Limit Exceeded",
  "Memory Limit Exceeded", "Runtime Error", "Compilation Error"
];

function MySubmissions() {
  const [solutions, setSolutions] = useState([]);
  const pollTimers = useRef({});

  const navigate = useNavigate();
  const location = useLocation();

  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("access_token");

  // Функция опроса статуса одной посылки
  const startPolling = (solutionId) => {
    const poll = async () => {
      try {
        const data = await getSolutionStatus(solutionId);
        
        // Обновляем статус в стейте
        setSolutions(prev => prev.map(s => 
          s.id === solutionId ? { ...s, status: data.status } : s
        ));
        
        // Если статус финальный — останавливаем опрос
        if (FINAL_STATUSES.includes(data.status)) {
          if (pollTimers.current[solutionId]) {
            clearInterval(pollTimers.current[solutionId]);
            delete pollTimers.current[solutionId];
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };
    
    // Первый запрос сразу, потом каждые 2 секунды
    poll();
    pollTimers.current[solutionId] = setInterval(poll, 2000);
  };

  useEffect(() => {
    const loadSolutions = async () => {
      try {
        const list = await getMySolutions(userId);
        const safeList = Array.isArray(list) ? list : [];
        setSolutions(safeList);
        
        // Запускаем опрос для незавершённых решений
        safeList.forEach(s => {
          if (!FINAL_STATUSES.includes(s.status)) {
            startPolling(s.id);
          }
        });
      } catch (err) {
        console.error(err);
        setSolutions([]);
      }
    };

    if (userId && token) loadSolutions();

    // Очистка таймеров при размонтировании
    return () => {
      Object.values(pollTimers.current).forEach(clearInterval);
      pollTimers.current = {};
    };
  }, [userId, token]);

  const getVerdictClass = (status) => {
    if (status === "Accepted") return "verdict-accepted";
    if (status === "Wrong Answer") return "verdict-wrong";
    if (status === "Pending" || status === "In Queue" || status === "Processing") return "verdict-pending";
    return "verdict-error";
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-main-container">
        <div className="header-row">
          <h1 className="page-title">Мои отправления</h1>
          <Link to="/tasks" className="back-link">← Назад к списку задач</Link>
        </div>

        <div className="section">
          <div className="submissions-container">
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
                    <td colSpan="5" className="empty-state">Пока нет отправок</td>
                  </tr>
                ) : (
                  solutions.map((s, index) => (
                    <tr key={s.id}>
                      <td>{index + 1}</td>
                      <td>{new Date(s.time).toLocaleString()}</td>
                      <td>{s.task || "-"}</td>
                      <td>{s.language || "-"}</td>
                      <td>
                        <span className={getVerdictClass(s.status)}>
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