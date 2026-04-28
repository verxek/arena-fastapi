import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TaskItem from "../components/TaskItem";
import "../styles/global.css";
import { BiSearch } from "react-icons/bi";

function Tasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
      return;
    }

    setUserRole(role);

    fetch("http://127.0.0.1:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(user => {
        setUserId(user.user_id);
        return fetch("http://127.0.0.1:8000/tasks/", {
          headers: { Authorization: `Bearer ${token}` }
        });
      })
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  const filteredTasks = tasks
    .filter(task => {
      if (activeTab === "my" && String(task.author_id) !== String(userId)) return false;
      if (searchQuery && !task.task_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterCategory !== "all" && task.category_name !== filterCategory) return false;
      if (filterDifficulty !== "all" && task.difficulty_name !== filterDifficulty) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const categories = ["all", ...new Set(tasks.map(t => t.category_name))];
  const difficulties = ["all", ...new Set(tasks.map(t => t.difficulty_name))];

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить задачу?")) return;

    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`http://127.0.0.1:8000/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setTasks(prev => prev.filter(t => t.task_id !== id));
      } else {
        alert("Ошибка удаления");
      }
    } catch {
      alert("Ошибка сети");
    }
  };

  if (loading) return <div className="loading-text">Загрузка...</div>;

  return (
    <div className="task-page">
      <Navbar />

      <div className="tasks-page-container">

        <div className="header-row">
          <h1 className="page-title">Задачи</h1>

          <div className="search-wrapper">
            <BiSearch className="search-icon" />

            <input
              className="search-input"
              type="text"
              placeholder="Найти задачу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {userRole === "participant" && (
            <button
              className="btn btn-primary"
              onClick={() => navigate("/my-submissions")}
            >
              Мои отправления
            </button>
          )}

          {userRole === "organizer" && (
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={() => navigate("/tasks/create")}>
                + Создать
              </button>
            </div>
          )}
        </div>

       

        <div className="filters-row">

          
          {/* ФИЛЬТРЫ */}
          <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">Категории</option>
            {categories.filter(c => c !== "all").map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select className="filter-select" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
            <option value="all">Сложность</option>
            {difficulties.filter(d => d !== "all").map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select className="filter-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="newest">Новые</option>
            <option value="oldest">Старые</option>
          </select>


          {/* ТАБЫ */}
          {userRole === "organizer" && (
            <div className="tabs-container">
              <button
                className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                Все
              </button>
              <button
                className={`tab-btn ${activeTab === "my" ? "active" : ""}`}
                onClick={() => setActiveTab("my")}
              >
                Мои
              </button>
            </div>
          )}


        </div>

        {/* List */}
        {filteredTasks.length === 0 ? (
          <div className="empty-state">Задачи не найдены</div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.map(task => (
              <TaskItem
                key={task.task_id}
                task={task}
                userRole={userRole}
                onOpen={(id) => navigate(`/tasks/${id}`)}
                onEdit={(id) => navigate(`/tasks/${id}/edit`)}
                onDelete={handleDelete}
                onSolve={(id) => navigate(`/tasks/${id}`)}
                onSolveAgain={(id) => navigate(`/tasks/${id}`)}
                visibility={task.visibility}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Tasks;