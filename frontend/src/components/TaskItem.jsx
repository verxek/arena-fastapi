import { categoryIcons, difficultyIcons } from "../assets/icons";
import { MdEdit, MdDelete} from "react-icons/md";


function TaskItem({
  task,
  userRole,
  onOpen,
  onEdit,
  onDelete,
  onSolve,
  onSolveAgain
}) {
  return (
    <div className="task-item">

      <div className="task-info" onClick={() => onOpen(task.task_id)}>
        <span className="task-name">{task.task_name}</span>

        <span className="task-meta">
          <span className="meta-item">
            {categoryIcons[task.category_name] || "📁"} {task.category_name}
          </span>

          <span className="meta-item">
            {difficultyIcons[task.difficulty_name] || "⭐"} {task.difficulty_name}
          </span>
        </span>
      </div>

      <div className="task-actions">

        {userRole === "organizer" ? (
          <>
            <button
              onClick={() => onEdit(task.task_id)}
              className="icon-btn edit"
            >
              <MdEdit />
            </button>

            <button
              onClick={() => onDelete(task.task_id)}
              className="icon-btn delete"
            >
              <MdDelete />
            </button>
          </>
        ) : (
          <>
            {task.is_solved ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>

                <span style={{
                  fontSize: "12px",
                  color: "#10b981",
                  fontWeight: "600"
                }}>
                  ✓ Решено
                </span>

                <button
                  onClick={() => onSolveAgain(task.task_id)}
                  className="btn btn-sm"
                  style={{
                    background: "#f3f4f6",
                    color: "#374151"
                  }}
                >
                  Решить заново
                </button>

              </div>
            ) : (
              <button
                onClick={() => onSolve(task.task_id)}
                className="btn btn-sm btn-primary"
              >
                Решить
              </button>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default TaskItem;