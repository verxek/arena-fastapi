// frontend/src/pages/Home.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContestCard from "../components/ContestCard";

function Home() {
  const navigate = useNavigate();
  const [allContests, setAllContests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Проверяем авторизацию
  const token = localStorage.getItem("access_token");
  const isAuth = !!token;

  useEffect(() => {

    fetch("http://127.0.0.1:8000/contests", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
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
      });
  }, [token]);

  // Фильтрация контестов
  const activeAndUpcoming = allContests.filter(c => c.is_upcoming || c.is_active);
  const finished = allContests.filter(c => c.is_finished);

  const handleAction = (contest) => {
    if (!isAuth) {
      alert("Чтобы участвовать в контестах, необходимо войти в систему.");
      navigate("/login");
    } else {
      // Если авторизован
      if (contest.is_finished) navigate(`/contests/${contest.contest_id}`);
      else if (contest.is_active) navigate(`/contests/${contest.contest_id}`);
      else if (contest.is_upcoming) navigate(`/contests/${contest.contest_id}`);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ paddingTop: "150px", textAlign: "center", color: "#6b7280" }}>
          Загрузка контестов...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />

      <div style={{
        position: "absolute", 
        top: "140px",          
        left: "50%",         
        transform: "translateX(-50%)",
        width: "90%",         
        maxWidth: "1200px",   
        boxSizing: "border-box"
      }}>
        
        {/* Сообщение для неавторизованных */}
        {!isAuth && (
          <div style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e40af",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "24px",
            fontSize: "14px",
            textAlign: "center"
          }}>
           Чтобы участвовать в контестах и решать задачи, необходимо <strong><a href="/login" style={{color: "#1e40af"}}>войти</a></strong>.
          </div>
        )}

        {/*  АКТИВНЫЕ И ПРЕДСТОЯЩИЕ */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: "0 0 20px 0" }}>
            Активные и предстоящие контесты
          </h2>

          <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "10px" }}>
            {activeAndUpcoming.length === 0 ? (
              <span style={{ color: "#9ca3af", fontSize: "14px" }}>Нет активных контестов</span>
            ) : (
              activeAndUpcoming.map(c => (
                <div key={c.contest_id} style={{ minWidth: "280px", maxWidth: "280px", flexShrink: 0 }}>
                  <ContestCard 
                    contest={c} 
                    userRole={null}       
                    isAuthor={false}      
                    onAction={handleAction} 
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ЗАВЕРШЕННЫЕ */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: 0 }}>
              Завершенные контесты
            </h2>
            {!isAuth && (
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                Чтобы просматривать результаты, необходимо войти
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "10px" }}>
            {finished.length === 0 ? (
              <span style={{ color: "#9ca3af", fontSize: "14px" }}>Нет завершенных контестов</span>
            ) : (
              finished.map(c => (
                <div key={c.contest_id} style={{ minWidth: "280px", maxWidth: "280px", flexShrink: 0 }}>
                  <ContestCard 
                    contest={c} 
                    userRole={null}      
                    isAuthor={false}      
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

export default Home;