// frontend/src/pages/ContestMenu.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/global.css";

const loadSolutions = async () => {
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("access_token");

  const res = await fetch(
    `http://127.0.0.1:8000/solutions/my?user_id=${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();

  if (Array.isArray(data)) {
    setSolutions(data);
  } else {
    setSolutions([]);
  }
};


function ContestMenu() {
  const { contest_id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tasks");
  const [contest, setContest] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedLang, setSelectedLang] = useState(1);
  const [file, setFile] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const isFinished = contest?.is_finished;
  const [openedTask, setOpenedTask] = useState(null);
  const [loadingTask, setLoadingTask] = useState(false);

  
  const token = localStorage.getItem("access_token");
  const userId = localStorage.getItem("user_id");
  const isOrganizer = contest?.is_organizer;
  const handleSubmit = async () => {
    if (!file || !selectedTask) {
      alert("Выбери задачу и файл");
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
        alert("Решение отправлено ");
      } else {
        alert("Ошибка при отправке");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    }
  };
  useEffect(() => {
    if (activeTab === "submissions") {
      loadSolutions();
    }
  }, [activeTab]);

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

  useEffect(() => {
  const loadContestData = async () => {
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
          setTasks(tasksData);
        } else {
          const error = await tasksRes.json();
        }
      }
    } catch (err) {
      console.error("Ошибка при загрузке:", err);
    } finally {
      setLoading(false);
    }
  };

  loadContestData();
}, [contest_id, token]);
  
  const TasksTab = () => {
  

  const token = localStorage.getItem("access_token");

  const openTask = async (taskId) => {
    try {
      setLoadingTask(true);

      const res = await fetch(`http://127.0.0.1:8000/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to load task");

      const data = await res.json();
      setOpenedTask(data);

    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTask(false);
    }
  };

 
  if (openedTask) {
    return (
      <div>

        <div
          style={{ cursor: "pointer", marginBottom: "20px", color: "#6b7280" }}
          onClick={() => setOpenedTask(null)}
        >
          ← Назад к задачам
        </div>

        <h2>{openedTask.task_name}</h2>

        <div style={{ display: "flex", gap: "20px", color: "#6b7280" }}>
          <span>{openedTask.category_name}</span>
          <span>{openedTask.difficulty_name}</span>
          <span>{openedTask.time_limit} ms</span>
          <span>{openedTask.memory_limit} MB</span>
        </div>

        <hr style={{ margin: "20px 0" }} />

        <h3>Условие</h3>
        <div style={{ background: "#f9fafb", padding: "15px", borderRadius: "10px" }}>
          {openedTask.statement}
        </div>

        <h3 style={{ marginTop: "20px" }}>Входные данные</h3>
        <div style={{ background: "#f9fafb", padding: "10px", borderRadius: "8px" }}>
          {openedTask.input_format || "Не указано"}
        </div>

        <h3 style={{ marginTop: "20px" }}>Выходные данные</h3>
        <div style={{ background: "#f9fafb", padding: "10px", borderRadius: "8px" }}>
          {openedTask.output_format || "Не указано"}
        </div>

        <h3 style={{ marginTop: "20px" }}>Примеры</h3>
        {openedTask.examples?.length > 0 ? (
          <table style={{ width: "100%", marginTop: "10px" }}>
            <thead>
              <tr>
                <th>Ввод</th>
                <th>Вывод</th>
              </tr>
            </thead>
            <tbody>
              {openedTask.examples.map((ex, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: "pre-wrap" }}>{ex.input}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{ex.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Нет примеров</p>
        )}

      </div>
    );
  }


  return (
    <div className="tasks-list">

      {loadingTask && (
        <div style={{ color: "#6b7280", marginBottom: "10px" }}>
          Загрузка задачи...
        </div>
      )}

      {tasks.map((task, index) => {
        const letter = String.fromCharCode(1040 + index);

        return (
          <div key={task.task_id} className="task-item">

            <div
              className="task-info"
              onClick={() => openTask(task.task_id)}
              style={{ cursor: "pointer" }}
            >
              <span className="task-name">
                {letter}. {task.task_name}
              </span>

              
            </div>

          </div>
        );
      })}

    </div>
  );
};


  // Вкладка Отправить решение 
  const SubmitTab = () => (
    <div className="submit-container">
      <div className="submit-form">
        <div className="form-group">
          <label className="label">Выберите язык программирования:</label>
          <select
            className="select"
            onChange={(e) => setSelectedLang(e.target.value)}
          >
            <option value={1}>Python 3.8</option>
            <option value={2}>C++ 20</option>
          </select>
        </div>

        <div className="form-group">
          <label className="label">Выберите задачу:</label>
          <select
            className="select"
            onChange={(e) => setSelectedTask(e.target.value)}
          >
            {tasks.map((task, index) => {
              const taskLetter = String.fromCharCode(1040 + index);
              return (
                <option key={task.task_id} value={task.task_id}>
                  {taskLetter}. {task.task_name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="form-group">
          <label className="label">Файл с решением:</label>

          <div className="file-input-wrapper">
            
            <input
              type="file"
              accept=".py,.cpp"
              id="solution-file"
              className="file-input-hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <label htmlFor="solution-file" className="file-button">
              {file ? file.name : "Импортировать файл с решением"}
            </label>

          </div>
        </div>

        <button className="submit-button" onClick={handleSubmit}>
          Отправить решение
        </button>
      </div>
    </div>
  );

  // Все отправления
  const SubmissionsTab = () => (
    <div className="submissions-container">
      <table className="table">
        <thead>
          <tr>
            <th className="th">№</th>
            <th className="th">Время</th>
            <th className="th">Никнейм</th>
            <th className="th">Задача</th>
            <th className="th">Язык программирования</th>
            <th className="th">Вердикт</th>
            <th className="th">Время выполнения</th>
            <th className="th">Память</th>
          </tr>
        </thead>

        <tbody>
          {solutions.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-cell">
                Пока нет отправок
              </td>
            </tr>
          ) : (
            solutions.map((s, index) => (
              <tr key={s.id}>
                <td className="td">{index + 1}</td>
                <td className="td">
                  {new Date(s.time).toLocaleString()}
                </td>
                <td className="td">{s.user_nickname || "-"}</td>
                <td className="td">{s.task || "-"}</td>
                <td className="td">{s.language || "-"}</td>
                <td className="td">{s.status}</td>
                <td className="td">-</td>
                <td className="td">-</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Положение участников
  const RatingTab = () => (
    <div className="rating-container">
      <table className="table">
        <thead>
          <tr>
            <th className="th">№</th>
            <th className="th">Никнейм</th>
            <th className="th">Всего очков</th>
            {tasks.map((task, index) => {
              const taskLetter = String.fromCharCode(1040 + index);
              return (
                <th key={task.task_id} className="th">{taskLetter}. {task.title}</th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3 + tasks.length} className="empty-cell">Рейтинг пока пуст</td>
          </tr>
        </tbody>
      </table>
      <button className="export-button">Экспортировать результаты</button>
    </div>
  );

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
          {activeTab === "tasks" && <TasksTab />}
          {!isFinished && !isOrganizer && activeTab === "submit" && <SubmitTab />}
          {!isFinished && activeTab === "submissions" && <SubmissionsTab />}
          {activeTab === "rating" && <RatingTab />}
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