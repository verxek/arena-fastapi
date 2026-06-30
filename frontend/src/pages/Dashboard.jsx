import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContestCard from "../components/ContestCard";
import { getFinishedContests, getActiveAndUpcomingContests } from "../utils/contestUtils";
import { getAllContests } from "../api/contests";
import { getCurrentUser } from "../api/users";
import "../styles/global.css";

const ROLE_CONFIG = {
  organizer: {
    stats: {
      tasks: { label: "Создано задач", field: "authored_tasks_count" },
      contests: { label: "Проведено контестов", field: "organized_contests_count" }
    },
    showCreateButton: true
  },
  student: {
    stats: {
      tasks: { label: "Решено задач", field: "solved_tasks_count" },
      contests: { label: "Участие в контестах", field: "participated_contests_count" }
    },
    showCreateButton: false
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const [allContests, setAllContests] = useState([]);
  const [userStats, setUserStats] = useState({ tasks: 0, contests: 0 });
  const [loading, setLoading] = useState(true);
  
  const token = localStorage.getItem("access_token");
  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role") || "student";
  const isAuth = !!token;

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  useEffect(() => {
    if (!token) { 
      navigate("/login"); 
      return; 
    }

    const loadData = async () => {
      try {
        const user = await getCurrentUser();
        
        setUserStats({
          tasks: user[config.stats.tasks.field] || 0,
          contests: user[config.stats.contests.field] || 0
        });

        const data = await getAllContests();

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
  }, [navigate, token, config.stats.tasks.field, config.stats.contests.field]);

  const safeContests = Array.isArray(allContests) ? allContests : [];
  
  const finished = getFinishedContests(safeContests);
  const activeAndUpcoming = getActiveAndUpcomingContests(safeContests);

  const handleAction = (contest) => {
    navigate(`/contests/${contest.contest_id}`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="page-loading-text">Загрузка дашборда...</div>
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
            <h3 className="stat-title">{config.stats.tasks.label}</h3>
            <div className="stat-value">{userStats.tasks}</div>
          </div>
          <div className="stat-card">
            <h3 className="stat-title">{config.stats.contests.label}</h3>
            <div className="stat-value">{userStats.contests}</div>
          </div>
        </div>

        {/* ДОСТУПНЫЕ КОНТЕСТЫ */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Доступные контесты</h2>
            {config.showCreateButton && (
              <button 
                onClick={() => navigate("/contests/create")} 
                className="btn btn-primary"
              >
                + Создать
              </button>
            )}
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
            <h2 className="section-title">Завершенные контесты</h2>
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

export default Dashboard;