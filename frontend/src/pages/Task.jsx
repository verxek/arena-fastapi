import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import SubmitModal from "../components/SubmitModal";
import "../styles/global.css";

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

      {/* HEADER */}
      <div className="task-header">
        <h1 className="task-title">{task.task_name}</h1>

        <div className="task-meta-row">
          <span>{task.category_name}</span>
          <span>{task.difficulty_name}</span>
          <span>{task.time_limit} ms</span>
          <span>{task.memory_limit} MB</span>
        </div>
      </div>

      <hr className="divider" />

      {/* BODY */}
      <div>
        <h3>Условие</h3>
        <div className="box">
          {task.statement}
        </div>
      </div>

      {/* INPUT / OUTPUT */}
      <div className="grid-2">
        <div>
          <h4>Входные данные</h4>
          <div className="box">
            {task.input_format || "Не указано"}
          </div>
        </div>

        <div>
          <h4>Выходные данные</h4>
          <div className="box">
            {task.output_format || "Не указано"}
          </div>
        </div>
      </div>

      {/* EXAMPLES */}
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

      {/* ACTIONS */}
      <div className="task-actions-center">
        <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>
          Отправить решение
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => navigate("/my-submissions", { state: { taskId: id } })}
        >
          Мои отправления
        </button>
      </div>

      {showSubmit && (
        <SubmitModal task={task} onClose={() => setShowSubmit(false)} />
      )}

    </div>
  </div>
);}

export default TaskPage;