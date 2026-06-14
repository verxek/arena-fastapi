import { useState } from "react";
import { IoTimeOutline } from "react-icons/io5";
import { TfiSave } from "react-icons/tfi";
import { tasksApi } from "../api/tasks";

const TasksTab = ({ tasks, token }) => {
  const [openedTask, setOpenedTask] = useState(null);
  const [loadingTask, setLoadingTask] = useState(false);

  const openTask = async (taskId) => {
    try {
      setLoadingTask(true);
      const data = await tasksApi.getById(taskId);
      setOpenedTask(data);
    } catch (e) {
      console.error("Error loading task:", e);
      alert("Не удалось загрузить условие задачи");
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

        <div className="task-header">
          <h2 className="task-title">{openedTask.task_name}</h2>
          <div className="task-meta-row">
            <span className="meta-item">
              <IoTimeOutline /> {openedTask.time_limit} ms
            </span>
            <span className="meta-item">
              <TfiSave /> {openedTask.memory_limit} Mb
            </span>
          </div>
        </div>

        <hr style={{ margin: "20px 0" }} />

        <h3>Условие</h3>
        <div>{openedTask.statement}</div>

        <h3 style={{ marginTop: "20px" }}>Входные данные</h3>
        <div>{openedTask.input_format || "Не указано"}</div>

        <h3 style={{ marginTop: "20px" }}>Выходные данные</h3>
        <div>{openedTask.output_format || "Не указано"}</div>

        <div>
          <h3>Примеры</h3>
          {openedTask?.examples?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Ввод</th>
                  <th>Вывод</th>
                </tr>
              </thead>
              <tbody>
                {openedTask.examples.map((ex, i) => (
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
    );
  }

  // Список задач
  return (
    <div className="tasks-list">
      {loadingTask && (
        <div style={{ color: "#6b7280", marginBottom: "10px" }}>
          Загрузка задачи...
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="empty-text">В этом контесте пока нет задач</p>
      ) : (
        tasks.map((task, index) => {
          const letter = String.fromCharCode(1040 + index); // А, Б, В...
          return (
            <div key={`${task.task_id}-${index}`} className="task-item">
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
        })
      )}
    </div>
  );
};

export default TasksTab;