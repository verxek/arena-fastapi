import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContestCard from "../components/ContestCard";
import { usersApi } from "../api/users";
import { contestsApi } from "../api/contests";
import { getActiveAndUpcomingContests, getFinishedContests } from "../utils/contestUtils";
import "../styles/global.css";

function Contests() {
  const [allContests, setAllContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  const [activeTabAvailable, setActiveTabAvailable] = useState("all");
  const [activeTabFinished, setActiveTabFinished] = useState("all");
  const isAuth = !!localStorage.getItem("access_token");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (!token || !role) {
      navigate("/login");
      return;
    }

    setUserRole(role);

    const loadData = async () => {
      try {
        const user = await usersApi.getCurrent();
        setUserId(user.user_id);

        const data = await contestsApi.getAll();
        setAllContests(data);
        
      } catch (err) {
        console.error("Failed to load data:", err);
  
        if (err.message?.includes("401") || err.message?.includes("Auth")) {
          localStorage.clear();
          navigate("/login");
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const sortedActiveRaw = getActiveAndUpcomingContests(allContests);
  const sortedFinishedRaw = getFinishedContests(allContests);

  const availableContests = activeTabAvailable === "my" 
    ? sortedActiveRaw.filter(c => c.author_id === userId)
    : sortedActiveRaw;

  const finishedContests = activeTabFinished === "my"
    ? sortedFinishedRaw.filter(c => c.author_id === userId)
    : sortedFinishedRaw;

  const handleAction = (contest) => {
    if (contest.is_finished) navigate(`/contests/${contest.contest_id}`);
    else if (contest.is_active) navigate(`/contests/${contest.contest_id}`);
    else if (contest.is_upcoming) navigate(`/contests/${contest.contest_id}`);
  };

  // Индикатор загрузки
  if (loading) {
    return (
      <div style={{ paddingTop: "100px", textAlign: "center" }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-layout">

        {/* ДОСТУПНЫЕ */}
        <div className="block">
          <div className="section-header">
            <h1 className="page-title">Доступные контесты</h1>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              
              {userRole === "organizer" && (
                <>
                  <button
                    onClick={() => navigate("/contests/create")}
                    className="btn btn-primary"
                  >
                    + Создать
                  </button>

                  <div className="tabs-container">
                    <button
                      onClick={() => setActiveTabAvailable("all")}
                      className={`tab-btn ${activeTabAvailable === "all" ? "active" : ""}`}
                    >
                      Все
                    </button>
                    <button
                      onClick={() => setActiveTabAvailable("my")}
                      className={`tab-btn ${activeTabAvailable === "my" ? "active" : ""}`}
                    >
                      Мои
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="cards-row">
            {availableContests.length === 0 ? (
              <span className="empty-text">Список пуст</span>
            ) : (
              availableContests.map(c => (
                <div key={c.contest_id} className="card-wrapper">
                  <ContestCard
                    contest={c}
                    userRole={userRole}
                    isAuthor={c.author_id === userId}
                    isAuth={isAuth}   
                    onAction={handleAction}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ЗАВЕРШЕННЫЕ */}
        <div className="section">
          <div className="section-header">
            <h2 className="page-title">Завершенные контесты</h2>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                className="archive-link"
                onClick={() => navigate("/archive")}
              >
                Весь архив →
              </span>
              
              {userRole === "organizer" && (
                <div className="tabs-container">
                  <button
                    onClick={() => setActiveTabFinished("all")}
                    className={`tab-btn ${activeTabFinished === "all" ? "active" : ""}`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => setActiveTabFinished("my")}
                    className={`tab-btn ${activeTabFinished === "my" ? "active" : ""}`}
                  >
                    Мои
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="cards-row">
            {finishedContests.length === 0 ? (
              <span className="empty-text">Список пуст</span>
            ) : (
              finishedContests.map(c => (
                <div key={c.contest_id} className="card-wrapper">
                  <ContestCard
                    contest={c}
                    userRole={userRole}
                    isAuthor={c.author_id === userId}
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

export default Contests;