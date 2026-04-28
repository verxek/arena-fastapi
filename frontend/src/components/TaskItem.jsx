import { categoryIcons, difficultyIcons } from "../assets/icons";
import { MdEdit, MdDelete} from "react-icons/md";
import { BiCube } from "react-icons/bi";
import { AiFillEyeInvisible } from "react-icons/ai";
import { AiFillEye } from "react-icons/ai";


function TaskItem({
  task,
  userRole,
  onOpen,
  onEdit,
  onDelete,
  onSolve,
  onSolveAgain,
  visibility
}) {
  return (
    <div className="task-item">

    <div className="task-col task-name-col"
      onClick={() => onOpen(task.task_id)}
    >
      <span className="task-name">
        <BiCube className="task-icon" />
        {task.task_name}
        {userRole === "organizer" && !task.visibility && (
          <AiFillEyeInvisible
            style={{ marginLeft: 8, color: "#ef4444" }}
            title="Скрытая задача"
          />
        )}
      </span>
    </div>

    <div className="task-col task-category-col">
      <span className="meta-item">
        {categoryIcons[task.category_name] || ""} {task.category_name}
      </span>
    </div>

    <div className="task-col task-difficulty-col">
      <span className="meta-item">
        {difficultyIcons[task.difficulty_name] || ""} {task.difficulty_name}
      </span>
    </div>

    <div className="task-col task-actions-col">
      {userRole === "organizer" ? (
        <>
          <button onClick={() => onDelete(task.task_id)} className="icon-btn delete">
            <MdDelete />
          </button>
        </>
      ) : (
        <>
          {task.is_solved ? (
            <div className="task-solved">
              <span className="solved-label">✓ Решено</span>

              <button
                onClick={() => onSolveAgain(task.task_id)}
                className="btn btn-sm"
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
  )
}

export default TaskItem;