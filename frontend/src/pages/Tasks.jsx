// frontend/src/pages/Tasks.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; 

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
    if (!token) { navigate("/login"); return; }
    setUserRole(role);

    fetch("http://127.0.0.1:8000/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(user => {
        setUserId(user.user_id);
        return fetch("http://127.0.0.1:8000/tasks/", { headers: { Authorization: `Bearer ${token}` } });
      })
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [navigate]);

  const filteredTasks = tasks.filter(task => {
    if (activeTab === "my" && String(task.author) !== String(userId)) return false;
    if (searchQuery && !task.task_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterCategory !== "all" && task.category_name !== filterCategory) return false;
    if (filterDifficulty !== "all" && task.difficulty_name !== filterDifficulty) return false;
    return true;
  }).sort((a, b) => {
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
      if (res.ok) setTasks(tasks.filter(t => t.task_id !== id));
      else alert("Ошибка удаления");
    } catch (e) { alert("Ошибка сети"); }
  };

  if (loading) return <div className="loading-text">Загрузка...</div>;

  return (
    <div className="page-container">
      <Navbar />
      
      {/* Главный центрированный контейнер */}
      <div style={{
        position: "absolute", 
        top: "140px",          
        left: "50%",         
        transform: "translateX(-50%)",
        width: "90%",         
        maxWidth: "1200px",   
        boxSizing: "border-box"
      }}>
        
        <div className="card">
          
          {/* Поиск, Табы, Кнопки */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            
            {/* Поиск + Табы */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Поле поиска */}
              <input 
                type="text" 
                placeholder="Найти задачу..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                style={{ width: '250px' }}
              />
              
              {/* Табы (только для организатора) */}
              {userRole === 'organizer' && (
                <div className="tabs-container">
                  <button 
                    onClick={() => setActiveTab('all')} 
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                  >
                    Все
                  </button>
                  <button 
                    onClick={() => setActiveTab('my')} 
                    className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
                  >
                    Мои
                  </button>
                </div>
              )}
            </div>

            {/* Кнопки действий (только для организатора) */}
            {userRole === 'organizer' && (
              <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => navigate('/tasks/drafts')} className="btn btn-secondary">
                  Черновики
                </button>
                <button onClick={() => navigate('/tasks/create')} className="btn btn-primary">
                  + Создать
                </button>
              </div>
            )}
          </div>

          
          <div style={{ height: '1px', background: '#f3f4f6', margin: '0 0 24px 0' }}></div>
          
          {/* Фильтры и Список */}
          
          {/* Панель фильтров */}
          <div className="filters-panel" style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
              <option value="all">По категориям ▾</option>
              {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="filter-select">
              <option value="all">По уровню сложности ▾</option>
              {difficulties.filter(d => d !== 'all').map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="filter-select">
              <option value="newest">По дате публикации ▾</option>
              <option value="oldest">По дате публикации ▾</option>
            </select>
          </div>

          {/* СПИСОК ЗАДАЧ */}
          {filteredTasks.length === 0 ? (
            <div className="empty-state">Задачи не найдены</div>
          ) : (
            <div className="tasks-list">
              {filteredTasks.map(task => (
                <div key={task.task_id} className="task-item">
                  <div className="task-info" onClick={() => navigate(`/tasks/${task.task_id}`)}>
                    <span className="task-name">{task.task_name}</span>
                    <span className="task-meta">
                      <span className="meta-item">{task.category_name}</span>
                      <span className="meta-item">{task.difficulty_name}</span>
                    </span>
                  </div>
                  
                  <div className="task-actions">
                    {userRole === 'organizer' ? (
                      <>
                        <button onClick={() => navigate(`/tasks/${task.task_id}/edit`)} className="icon-btn edit">✏️</button>
                        <button onClick={() => handleDelete(task.task_id)} className="icon-btn delete">🗑️</button>
                      </>
                    ) : (
                      <button onClick={() => navigate(`/tasks/${task.task_id}`)} className="btn btn-sm btn-primary">Решить</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tasks;