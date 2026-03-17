import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContestCard from "../components/ContestCard";

function Contests() {
  const [allContests, setAllContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  const [activeTabAvailable, setActiveTabAvailable] = useState("all");
  const [activeTabFinished, setActiveTabFinished] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (!token || !role) {
      navigate("/login");
      return;
    }

    setUserRole(role);

    fetch("http://127.0.0.1:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Auth error");
        return res.json();
      })
      .then((user) => {
        setUserId(user.user_id);
        return fetch("http://127.0.0.1:8000/contests", {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load contests");
        return res.json();
      })
      .then((data) => {
        setAllContests(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        if (err.message.includes("Auth")) {
          localStorage.clear();
          navigate("/login");
        }
      });
  }, [navigate]);

  // Логика фильтрации
  const availableContestsRaw = allContests.filter(c => c.is_upcoming || c.is_active);
  const availableContests = availableContestsRaw.filter(c => {
    if (activeTabAvailable === "my") return c.author_id === userId;
    return true;
  });

  const finishedContestsRaw = allContests.filter(c => c.is_finished);
  const finishedContests = finishedContestsRaw.filter(c => {
    if (activeTabFinished === "my") return c.author_id === userId;
    return true;
  });

  const handleAction = (contest) => {
    if (contest.is_finished) alert(`Результаты: ${contest.contest_name}`);
    else if (contest.is_active) {
      if (userRole === "organizer" && contest.author_id === userId) alert(`Управление: ${contest.contest_name}`);
      else alert(`Решение: ${contest.contest_name}`);
    } else if (contest.is_upcoming) {
      if (contest.is_participant) alert("Вы уже зарегистрированы");
      else alert(`Регистрация: ${contest.contest_name}`);
    }
  };

  if (loading) return <div style={{paddingTop: "100px", textAlign: "center"}}>Загрузка...</div>;

  return (
    <div style={{ 
      backgroundColor: "#f3f4f6",
      minHeight: "100vh", 
      paddingBottom: "40px" 
    }}>
      <Navbar />
      
      {/* 
         ГЛАВНЫЙ КОНТЕЙНЕР 
      */}
      <div style={{
        position: "absolute", 
        top: "100px",         
        left: "50%",         
        transform: "translateX(-50%)",
        width: "90%",         
        maxWidth: "1200px",   
        boxSizing: "border-box"
      }}>
        
        {/* ЗОНА 1: ДОСТУПНЫЕ */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          width: "100%" 
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: 0 }}>
              Доступные контесты
            </h2>
            {/* Группа кнопок только для организатора */}
            {userRole === "organizer" && (
              <>
                {/* Кнопка Создать */}
                <button
                  onClick={() => navigate("/contests/create")}
                  style={{
                    background: "#1f2739",
                    color: "white",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  + Создать
                </button>

                {/* 🔥 НОВАЯ КНОПКА: ЧЕРНОВИКИ 🔥 */}
                <button
                  onClick={() => navigate("/contests/drafts")}
                  style={{
                    background: "#e5e7eb", // Светлее, чтобы отличалась от главной
                    color: "#374151",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Черновики
                </button>
              </>
            )}
          </div>

            <div style={{ display: "flex", background: "#f3f4f6", padding: "4px", borderRadius: "8px" }}>
              <button onClick={() => setActiveTabAvailable("all")} style={{
                padding: "6px 12px", borderRadius: "6px", border: "none",
                background: activeTabAvailable === "all" ? "#ffffff" : "transparent",
                color: activeTabAvailable === "all" ? "#111827" : "#6b7280",
                fontWeight: activeTabAvailable === "all" ? "600" : "500",
                cursor: "pointer", fontSize: "13px"
              }}>Все</button>
              
              {userRole === "organizer" && (
                <button onClick={() => setActiveTabAvailable("my")} style={{
                  padding: "6px 12px", borderRadius: "6px", border: "none",
                  background: activeTabAvailable === "my" ? "#ffffff" : "transparent",
                  color: activeTabAvailable === "my" ? "#111827" : "#6b7280",
                  fontWeight: activeTabAvailable === "my" ? "600" : "500",
                  cursor: "pointer", fontSize: "13px"
                }}>Мои</button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "10px" }}>
            {availableContests.length === 0 ? (
              <span style={{ color: "#9ca3af", fontSize: "14px", padding: "10px" }}>Список пуст</span>
            ) : (
              availableContests.map(c => (
                <div key={c.contest_id} style={{ minWidth: "280px", maxWidth: "280px", flexShrink: 0 }}>
                  <ContestCard contest={c} userRole={userRole} isAuthor={c.author_id === userId} onAction={handleAction} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ЗОНА 2: ЗАВЕРШЕННЫЕ */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          width: "100%"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: 0 }}>Завершенные контесты</h2>
            
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ display: "flex", background: "#f3f4f6", padding: "4px", borderRadius: "8px" }}>
                <button onClick={() => setActiveTabFinished("all")} style={{
                  padding: "6px 12px", borderRadius: "6px", border: "none",
                  background: activeTabFinished === "all" ? "#ffffff" : "transparent",
                  color: activeTabFinished === "all" ? "#111827" : "#6b7280",
                  fontWeight: activeTabFinished === "all" ? "600" : "500",
                  cursor: "pointer", fontSize: "13px"
                }}>Все</button>
                
                {userRole === "organizer" && (
                  <button onClick={() => setActiveTabFinished("my")} style={{
                    padding: "6px 12px", borderRadius: "6px", border: "none",
                    background: activeTabFinished === "my" ? "#ffffff" : "transparent",
                    color: activeTabFinished === "my" ? "#111827" : "#6b7280",
                    fontWeight: activeTabFinished === "my" ? "600" : "500",
                    cursor: "pointer", fontSize: "13px"
                  }}>Мои</button>
                )}
              </div>
              <span style={{ fontSize: "13px", color: "#6b7280", cursor: "pointer", textDecoration: "underline" }}>
                Весь архив &rarr;
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "10px" }}>
            {finishedContests.length === 0 ? (
              <span style={{ color: "#af9ca1", fontSize: "14px", padding: "10px" }}>Список пуст</span>
            ) : (
              finishedContests.map(c => (
                <div key={c.contest_id} style={{ minWidth: "280px", maxWidth: "280px", flexShrink: 0 }}>
                  <ContestCard contest={c} userRole={userRole} isAuthor={c.author_id === userId} onAction={handleAction} />
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