// frontend/src/pages/ContestMenu.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

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
  
  const token = localStorage.getItem("access_token");
  const userId = localStorage.getItem("user_id");
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

  // 👉 если открыта задача
  if (openedTask) {
    return (
      <div>
        <div
          className="task-info"
          style={{ marginBottom: "20px", cursor: "pointer" }}
          onClick={() => setOpenedTask(null)}
        >
          ← Назад к задачам
        </div>

        <h2>{openedTask.task_name}</h2>

        <div className="task-meta" style={{ marginBottom: "20px" }}>
          <span className="meta-item">{openedTask.category_name}</span>
          <span className="meta-item">{openedTask.difficulty_name}</span>
        </div>

        <hr />

        <h3>Условие</h3>
        <div className="task-item" style={{ marginTop: "10px" }}>
          {openedTask.statement}
        </div>

        {!contest.is_finished && (
          <button
            className="btn btn-primary"
            style={{ marginTop: "20px" }}
            onClick={() => setActiveTab("submit")}
          >
            Отправить решение
          </button>
        )}
      </div>
    );
  }

  // 👉 список задач (ТВОЙ СТИЛЬ)
  return (
    <div className="tasks-list">
      {tasks.map(task => (
        <div key={task.task_id} className="task-item">
          
          {/* КЛИК ПО ЗАДАЧЕ */}
          <div
            className="task-info"
            onClick={() => setOpenedTask(task)}
          >
            <span className="task-name">{task.task_name}</span>

            <span className="task-meta">
              <span className="meta-item">{task.category_name}</span>
              <span className="meta-item">{task.difficulty_name}</span>
            </span>
          </div>

          {/* ПРАВАЯ ЧАСТЬ */}
          <div className="task-actions">
            {!contest.is_finished && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setActiveTab("submit")}
              >
                Решить
              </button>
            )}
          </div>

        </div>
      ))}
    </div>
  );
};


  // Вкладка Отправить решение 
  const SubmitTab = () => (
    <div style={styles.submitContainer}>
      <div style={styles.submitForm}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Выберите язык программирования:</label>
          <select
            style={styles.select}
            onChange={(e) => setSelectedLang(e.target.value)}
          >
            <option value={1}>Python 3.8</option>
            <option value={2}>C++ 20</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Выберите задачу:</label>
          <select
            style={styles.select}
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

        <div style={styles.formGroup}>
          <label style={styles.label}>Файл с решением:</label>
          <div style={styles.fileInputWrapper}>
            <input 
              type="file" 
              accept=".py,.cpp"
              style={styles.fileInput}
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button style={styles.fileButton}>Импортировать файл с решением</button>
          </div>
        </div>

        <button style={styles.submitButton} onClick={handleSubmit}>
          Отправить решение
        </button>
      </div>
    </div>
  );

  // Все отправления
  const SubmissionsTab = () => (
    <div style={styles.submissionsContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>№</th>
            <th style={styles.th}>Время</th>
            <th style={styles.th}>Никнейм</th>
            <th style={styles.th}>Задача</th>
            <th style={styles.th}>Язык программирования</th>
            <th style={styles.th}>Вердикт</th>
            <th style={styles.th}>Время выполнения</th>
            <th style={styles.th}>Память</th>
          </tr>
        </thead>

        <tbody>
          {solutions.length === 0 ? (
            <tr>
              <td colSpan="8" style={styles.emptyCell}>
                Пока нет отправок
              </td>
            </tr>
          ) : (
            solutions.map((s, index) => (
              <tr key={s.id}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>
                  {new Date(s.time).toLocaleString()}
                </td>
                <td style={styles.td}>{s.user_nickname || "-"}</td>
                <td style={styles.td}>{s.task || "-"}</td>
                <td style={styles.td}>{s.language || "-"}</td>
                <td style={styles.td}>{s.status}</td>
                <td style={styles.td}>-</td>
                <td style={styles.td}>-</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Положение участников
  const RatingTab = () => (
    <div style={styles.ratingContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>№</th>
            <th style={styles.th}>Никнейм</th>
            <th style={styles.th}>Всего очков</th>
            {tasks.map((task, index) => {
              const taskLetter = String.fromCharCode(1040 + index);
              return (
                <th key={task.task_id} style={styles.th}>{taskLetter}. {task.title}</th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3 + tasks.length} style={styles.emptyCell}>Рейтинг пока пуст</td>
          </tr>
        </tbody>
      </table>
      <button style={styles.exportButton}>Экспортировать результаты</button>
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
      <div style={styles.header}>
        <h3 style={styles.contestTitle}>{contest.contest_name}</h3>
      </div>

      {/* Вкладки */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === "tasks" ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab("tasks")}
          >
            Задачи
          </button>

          {!isFinished && (
            <>
              <button 
                style={{
                  ...styles.tab,
                  ...(activeTab === "submit" ? styles.activeTab : {})
                }}
                onClick={() => setActiveTab("submit")}
              >
                Отправить решение
              </button>

              <button 
                style={{
                  ...styles.tab,
                  ...(activeTab === "submissions" ? styles.activeTab : {})
                }}
                onClick={() => setActiveTab("submissions")}
              >
                Все отправления
              </button>
            </>
          )}

          <button 
            style={{
              ...styles.tab,
              ...(activeTab === "rating" ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab("rating")}
          >
            Положение участников
          </button>
        </div>

        {/* Контент вкладок */}
        <div style={styles.content}>
          {activeTab === "tasks" && <TasksTab />}
          {!isFinished && activeTab === "submit" && <SubmitTab />}
          {!isFinished && activeTab === "submissions" && <SubmissionsTab />}
          {activeTab === "rating" && <RatingTab />}
        </div>
      </div>

      {/* Таймер */}
      <div style={styles.timerContainer}>
        <span style={styles.timerLabel}>До окончания:</span>
        <span style={styles.timerValue}>{timeLeft}</span>
      </div>
    </div>
  );
}

const styles = {
  box: {
    background: "#f9fafb",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb"
  },
  header: {
    position: "absolute",
    top: 100,
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    maxWidth: "1200px",
  },
  contestTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1f2739",
    margin: 0
  },
  tabsContainer: {
    position: "absolute",
    top: 160,
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    maxWidth: "1200px",

  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    background: "white",
    padding: "8px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  tab: {
    flex: 1,
    padding: "12px 24px",
    border: "none",
    background: "transparent",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#6b7280",
    cursor: "pointer",
    transition: "all 0.3s"
  },
  activeTab: {
    background: "#3b82f6",
    color: "white",
    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)"
  },
  content: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    minHeight: "400px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
  },
  // Стили для задач
  tasksContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  taskCard: {
    background: "#f9fafb",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px 20px",
    cursor: "pointer",
    transition: "all 0.3s",
    "&:hover": {
      borderColor: "#3b82f6",
      background: "#eff6ff",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
    }
  },
  taskHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "8px"
  },
  taskNumber: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600",
    fontSize: "16px",
    color: "#1f2739"
  },
  taskIcon: {
    fontSize: "18px"
  },
  taskLetter: {
    color: "#3b82f6"
  },
  taskTitle: {
    flex: 1,
    fontSize: "16px",
    fontWeight: "500",
    color: "#111827"
  },
  taskFooter: {
    display: "flex",
    gap: "16px",
    fontSize: "13px",
    color: "#6b7280"
  },
  taskPoints: {
    fontWeight: "600",
    color: "#10b981"
  },
  taskDifficulty: {
    color: "#6b7280"
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#9ca3af"
  },
  // Стили для отправки
  submitContainer: {
    maxWidth: "600px",
    margin: "0 auto"
  },
  submitForm: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151"
  },
  select: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "2px solid #e5e7eb",
    fontSize: "14px",
    background: "white",
    cursor: "pointer"
  },
  fileInputWrapper: {
    position: "relative"
  },
  fileInput: {
    position: "absolute",
    opacity: 0,
    width: "100%",
    height: "100%",
    cursor: "pointer"
  },
  fileButton: {
    width: "100%",
    padding: "12px",
    background: "#1f2937",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer"
  },
  submitButton: {
    width: "100%",
    padding: "14px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
    "&:hover": {
      background: "#2563eb"
    }
  },
  // Стили для таблицы
  submissionsContainer: {
    overflowX: "auto"
  },
  ratingContainer: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px"
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #e5e7eb",
    fontWeight: "600",
    color: "#374151",
    whiteSpace: "nowrap"
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f3f4f6",
    color: "#6b7280"
  },
  emptyCell: {
    textAlign: "center",
    padding: "40px",
    color: "#9ca3af"
  },
  exportButton: {
    marginTop: "16px",
    padding: "10px 20px",
    background: "#1f2937",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer"
  },
  // Таймер
  timerContainer: {
    position: "absolute",
    bottom: 100,
    right: "5%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "white",
    padding: "12px 20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    zIndex: 1000
  },
  timerLabel: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "500"
  },
  timerValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1f2739",
    fontFamily: "monospace"
  }
};

export default ContestMenu;