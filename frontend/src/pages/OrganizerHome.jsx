import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContestCard from "../components/ContestCard";
import { getFinishedContests, getActiveAndUpcomingContests } from "../utils/contestUtils";
import { contestsApi } from "../api/contests";
import { usersApi } from "../api/users";
import "../styles/global.css";

function OrganizerHome() {
  const navigate = useNavigate();
  const [allContests, setAllContests] = useState([]);
  const [userStats, setUserStats] = useState({ tasks: 0, contests: 0 });
  const [loading, setLoading] = useState(true);
  
  const token = localStorage.getItem("access_token");
  const userId = localStorage.getItem("user_id");
  const role = "organizer";
  const isAuth = !!token;

  useEffect(() => {
    if (!token) { 
      navigate("/login"); 
      return; 
    }

    const loadData = async () => {
      try {
        const user = await usersApi.getCurrent();
        
        setUserStats({
          tasks: user.authored_tasks_count || 0,
          contests: user.organized_contests_count || 0
        });

        const data = await contestsApi.getAll();

        if (Array.isArray(data)) {
          setAllContests(data);
        } else {
          console.error("Получены некорректные данные контестов (не массив):", data);
          setAllContests([]);
        }

      } catch (err) {
        console.error("Ошибка при загрузке:", err);
        
        if (err.message?.includes("401")) {
          localStorage.clear();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, token]);

  const safeContests = Array.isArray(allContests) ? allContests : [];
  
  const finished = getFinishedContests(safeContests);
  const activeAndUpcoming = getActiveAndUpcomingContests(safeContests);

  const handleAction = (contest) => {
    if (contest.is_finished) navigate(`/contests/${contest.contest_id}`);
    else if (contest.is_active) navigate(`/contests/${contest.contest_id}`);
    else if (contest.is_upcoming) navigate(`/contests/${contest.contest_id}`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ paddingTop: "200px", textAlign: "center", color: "#6b7280" }}>
          Загрузка дашборда...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      
      <div className="page-main-container">
        
        {/* СТАТИСТИКА */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3 className="stat-title">Создано задач</h3>
            <div className="stat-value">{userStats.tasks}</div>
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Проведено контестов</h3>
            <div className="stat-value">{userStats.contests}</div>
          </div>
        </div>

        {/* ДОСТУПНЫЕ КОНТЕСТЫ */}
        <div className="section">
          <div className="section-header">
            <h1 className="page-title">Доступные контесты</h1>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => navigate("/contests/create")} className="btn btn-primary">
                + Создать
              </button>
            </div>
          </div>
          
          <div className="cards-row">
            {activeAndUpcoming.length === 0 ? (
              <span className="empty-text">Нет активных контестов</span>
            ) : (
              activeAndUpcoming.map(c => (
                <div key={c.contest_id} className="card-wrapper">
                  <ContestCard 
                    contest={c} 
                    userRole={role} 
                    isAuthor={c.author_id == userId}
                    isAuth={isAuth}
                    onAction={handleAction} 
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ЗАВЕРШЕННЫЕ КОНТЕСТЫ */}
        <div className="section">
          <div className="section-header">
            <h2 className="page-title">Завершенные контесты</h2>
            <span className="archive-link" onClick={() => navigate("/archive")}>
              Перейти к архиву &rarr;
            </span>
          </div>
          
          <div className="cards-row">
            {finished.length === 0 ? (
              <span className="empty-text">Нет завершенных контестов</span>
            ) : (
              finished.map(c => (
                <div key={c.contest_id} className="card-wrapper">
                  <ContestCard 
                    contest={c} 
                    userRole={role} 
                    isAuthor={c.author_id == userId}
                    isAuth={isAuth}
                    onAction={handleAction} 
                  />
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default OrganizerHome;