import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import SubmitModal from "../components/SubmitModal";
import "../styles/global.css";
import { categoryIcons, difficultyIcons } from "../assets/icons";
import { IoTimeOutline } from "react-icons/io5";
import { TfiSave } from "react-icons/tfi";

function TaskPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    fetch(`http://127.0.0.1:8000/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTask(data))
      .catch(err => console.error(err));
  }, [id]);

  if (!task) return <div className="loading-text">Загрузка...</div>;

  return (
  <div className="page-container">
    <Navbar />

    <div className="page-main-container">

      <Link to="/tasks" className="back-link">
        ← Назад к списку задач
      </Link>

      <div className="task-page-card">

        <div className="task-header">

          <h1 className="task-title">{task.task_name}</h1>

          <div className="task-meta-row">
            
            <span className="meta-item">{categoryIcons[task.category_name] || ""} {task.category_name}</span>
            <span className="meta-item">{difficultyIcons[task.difficulty_name] || ""} {task.difficulty_name}</span>
            <span className="meta-item"><IoTimeOutline size={17}/>{task.time_limit} ms</span>
            <span className="meta-item"><TfiSave size={14}/> {task.memory_limit} Mb</span>

            <button
              className="btn btn-primary"
              onClick={() => setShowSubmit(true)}
            >
              Отправить решение
            </button>
          </div>

          

        </div>

        <hr className="divider" />

        {/* BODY */}
        <div>
          <h3>Условие</h3>
          <div> {task.statement}</div>
        </div>

        <hr className="divider" />

        <div className="grid-2">
          <div>
            <h3>Входные данные</h3>
            <div>{task.input_format || "Не указано"}</div>
          </div>

          <div>
            <h3>Выходные данные</h3>
            <div>{task.output_format || "Не указано"}</div>
          </div>
        </div>

        <hr className="divider" />

        <div>
          <h3>Примеры</h3>

          {task.examples?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Ввод</th>
                  <th>Вывод</th>
                </tr>
              </thead>
              <tbody>
                {task.examples.map((ex, i) => (
                  <tr key={i}>
                    <td>{ex.input}</td>
                    <td>{ex.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">Нет примеров</p>
          )}
        </div>

      </div>

      {showSubmit && (
        <SubmitModal task={task} onClose={() => setShowSubmit(false)} />
      )}

    </div>
  </div>
);}

export default TaskPage;