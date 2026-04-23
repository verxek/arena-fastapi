// frontend/src/components/ContestCard.jsx
import React from 'react';
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import RegisterContestModal from "./RegisterContestModal";

function ContestCard({ contest, userRole, isAuthor, onAction }) {
  const [userId, setUserId] = useState(null)
  const [showRegister, setShowRegister] = useState(false);
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
  let isRegisterButton = false;


  const isParticipant = contest.is_participant;
  const isActive = contest.is_active;
  const isUpcoming = contest.is_upcoming;
  const isFinished = contest.is_finished;

  if (isAuthor) {
    if (isUpcoming) {
      btnText = "Редактировать";
      isEditButton = true;}
    else if (isActive) btnText = "Войти в контест";
    else btnText = "Результаты";
  }
  else if (isParticipant) {
    if (isActive) btnText = "Решать";
    else if (isUpcoming) {
      btnDisabled = true;
      btnText = "Вы участвуете"; }
    else btnText = "Результаты";
  }
  else {
  if (isUpcoming) btnText = "Зарегистрироваться";
  else if (isActive){
    btnDisabled = true;
    btnText = "Только для участников";}
  else btnText = "Результаты";
}
  
  
  const navigate = useNavigate();
  const handleClick = () => {
    if (isEditButton) {
      navigate(`/contests/${contest.contest_id}/edit`);
      return;
    }

    if (isRegisterButton) {
      setShowRegister(true);
      return;
    }

    onAction(contest);
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
      {showRegister && (
          <RegisterContestModal
            contest={contest}
            onClose={() => setShowRegister(false)}
            onSuccess={() => {
              alert("Вы зарегистрированы!");
            }}
          />
        )}
    </div>
  );
}

export default ContestCard;