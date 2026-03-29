// frontend/src/components/ContestCard.jsx
import React from 'react';

function ContestCard({ contest, userRole, isAuthor, onAction }) {

  let statusText = "Завершен";
  let statusColor = "#6b7280"; 

  if (contest.is_upcoming) { 
    statusText = "Скоро"; 
    statusColor = "#3b82f6"; 
  } else if (contest.is_active) { 
    statusText = "Активен"; 
    statusColor = "#10b981"; 
  } 

  let btnText = "";
  let btnDisabled = false;
  let isEditButton = false; 


  if (userRole === 'organizer' && isAuthor && !(contest.is_finished)) {
    btnText = "Редактировать";
    btnDisabled = false;
    isEditButton = true;
  } 
 
  else {
    if (contest.is_finished) {
      btnText = "Результаты";
    } else if (contest.is_active) {
      if (isAuthor && userRole !== 'organizer') { 
        btnText = "Управлять"; 
      } else if (contest.is_participant) { 
        btnText = "Решать"; 
      } else { 
        btnText = "Только для участников"; 
        btnDisabled = true; 
      }
    } else if (contest.is_upcoming) {
      if (contest.is_participant) { 
        btnText = "Вы участвуете"; 
        btnDisabled = true; 
      } else { 
        btnText = "Зарегистрироваться"; 
      }
    }
  }


  const handleClick = () => {
    if (isEditButton) {
      window.location.href = `/contests/${contest.contest_id}/edit`;
    } else {
      onAction(contest);
    }
  };

  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "20px",
      background: "white",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      height: "100%", 
      boxSizing: "border-box"
    }}>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "flex-start" }}>
        <h3 style={{ margin: 0, fontSize: "18px", color: "#1f2739", lineHeight: "1.2" }}>
          {contest.contest_name}
        </h3>
        <span style={{ 
          fontSize: "11px", padding: "4px 8px", borderRadius: "6px", 
          background: `${statusColor}15`, color: statusColor, fontWeight: "700",
          whiteSpace: "nowrap", marginLeft: "10px"
        }}>
          {statusText}
        </span>
      </div>

      <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px", flexGrow: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{display: "flex", alignItems: "center", gap: "6px"}}>
          <span></span> {new Date(contest.start_time).toLocaleDateString()}
        </div>
        <div style={{display: "flex", alignItems: "center", gap: "6px"}}>
          <span></span> {contest.contest_duration_str || "00:00:00"}
        </div>
        <div style={{display: "flex", alignItems: "center", gap: "6px"}}>
          <span></span> {contest.total_participants || 0} участников
        </div>
      </div>

      {/* Кнопка */}
      <button
        onClick={handleClick}
        disabled={btnDisabled}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "none",
          background: btnDisabled ? "#f3f4f6" : "#1f2739",
          color: btnDisabled ? "#9ca3af" : "white",
          cursor: btnDisabled ? "not-allowed" : "pointer",
          fontWeight: "600",
          fontSize: "14px",
          transition: "background 0.2s"
        }}
        onMouseEnter={(e) => {
          if (!btnDisabled) e.target.style.background = "#374151";
        }}
        onMouseLeave={(e) => {
          if (!btnDisabled) e.target.style.background = "#1f2739";
        }}
      >
        {btnText}
      </button>
    </div>
  );
}

export default ContestCard;