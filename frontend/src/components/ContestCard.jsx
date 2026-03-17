// frontend/src/components/ContestCard.jsx
import React from 'react';

function ContestCard({ contest, userRole, isAuthor, onAction }) {
  // Определение статуса и цветов
  let statusText = "Завершен";
  let statusColor = "#6b7280";
  
  if (contest.is_upcoming) { statusText = "Скоро"; statusColor = "#3b82f6"; }
  else if (contest.is_active) { statusText = "Активен"; statusColor = "#10b981"; }

  // Логика кнопки
  let btnText = "";
  let btnDisabled = false;

  if (contest.is_finished) {
    btnText = "Результаты";
  } else if (contest.is_active) {
    if (isAuthor) btnText = "Управлять";
    else if (contest.is_participant) btnText = "Решать";
    else { btnText = "Только для участников"; btnDisabled = true; }
  } else if (contest.is_upcoming) {
    if (contest.is_participant) { btnText = "Вы участвуете"; btnDisabled = true; }
    else btnText = "Зарегистрироваться";
  }

  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "20px",
      background: "white",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", color: "#1f2739" }}>{contest.contest_name}</h3>
        <span style={{ 
          fontSize: "12px", padding: "4px 8px", borderRadius: "6px", 
          background: `${statusColor}20`, color: statusColor, fontWeight: "bold" 
        }}>
          {statusText}
        </span>
      </div>

      <div style={{ fontSize: "14px", color: "#666", marginBottom: "20px", flexGrow: 1 }}>
        <div>📅 {new Date(contest.start_time).toLocaleDateString()}</div>
        <div>⏳ {contest.contest_duration_str}</div>
        <div>👥 {contest.total_participants || 0}</div>
      </div>

      <button
        onClick={() => onAction(contest)}
        disabled={btnDisabled}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "none",
          background: btnDisabled ? "#f3f4f6" : "#1f2739",
          color: btnDisabled ? "#9ca3af" : "white",
          cursor: btnDisabled ? "not-allowed" : "pointer",
          fontWeight: "600"
        }}
      >
        {btnText}
      </button>
    </div>
  );
}

export default ContestCard;