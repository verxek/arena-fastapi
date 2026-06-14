import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContestCard from "../components/ContestCard";
import { usersApi } from "../api/users";
import { contestsApi } from "../api/contests";
import { getFinishedContests, getActiveAndUpcomingContests } from "../utils/contestUtils";
import "../styles/global.css";

function Archive() {
  const navigate = useNavigate();

  const [allContests, setAllContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTabFinished, setActiveTabFinished] = useState("all");
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const isAuth = !!localStorage.getItem("access_token");

  const itemsPerPage = 6;

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const user = await usersApi.getCurrent();
        setUserId(user.user_id);
        setUserRole(user.role);

        const data = await contestsApi.getAll(true);
        setAllContests(data);
        
      } catch (err) {
        console.error("Failed to load archive:", err);
      
        if (err.message?.includes("401")) {
          localStorage.clear();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  // === ФИЛЬТРЫ ===
  const sortedFinishedRaw = getFinishedContests(allContests);

  const finishedContests = activeTabFinished === "my"
    ? sortedFinishedRaw.filter(c => c.author_id === userId)
    : sortedFinishedRaw;

  // === ПАГИНАЦИЯ ===
  const totalPages = Math.ceil(finishedContests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentContests = finishedContests.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTabFinished]);

  const handleAction = (contest) => {
    navigate(`/contests/${contest.contest_id}`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-text">Загрузка архива...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-layout">

        <div className="block">

          {/* HEADER */}
          <div className="header-row">
            <h1 className="page-title">Архив контестов</h1>

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

          {/* GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px"
            }}
          >
            {currentContests.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
                {userRole === "organizer" && activeTabFinished === "my"
                  ? "У вас нет завершенных контестов"
                  : "Архив пуст"}
              </div>
            ) : (
              currentContests.map(c => (
                <ContestCard
                  key={c.contest_id}
                  contest={c}
                  userRole={userRole}
                  isAuthor={String(c.author_id) === String(userId)}
                  isAuth={isAuth} 
                  onAction={handleAction}
                />
              ))
            )}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb"
              }}
            >
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary btn-sm"
              >
                ← Назад
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`btn btn-sm ${currentPage === page ? "btn-primary" : "btn-secondary"}`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary btn-sm"
              >
                Вперед →
              </button>
            </div>
          )}

          {/* INFO */}
          <div
            style={{
              textAlign: "center",
              marginTop: "16px",
              fontSize: "13px",
              color: "#6b7280"
            }}
          >
            Показано {currentContests.length} из {finishedContests.length} контестов
            {userRole === "organizer" && activeTabFinished === "my" && " (ваши)"}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Archive;