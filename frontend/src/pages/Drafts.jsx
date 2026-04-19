// frontend/src/pages/Drafts.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Drafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    const uid = localStorage.getItem("user_id");
    
    setUserId(uid);

    if (!token || role !== "organizer") {
      navigate("/");
      return;
    }

    // Загрузка черновиков
    fetch("http://127.0.0.1:8000/contests/drafts", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then(data => {
        setDrafts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  const handleEdit = (contest) => {
    navigate(`/contests/${contest.contest_id}/edit`);
  };

  const handleDelete = async (contestId) => {
    if (!window.confirm("Удалить этот черновик?")) return;
    
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/contests/${contestId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDrafts(prev => prev.filter(c => c.contest_id !== contestId));
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка удаления");
    }
  };

  const handlePublish = async (contestId) => {
    if (!window.confirm("Опубликовать контест?")) return;
    
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/contests/${contestId}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDrafts(prev => prev.filter(c => c.contest_id !== contestId));
        navigate("/contests");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка публикации");
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-text">Загрузка черновиков...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      
      <div className="card" style={{ 
        position: "absolute", 
        top: "130px",         
        left: "50%",         
        transform: "translateX(-50%)",
        width: "90%",         
        maxWidth: "1200px",   
        boxSizing: "border-box",
        display: "flex",     
        flexDirection: "column",
        gap: "24px"     
      }}>
        
        {/* Заголовок */}
        <div className="header-row">
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: 0 }}>
                 Черновики контестов
              </h2>
          <button 
            onClick={() => navigate("/contests/create")}
            className="btn btn-primary"
          >
            + Новый черновик
          </button>
        </div>

        {/* Список черновиков */}
        {drafts.length === 0 ? (
          <div className="empty-state">
            <p>У вас нет черновиков</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {drafts.map(draft => (
              <div 
                key={draft.contest_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px"
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#1f2739" }}>
                    {draft.contest_name || "Без названия"}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                    {draft.start_time 
                      ? `Старт: ${new Date(draft.start_time).toLocaleDateString("ru-RU")}` 
                      : "Дата не установлена"}
                    {" • "}
                    {draft.tasks?.length || 0} задач
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleEdit(draft)}
                    className="btn btn-secondary btn-sm"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handlePublish(draft.contest_id)}
                    className="btn btn-primary btn-sm"
                    style={{ background: "#10b981" }}
                  >
                    Опубликовать
                  </button>
                  <button
                    onClick={() => handleDelete(draft.contest_id)}
                    className="btn btn-secondary btn-sm"
                    style={{ background: "#fee2e2", color: "#dc2626" }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Drafts;