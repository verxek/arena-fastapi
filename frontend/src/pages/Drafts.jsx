import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Drafts() {
  const [drafts, setDrafts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    fetch("http://127.0.0.1:8000/tasks/drafts", {
    headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data)) {
        setDrafts(data);
        } else {
        console.error("Ошибка API:", data);
        setDrafts([]);
        }
    })
    .catch(err => console.error(err));
    }, []);

  return (
    <div className="page-container">
      <Navbar />

      <div style={{ maxWidth: "800px", margin: "40px auto" }}>
        <h1>Черновики</h1>

        {drafts.length === 0 ? (
          <p>Нет черновиков</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {drafts.map(task => (
              <div
                key={task.task_id}
                style={{
                  padding: "15px",
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
                onClick={() => navigate(`/tasks/edit/${task.task_id}`)}
              >
                {task.task_name}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("/tasks")}
          className="btn btn-secondary"
          style={{ marginTop: "20px" }}
        >
          Назад
        </button>
      </div>
    </div>
  );
}

export default Drafts;