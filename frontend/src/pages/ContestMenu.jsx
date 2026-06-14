import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { contestsApi } from "../api/contests";
import { tasksApi } from "../api/tasks";
import { solutionsApi } from "../api/solutions";
import SubmitTab from "../components/SubmitTab";
import SubmissionsTab from "../components/SubmissionsTab";
import TasksTab from "../components/TasksTab";
import RatingTab from "../components/RatingTab";
import "../styles/global.css";
import { IoTimeOutline } from "react-icons/io5";
import { TfiSave } from "react-icons/tfi";

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
      await solutionsApi.submit(formData);
      
      alert("Решение отправлено");
      setFile(null);
      setSelectedTask("");
      setSelectedLang("");
      
    } catch (err) {
      console.error("Submit error:", err);
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
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
  }, [isFinished, activeTab]);


  const loadContestData = useCallback(async () => {
    try {
      const contestData = await contestsApi.getById(contest_id);
      setContest(contestData);

      const taskIds = contestData.task_list || [];
      if (taskIds.length > 0) {
        const tasksData = await tasksApi.getBatch(taskIds);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      }
      
    } catch (err) {
      console.error("Ошибка при загрузке:", err);
      
      if (err.message?.includes("404")) {
        alert("Контест не найден");
        navigate("/contests");
      }
    } finally {
      setLoading(false);
    }
  }, [contest_id, navigate]);  

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
            <TasksTab tasks={tasks} token={token} />
          )}

          {!isFinished && !isOrganizer && activeTab === "submit" && (
            <SubmitTab 
              tasks={tasks} 
              onSubmitted={() => console.log("Решение отправлено!")} 
            />
          )}

          {!isFinished && activeTab === "submissions" && (
            <SubmissionsTab contestId={contest_id}  />
          )}

          {activeTab === "rating" && (
            <RatingTab contestId={contest_id} tasks={tasks} />
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