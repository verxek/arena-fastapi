import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import SubmitModal from "../components/SubmitModal";

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

  if (!task) return <div>Загрузка...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <Navbar />

      
        <div style={{
          position: "absolute", 
        top: "130px",         
        left: "50%",         
        transform: "translateX(-50%)",
        width: "90%",         
        maxWidth: "1200px",   
        boxSizing: "border-box",
        display: "flex",     
        flexDirection: "column",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "30px 200px"
        }}>
        <Link to="/tasks" style={{
            fontSize: "14px",
            color: "#6b7280",
            textDecoration: "none"
            }}>
            ← Назад к списку задач
        </Link>
          {/* Заголовок */}
          <div style={{ marginBottom: "20px" }}>
            <h1 style={{ margin: 0 }}>{task.task_name}</h1>

            <div style={{
              display: "flex",
              gap: "20px",
              marginTop: "10px",
              color: "#6b7280",
              fontSize: "14px"
            }}>
              <span>{task.category_name}</span>
              <span>{task.difficulty_name}</span>
              <span>{task.time_limit} ms</span>
              <span>{task.memory_limit} MB</span>
            </div>
          </div>

          <hr />

          {/* Условие */}
          <div style={{ marginTop: "20px" }}>
            <h3>Условие</h3>
            <div style={{
              background: "#f9fafb",
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb"
            }}>
              {task.statement}
            </div>
          </div>

          {/* Вход / Выход */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginTop: "25px"
          }}>
            <div>
              <h4>Входные данные</h4>
              <div style={{
                background: "#f9fafb",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb"
              }}>
                {task.input_format || "Не указано"}
              </div>
            </div>

            <div>
              <h4>Выходные данные</h4>
              <div style={{
                background: "#f9fafb",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb"
              }}>
                {task.output_format || "Не указано"}
              </div>
            </div>
          </div>

          {/* Примеры */}
          <div style={{ marginTop: "30px" }}>
            <h3>Примеры</h3>

            {task.examples && task.examples.length > 0 ? (
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "10px"
              }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ padding: "10px", border: "1px solid #e5e7eb" }}>Ввод</th>
                    <th style={{ padding: "10px", border: "1px solid #e5e7eb" }}>Вывод</th>
                  </tr>
                </thead>
                <tbody>
                  {task.examples.map((ex, i) => (
                    <tr key={i}>
                      <td style={{ padding: "10px", border: "1px solid #e5e7eb", whiteSpace: "pre-wrap" }}>
                        {ex.input}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid #e5e7eb", whiteSpace: "pre-wrap" }}>
                        {ex.output}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Нет примеров</p>
            )}
          </div>

          {/* Кнопка */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "30px"
          }}>
            <button style={{
              padding: "10px 25px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }} onClick={() => setShowSubmit(true)}>
              Отправить решение
            </button>
            <button
            style={{
              padding: "10px 25px",
              background: "#374151",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              marginLeft: "10px"
            }}
            onClick={() => navigate("/my-submissions", { state: { taskId: id } })}
          >
            Мои отправления
          </button>
          </div>
          {showSubmit && (
            <SubmitModal
              task={task}
              onClose={() => setShowSubmit(false)}
            />
          )}

        </div>
      </div>

  );
}

export default TaskPage;