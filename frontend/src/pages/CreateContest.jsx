import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getContestById, saveContest, getAuthorTasks } from "../api/contests";
import { getCurrentUser } from "../api/users";

function CreateContest() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // состояния формы
  const [contestName, setContestName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationHours, setDurationHours] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(0); 
  const [selectedTasks, setSelectedTasks] = useState([]);
  
  // для выпадающего списка
  const [allTasks, setAllTasks] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [contestData, setContestData] = useState(null);

  // загрузка данных в режиме редактирования
  useEffect(() => {
    if (!isEditMode) return;

    const loadContest = async () => {
      try {
        const data = await getContestById(id);
        setContestData(data); 
        setContestName(data.contest_name);

        const date = new Date(data.start_time);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setStartTime(localDate);

        const total = data.duration;
        setDurationHours(Math.floor(total / 60));
        setDurationMinutes(total % 60);
      } catch (err) {
        console.error("Ошибка загрузки контеста:", err);
        alert("Не удалось загрузить данные контеста");
      }
    };

    loadContest();
  }, [id, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !contestData || allTasks.length === 0) return;

    const matchedTasks = allTasks.filter(task =>
      contestData.task_list?.includes(task.task_id)
    );
    setSelectedTasks(matchedTasks);
  }, [contestData, allTasks, isEditMode]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (!token || role !== "organizer") {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user.user_id);

        const tasks = await getAuthorTasks(user.user_id, true);
        setAllTasks(Array.isArray(tasks) ? tasks : []);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
      }
    };

    loadData();
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

  const handleSubmit = async () => {
    if (!contestName || !startTime || selectedTasks.length === 0) {
      alert("Заполните название, дату начала и добавьте хотя бы одну задачу");
      return;
    }

    setLoading(true);

    try {
      const durationMinutesTotal =
        (parseInt(durationHours) || 0) * 60 +
        (parseInt(durationMinutes) || 0);

      const dateObj = new Date(startTime);
      if (isNaN(dateObj.getTime())) {
        alert("Некорректная дата");
        setLoading(false);
        return;
      }

      const requestData = {
        contest_name: contestName,
        start_time: dateObj.toISOString(),
        duration: durationMinutesTotal,
        task_ids: selectedTasks.map(t => t.task_id)
      };

      await saveContest(requestData, isEditMode ? id : null);
      
      alert(isEditMode ? "Контест успешно обновлён!" : "Контест успешно создан!");
      navigate("/contests");
      
    } catch (err) {
      console.error("Save error:", err);
      alert(err.message || "Ошибка сохранения контеста");
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = allTasks.filter(task =>
    task.task_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="contest-form-page">
      <Navbar />
      
      <div className="contest-form-container">
        
        {/* Заголовок страницы */}
        <h3 className="page-title">
          {isEditMode ? "Редактирование контеста" : "Новый контест"}
        </h3>

        {/* Основная форма */}
        <div className="contest-form-card">
          
          {/* Поле: Название */}
          <div className="form-field">
            <label className="form-label">Название</label>
            <input
              type="text"
              value={contestName}
              onChange={(e) => setContestName(e.target.value)}
              placeholder="Введите название контеста"
              className="input-field input-limited"
            />
          </div>

          {/* Поле: Дата и время начала */}
          <div className="form-field">
            <label className="form-label">Дата и время начала</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Поле: Длительность */}
          <div className="form-field">
            <label className="form-label">Длительность</label>
            <div className="duration-row">
              
              {/* Часы */}
              <div className="duration-column">
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
                  className="duration-input"
                />
                <span className="duration-label">Часы</span>
              </div>
              
              <span className="duration-separator">:</span>

              {/* Минуты */}
              <div className="duration-column">
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
                  className="duration-input"
                />
                <span className="duration-label">Минуты</span>
              </div>
            </div>
          </div>

          {/* Поле: Список задач */}
          <div className="form-field-wide">
            <label className="form-label">Список задач</label>
            
            {/* Выпадающий список для выбора задач */}
            <div className="dropdown-wrapper">
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="dropdown-trigger"
              >
                <span className={`dropdown-trigger-text ${searchQuery ? "active" : ""}`}>
                  {searchQuery || "Выберите задачу..."}
                </span>
                <span className="dropdown-arrow">▼</span>
              </div>

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {/* Поиск внутри dropdown */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск задач..."
                    onClick={(e) => e.stopPropagation()}
                    className="dropdown-search"
                  />
                  
                  {/* Список задач */}
                  {filteredTasks.length === 0 ? (
                    <div className="dropdown-empty">
                      Нет доступных задач
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <div
                        key={task.task_id}
                        onClick={() => handleSelectTask(task)}
                        className="dropdown-item"
                      >
                        {task.task_name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Список выбранных задач */}
            <div className="selected-tasks-list">
              {selectedTasks.length === 0 && (
                <div className="dropdown-empty">
                  Задачи не добавлены
                </div>
              )}

              {selectedTasks.map((task, index) => (
                <div
                  key={task.task_id}
                  className="selected-task-item"
                >
                  <div className="selected-task-info">
                    <span className="selected-task-letter">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="selected-task-name">
                      {task.task_name}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveTask(task.task_id)}
                    className="remove-task-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="form-actions">
            <button
              onClick={() => handleSubmit()}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading
                ? "Сохранение..."
                : isEditMode
                  ? "Сохранить изменения"
                  : "Сохранить"}
            </button>
            
            <button
              onClick={() => navigate("/contests")}
              disabled={loading}
              className="btn btn-outline"
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