// frontend/src/pages/CreateContest.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function CreateContest() {
  const navigate = useNavigate();
  
  // Состояния формы
  const [contestName, setContestName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationHours, setDurationHours] = useState(2);
   const [durationMinutes, setDurationMinutes] = useState(0); 
  const [selectedTasks, setSelectedTasks] = useState([]);
  
  // Состояния для выпадающего списка
  const [allTasks, setAllTasks] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Загрузка данных пользователя и его задач
  
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    
    console.log("Token:", token);
    console.log("Role:", role);

    if (!token) {
        console.warn("Нет токена, редирект на логин");
        navigate("/login");
        return;
    }

    // Разрешаем доступ только организаторам
    if (role !== "organizer") {
        console.warn("Роль не organizer, редирект на логин. Текущая роль:", role);
        navigate("/login");
        return;
    }

    fetch("http://127.0.0.1:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error("Ошибка получения пользователя");
        return res.json();
    })
    .then(user => {
        setUserId(user.user_id);
        
        // Загружаем задачи.
        return fetch(`http://127.0.0.1:8000/tasks?author_id=${user.user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
        });
    })
    .then(res => {
        if (!res.ok) throw new Error("Ошибка получения задач");
        return res.json();
    })
    .then(tasks => {
        console.log("Задачи загружены:", tasks);
        setAllTasks(tasks);
    })
    .catch(err => {
        console.error("Критическая ошибка:", err);
    });
    }, [navigate]);

  const handleSelectTask = (task) => {
    if (!selectedTasks.find(t => t.task_id === task.task_id)) {
      setSelectedTasks([...selectedTasks, task]);
    }
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const handleRemoveTask = (taskId) => {
    setSelectedTasks(selectedTasks.filter(t => t.task_id !== taskId));
  };

 
  const handleSubmit = async (statusParam = "active") => {
    if (!contestName || !startTime || selectedTasks.length === 0) {
        alert("Заполните название, дату начала и добавьте хотя бы одну задачу");
        return;
    }

    setLoading(true);
    const token = localStorage.getItem("access_token");

    try {
        const h = parseInt(durationHours) || 0;
        const m = parseInt(durationMinutes) || 0;
      
        // Форматируем в "HH:MM:SS"
        const durationString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

        let statusId = 2; 
        if (statusParam === "active") statusId = 3;
        if (statusParam === "draft") statusId = 1;
        

        const contestData = {
        contest_name: contestName,
        start_time: new Date(startTime).toISOString(),
        duration: durationString,      
        contest_status: statusId,      
        task_ids: selectedTasks.map(t => t.task_id) 
        };

        console.log("Отправка данных:", contestData);

        const response = await fetch("http://127.0.0.1:8000/contests", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(contestData)
        });

        if (response.ok) {
        alert("Контест успешно создан!");
        navigate("/contests");
        } else {
        const error = await response.json();
        console.error("Ошибка сервера:", error);
        alert(`Ошибка: ${error.detail || JSON.stringify(error)}`);
        }
    } catch (error) {
        console.error("Ошибка сети:", error);
        alert("Произошла ошибка при создании контеста");
    } finally {
        setLoading(false);
    }
    };


  const filteredTasks = allTasks.filter(task =>
    task.task_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", paddingBottom: "40px" }}>
      <Navbar />
      
      <div style={{
        position: "absolute",
        top: "100px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "1200px",
        boxSizing: "border-box"
      }}>
        
        {/* Заголовок страницы */}
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", marginBottom: "24px" }}>
          Новый контест
        </h1>

        {/* Основная форма */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          
          {/* Поле: Название */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
              Название
            </label>
            <input
              type="text"
              value={contestName}
              onChange={(e) => setContestName(e.target.value)}
              placeholder="Введите название контеста"
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>

          {/* Поле: Дата и время начала */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
              Дата и время начала
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>

          {/* Поле: Длительность */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
              Длительность 
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              
              {/* Часы */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={durationHours}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val) || val < 0) val = 0;
                    if (val > 23) val = 23;
                    setDurationHours(val);
                  }}
                  style={{
                    width: "70px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
                <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", textAlign: "center" }}>Часы</span>
              </div>
              <span style={{ fontSize: "20px", fontWeight: "bold", color: "#9ca3af", marginTop: "20px" }}>:</span>

              {/* Минуты */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val) || val < 0) val = 0;
                    if (val > 59) val = 59;
                    setDurationMinutes(val);
                  }}
                  style={{
                    width: "70px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
                <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", textAlign: "center" }}>Минуты</span>
              </div>
            </div>
          </div>

          {/* Поле: Список задач */}
          <div style={{ marginBottom: "32px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
              Список задач
            </label>
            
            {/* Выпадающий список для выбора задач */}
            <div style={{ position: "relative", width: "100%", maxWidth: "400px", marginBottom: "16px" }}>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                <span style={{ color: searchQuery ? "#111827" : "#9ca3af" }}>
                  {searchQuery || "Выберите задачу..."}
                </span>
                <span style={{ fontSize: "16px" }}>▼</span>
              </div>

              {isDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: "4px",
                  backgroundColor: "#fff",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  zIndex: 100,
                  maxHeight: "200px",
                  overflowY: "auto"
                }}>
                  {/* Поиск внутри dropdown */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск задач..."
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      borderBottom: "1px solid #e5e7eb",
                      outline: "none",
                      fontSize: "14px",
                      boxSizing: "border-box"
                    }}
                  />
                  
                  {/* Список задач */}
                  {filteredTasks.length === 0 ? (
                    <div style={{ padding: "12px", color: "#9ca3af", fontSize: "14px" }}>
                      Нет доступных задач
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <div
                        key={task.task_id}
                        onClick={() => handleSelectTask(task)}
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          fontSize: "14px",
                          borderBottom: "1px solid #f3f4f6",
                          hover: { backgroundColor: "#f9fafb" }
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#fff"}
                      >
                        {task.task_name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Список выбранных задач */}
            {selectedTasks.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                {selectedTasks.map((task, index) => (
                  <div
                    key={task.task_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ 
                        fontWeight: "600", 
                        color: "#6b7280",
                        minWidth: "20px"
                      }}>
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span style={{ fontSize: "14px", color: "#111827" }}>
                        {task.task_name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveTask(task.task_id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "4px 8px",
                        borderRadius: "4px"
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = "#fee2e2"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div style={{ 
            display: "flex", 
            gap: "12px", 
            paddingTop: "24px", 
            borderTop: "1px solid #e5e7eb" 
          }}>
            <button
              onClick={() => handleSubmit("upcoming")}
              disabled={loading}
              style={{
                background: "#1f2739",
                color: "white",
                border: "none",
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
            
            <button
              onClick={() => handleSubmit("draft")}
              disabled={loading}
              style={{
                background: "#e5e7eb",
                color: "#374151",
                border: "none",
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              В черновики
            </button>
            
            <button
              onClick={() => navigate("/contests")}
              disabled={loading}
              style={{
                background: "transparent",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              Отмена
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CreateContest;