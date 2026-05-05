// frontend/src/pages/Home.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContestCard from "../components/ContestCard";
import "../styles/global.css";
import { getFinishedContests, getActiveAndUpcomingContests } from "../utils/contestUtils";

function Home() {
  const navigate = useNavigate();
  const [allContests, setAllContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    const fetchContests = async (withAuth = true) => {
      const headers = withAuth && token 
        ? { Authorization: `Bearer ${token}` } 
        : {};
      
      const res = await fetch("http://127.0.0.1:8000/contests", { headers });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    };

    fetchContests(true)
      .catch(async (err) => {
        console.warn("Auth request failed:", err.message);
        if (err.message.includes("403") || err.message.includes("401")) {
          return fetchContests(false);
        }
        throw err;
      })
      .then((data) => {
        setAllContests(data);
      })
      .catch((err) => {
        console.error("Failed to load contests:", err);
        setAllContests([]); 
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); 

  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");
  const isAuth = !!token;

  const safeContests = Array.isArray(allContests) ? allContests : [];
  const finished = getFinishedContests(allContests);
  const activeAndUpcoming = getActiveAndUpcomingContests(allContests);

  const handleAction = (contest) => {
    if (!isAuth) {
      alert("Чтобы участвовать в контестах, необходимо войти в систему.");
      navigate("/login");
      return;
    }
    navigate(`/contests/${contest.contest_id}`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="page-layout" style={{ paddingTop: "100px", textAlign: "center", color: "#6b7280" }}>
          Загрузка контестов...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-layout">
        
        {/* Сообщение для неавторизованных */}
        {!isAuth && (
          <div className="block" style={{ marginBottom: "24px", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <p style={{ margin: 0, color: "#1e40af", fontSize: "14px", textAlign: "center" }}>
              Чтобы участвовать в контестах и решать задачи, необходимо <strong><a href="/login" style={{ color: "#1e40af" }}>войти</a></strong>.
            </p>
          </div>
        )}

        {/* АКТИВНЫЕ И ПРЕДСТОЯЩИЕ */}
        <div className="block">
          <div className="section-header">
            <h1 className="page-title">Активные и предстоящие контесты</h1>
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
                    isAuthor={false}      
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
            {!isAuth && (
              <span className="archive-link" style={{ fontSize: "13px", color: "#6b7280" }}>
                Чтобы просматривать результаты, необходимо войти
              </span>
            )}
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
                    isAuthor={false}      
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

export default Home;