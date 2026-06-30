import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import SubmitModal from "../components/SubmitModal";
import { getTaskById } from "../api/tasks";
import { categoryIcons, difficultyIcons } from "../assets/icons";
import { IoTimeOutline } from "react-icons/io5";
import { TfiSave } from "react-icons/tfi";
import "../styles/global.css";

function TaskPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getTaskById(id)
      .then(data => setTask(data))
      .catch(err => {
        console.error("Failed to load task:", err);
       
        if (err.message?.includes("404")) {
          navigate("/tasks");
        }
      });
  }, [id, navigate]);

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
              <span className="meta-item">
                {categoryIcons[task.category_name] || ""} {task.category_name}
              </span>
              <span className="meta-item">
                {difficultyIcons[task.difficulty_name] || ""} {task.difficulty_name}
              </span>
              <span className="meta-item">
                <IoTimeOutline size={17} /> {task.time_limit} ms
              </span>
              <span className="meta-item">
                <TfiSave size={14} /> {task.memory_limit} Mb
              </span>

              <button
                className="btn btn-primary"
                onClick={() => setShowSubmit(true)}
              >
                Отправить решение
              </button>
            </div>
          </div>

          <hr className="divider" />

          {/* Условие */}
          <div>
            <h3>Условие</h3>
            <div>{task.statement}</div>
          </div>

          <hr className="divider" />

          {/* Форматы ввода/вывода */}
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

          {/* Примеры */}
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

        {/* Модальное окно отправки решения */}
        <SubmitModal
          task={task}
          isOpen={showSubmit}
          onClose={() => setShowSubmit(false)}
        />

      </div>
    </div>
  );
}

export default TaskPage;