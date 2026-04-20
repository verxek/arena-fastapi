// frontend/src/pages/OrganizerHome.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContestCard from "../components/ContestCard";

function StudentHome() {
  const navigate = useNavigate();
  const [allContests, setAllContests] = useState([]);
  const [userStats, setUserStats] = useState({ tasks: 0, contests: 0 });
  const [loading, setLoading] = useState(true);
  
  const token = localStorage.getItem("access_token");
  const userId = localStorage.getItem("user_id");
  const role = "participant";

  useEffect(() => {
    if (!token) { 
      navigate("/login"); 
      return; 
    }

    const loadData = async () => {
      try {
        const userRes = await fetch("http://127.0.0.1:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!userRes.ok) {
          if (userRes.status === 401) {
            localStorage.clear();
            navigate("/login");
            return;
          }
          throw new Error(`Ошибка пользователя: ${userRes.status}`);
        }

        const user = await userRes.json();
      
        setUserStats({
          tasks: user.solved_tasks_count || 0,
          contests: user.participated_contests_count || 0
        });

        const contestsRes = await fetch("http://127.0.0.1:8000/contests/", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!contestsRes.ok) {
          throw new Error(`Ошибка контестов: ${contestsRes.status}`);
        }

        const data = await contestsRes.json();

        if (Array.isArray(data)) {
          setAllContests(data);
        } else {
          console.error("Получены некорректные данные контестов (не массив):", data);
          setAllContests([]);
        }

      } catch (err) {
        console.error("Ошибка при загрузке:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, token]);

  const safeContests = Array.isArray(allContests) ? allContests : [];
  
  const activeAndUpcoming = safeContests.filter(c => c.is_upcoming || c.is_active);
  const finished = safeContests.filter(c => c.is_finished);

  const handleAction = (contest) => {
    if (contest.is_finished) navigate(`/contests/${contest.contest_id}`);
    else if (contest.is_active) navigate(`/contests/${contest.contest_id}`);
    //else if (contest.is_upcoming) navigate(`/contests/${contest.contest_id}`);
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
      
      <div style={{
        position: "absolute",
          top: 130,
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          maxWidth: "1200px",
          background: "rgba(0,0,0,0)",
          borderRadius: "20px",
          padding: "0px 0px",
          justifyContent: "space-between",
          alignItems: "center",
          boxSizing: "border-box",

          
      }}>
        
        {/* СТАТИСТИКА */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "24px", 
          marginBottom: "24px"
        }}>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Решено задач</h3>
            <div style={styles.statValue}>{userStats.tasks}</div>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Участие в контестах</h3>
            <div style={styles.statValue}>{userStats.contests}</div>
          </div>
        </div>

        {/* ДОСТУПНЫЕ КОНТЕСТЫ */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Доступные контесты</h2>
          </div>
          
          <div style={styles.cardsRow}>
            {activeAndUpcoming.length === 0 ? (
              <span style={styles.emptyText}>Нет активных контестов</span>
            ) : (
              activeAndUpcoming.map(c => (
                <div key={c.contest_id} style={styles.cardWrapper}>
                  <ContestCard contest={c} userRole={role} isAuthor={c.author_id == userId} onAction={handleAction} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ЗАВЕРШЕННЫЕ КОНТЕСТЫ */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Завершенные контесты</h2>
            <span style={styles.archiveLink} onClick={() => navigate("/archive")}>Перейти к архиву &rarr;</span>
          </div>
          
          <div style={styles.cardsRow}>
            {finished.length === 0 ? (
              <span style={styles.emptyText}>Нет завершенных контестов</span>
            ) : (
              finished.map(c => (
                <div key={c.contest_id} style={styles.cardWrapper}>
                  <ContestCard contest={c} userRole={role} isAuthor={c.author_id == userId} onAction={handleAction} />
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  statCard: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    textAlign: "center"
  },
  statTitle: { margin: "0 0 10px 0", fontSize: "16px", color: "#6b7280", fontWeight: "500" },
  statValue: { fontSize: "32px", fontWeight: "700", color: "#1f2739" },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
  },
  sectionHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px"
  },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#111827", margin: 0 },
  smallBtn: { fontSize: "13px", padding: "6px 14px" },
  cardsRow: { display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "10px" },
  cardWrapper: { minWidth: "280px", maxWidth: "280px", flexShrink: 0 },
  emptyText: { color: "#9ca3af", fontSize: "14px" },
  archiveLink: { fontSize: "13px", color: "#6b7280", cursor: "pointer", textDecoration: "underline" }
};

export default StudentHome;