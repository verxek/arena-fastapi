import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContestCard from "../components/ContestCard";
import { getCurrentUser } from "../api/users";
import { getAllContests } from "../api/contests";
import { getFinishedContests } from "../utils/contestUtils";
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
        const user = await getCurrentUser();
        setUserId(user.user_id);
        setUserRole(user.role);

        const data = await getAllContests(true);
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
          <div className="archive-grid">
            {currentContests.length === 0 ? (
              <div className="empty-state">
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
            <div className="pagination">
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
          <div className="pagination-info">
            Показано {currentContests.length} из {finishedContests.length} контестов
            {userRole === "organizer" && activeTabFinished === "my" && " (ваши)"}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Archive;