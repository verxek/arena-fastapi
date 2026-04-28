import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterContestModal from "./RegisterContestModal";

import { RiTimeLine } from "react-icons/ri";
import { MdOutlineDateRange, MdOutlinePeople } from "react-icons/md";
import { GrCubes } from "react-icons/gr";

import "../styles/global.css";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getHours(durationStr) {
  if (!durationStr) return "0 ч";
  return Number(durationStr.split(":")[0]) + " ч";
}

function ContestCard({ contest, userRole, isAuthor, onAction }) {
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  const isParticipant = contest.is_participant;
  const isActive = contest.is_active;
  const isUpcoming = contest.is_upcoming;

  let statusText = "Завершен";
  let statusColor = "#6b7280";

  if (isUpcoming) {
    statusText = "Скоро";
    statusColor = "#3b82f6";
  } else if (isActive) {
    statusText = "Активен";
    statusColor = "#10b981";
  }

  let btnText = "";
  let btnDisabled = false;
  let isEdit = false;

  if (isAuthor) {
    if (isUpcoming) {
      btnText = "Редактировать";
      isEdit = true;
    } else if (isActive) btnText = "Войти в контест";
    else btnText = "Результаты";
  } else if (isParticipant) {
    if (isActive) btnText = "Решать";
    else if (isUpcoming) {
      btnText = "Вы участвуете";
      btnDisabled = true;
    } else btnText = "Результаты";
  } else {
    if (isUpcoming) btnText = "Зарегистрироваться";
    else if (isActive) {
      btnText = "Только для участников";
      btnDisabled = true;
    } else btnText = "Результаты";
  }

  const handleClick = () => {
    if (isEdit) {
      navigate(`/contests/${contest.contest_id}/edit`);
      return;
    }

    if (btnText === "Зарегистрироваться") {
      setShowRegister(true);
      return;
    }

    onAction(contest);
  };

  return (
    <div className="contest-card">

      {/* HEADER */}
      <div className="contest-card-header">
        <h3 className="contest-card-title">
          <span className="title-row">
            <GrCubes size={20} />
            {contest.contest_name}
          </span>
        </h3>

        <span
          className="contest-status"
          style={{
            background: `${statusColor}15`,
            color: statusColor,
          }}
        >
          {statusText}
        </span>
      </div>

      {/* INFO */}
      <div className="contest-info">

        <div className="contest-info-row">
          <MdOutlineDateRange />
          {formatDate(contest.start_time)}
        </div>

        <div className="contest-info-row">
          <RiTimeLine />
          {getHours(contest.contest_duration_str)}
        </div>

        <div className="contest-info-row">
          <MdOutlinePeople />
          {contest.total_participants || 0} участников
        </div>

      </div>

      {/* BUTTON */}
      <button
        className={`contest-btn ${btnDisabled ? "disabled" : "primary"}`}
        onClick={handleClick}
        disabled={btnDisabled}
      >
        {btnText}
      </button>

      {/* MODAL */}
      {showRegister && (
        <RegisterContestModal
          contest={contest}
          onClose={() => setShowRegister(false)}
          onSuccess={() => alert("Вы зарегистрированы!")}
        />
      )}
    </div>
  );
}

export default ContestCard;