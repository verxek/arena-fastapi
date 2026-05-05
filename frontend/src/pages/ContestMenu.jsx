// frontend/src/pages/ContestMenu.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/global.css";
import { IoTimeOutline } from "react-icons/io5";
import { TfiSave } from "react-icons/tfi";
import SubmitTab from "../components/SubmitTab";
import SubmissionsTab from "../components/SubmissionsTab";
import TasksTab from "../components/TasksTab";
import RatingTab from "../components/RatingTab";



function ContestMenu() {
  const { contest_id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tasks");
  const [contest, setContest] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState("");  
  const [selectedLang, setSelectedLang] = useState(""); 
  const [file, setFile] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const isFinished = contest?.is_finished;
  const [openedTask, setOpenedTask] = useState(null);
  const [loadingTask, setLoadingTask] = useState(false);

  
  const token = localStorage.getItem("access_token");
  const userId = localStorage.getItem("user_id");
  const isOrganizer = contest?.is_organizer;
  const handleSubmit = async () => {
    if (!file || !selectedTask || !selectedLang) {
      alert("Выберите задачу, язык и файл");
      return;
    }

    const formData = new FormData();
    formData.append("task_id", selectedTask);
    formData.append("language_id", selectedLang);  
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/solutions/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        alert("Решение отправлено");
        // Опционально: сбросить форму
        setFile(null);
        setSelectedTask("");
        setSelectedLang("");
      } else {
        const error = await res.json();
        alert(`Ошибка: ${error.detail || "Неизвестная ошибка"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    }
  };
  
  useEffect(() => {
    if (!contest?.end_time) return;

    const endTime = new Date(contest.end_time).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`
      );
    }, 1000);

  return () => clearInterval(interval);
  }, [contest]);

  useEffect(() => {
    if (isFinished && (activeTab === "submit" || activeTab === "submissions")) {
      setActiveTab("tasks");
    }
  }, [isFinished]);

  const loadContestData = useCallback(async () => {
    try {
      const contestRes = await fetch(`http://127.0.0.1:8000/contests/${contest_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!contestRes.ok) {
        throw new Error(`Ошибка загрузки контеста: ${contestRes.status}`);
      }

      const contestData = await contestRes.json();
      setContest(contestData);

      const taskIds = contestData.task_list || [];
      console.log("Task IDs to load:", taskIds);
      
      if (taskIds.length > 0) {
        const params = new URLSearchParams();
        taskIds.forEach(id => params.append('task_ids', String(id)));
        
        const tasksRes = await fetch(
          `http://127.0.0.1:8000/tasks/batch?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          console.log(" Loaded tasks:", tasksData);
          setTasks(tasksData);
        } else {
          const error = await tasksRes.json();
          console.error(" Tasks error:", error);
        }
      }
    } catch (err) {
      console.error("Ошибка при загрузке:", err);
    } finally {
      setLoading(false);
    }
  }, [contest_id, token]);  

  useEffect(() => {
    loadContestData();
  }, [loadContestData]);
  
  
  

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ paddingTop: "200px", textAlign: "center", color: "#6b7280" }}>
          Загрузка контеста...
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ paddingTop: "200px", textAlign: "center", color: "#ef4444" }}>
          Контест не найден
        </div>
      </div>
    );
  }
 
  return (
    <div className="page-container">
      <Navbar />
      
      {/* Заголовок контеста */}
      <div className="header">
        <h3 className="contest-title">{contest.contest_name}</h3>
      </div>

      {/* Вкладки */}
      <div className="contest-tabs-container">
        <div className="contest-tabs">

          <button
            className={`contest-tab ${activeTab === "tasks" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            Задачи
          </button>

          {!isFinished && !isOrganizer && (
            <button
              className={`contest-tab ${activeTab === "submit" ? "active-tab" : ""}`}
              onClick={() => setActiveTab("submit")}
            >
              Отправить решение
            </button>
          )}

          {!isFinished && (
            <button
              className={`contest-tab ${activeTab === "submissions" ? "active-tab" : ""}`}
              onClick={() => setActiveTab("submissions")}
            >
              Все отправления
            </button>
          )}

          <button
            className={`contest-tab ${activeTab === "rating" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("rating")}
          >
            Положение участников
          </button>
        </div>
        {/* Контент вкладок */}
        <div className="content">

          {activeTab === "tasks" && (
            <TasksTab 
              tasks={tasks} 
              token={token} 
            />
          )}

          {!isFinished && !isOrganizer && activeTab === "submit" && (
            <SubmitTab 
              tasks={tasks} 
              token={token}
              onSubmitted={() => {
                console.log("Решение отправлено!");
              }} 
            />
          )}

          {!isFinished && activeTab === "submissions" && (
            <SubmissionsTab 
              contestId={contest_id}  
              token={token}           
            />
          )}

          {activeTab === "rating" && (
            <RatingTab 
              contestId={contest_id} 
              token={token} 
              tasks={tasks} 
            />
          )}
        </div>
      </div>

      {/* Таймер */}
      {!isFinished && (
        <div className="timer-container">
          <span className="timer-label">До окончания:</span>
          <span className="timer-value">{timeLeft}</span>
        </div>
      )}
    </div>
   
  );
}



export default ContestMenu;