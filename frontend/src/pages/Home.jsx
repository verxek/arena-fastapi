import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContestCard from "../components/ContestCard";
import { getFinishedContests, getActiveAndUpcomingContests } from "../utils/contestUtils";
import { getAllContests, getAllContestsPublic } from "../api/contests";
import "../styles/global.css";

function Home() {
  const navigate = useNavigate();
  const [allContests, setAllContests] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");
  const isAuth = !!token;

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const data = await getAllContests();
        setAllContests(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Auth request failed:", err.message);
      
        if (err.message.includes("403") || err.message.includes("401")) {
          try {
            const data = await getAllContestsPublic();
            setAllContests(Array.isArray(data) ? data : []);
          } catch (publicErr) {
            console.error("Public request also failed:", publicErr);
            setAllContests([]);
          }
        } else {
          console.error("Failed to load contests:", err);
          setAllContests([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  const safeContests = Array.isArray(allContests) ? allContests : [];
  const finished = getFinishedContests(safeContests);
  const activeAndUpcoming = getActiveAndUpcomingContests(safeContests);

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
        <div className="page-layout page-loading-text">
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
          <div className="block home-auth-notice">
            <p className="home-auth-text">
              Чтобы участвовать в контестах и решать задачи, необходимо{" "}
              <strong>
                <a href="/login" className="home-auth-link">войти</a>
              </strong>.
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
              <span className="archive-link">
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