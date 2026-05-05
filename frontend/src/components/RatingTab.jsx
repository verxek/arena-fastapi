import { useState, useEffect } from "react";

const RatingTab = ({ contestId, token, tasks }) => {
  const [rating, setRating] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contestId || !token) return;

    fetch(`http://127.0.0.1:8000/contests/${contestId}/rating`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch rating");
        return res.json();
      })
      .then((data) => setRating(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Rating error:", err))
      .finally(() => setLoading(false));
  }, [contestId, token]);

  if (loading) {
    return <div className="empty-state">Загрузка рейтинга...</div>;
  }

  return (
    <div className="rating-container" style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th className="th" style={{ width: "50px" }}>#</th>
            <th className="th">Участник</th>
            <th className="th" style={{ width: "80px" }}>Решено</th>
            <th className="th" style={{ width: "80px" }}>Очки</th>
            {/* Колонки для каждой задачи */}
            {tasks?.map((_, index) => {
              const letter = String.fromCharCode(1040 + index); // А, Б, В...
              return <th key={index} className="th" style={{ textAlign: "center", width: "70px" }}>{letter}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {rating.length === 0 ? (
            <tr>
              <td colSpan={5 + (tasks?.length || 0)} className="empty-cell">
                Пока нет участников
              </td>
            </tr>
          ) : (
            rating.map((row) => (
              <tr key={row.user_id}>
                <td className="td" style={{ fontWeight: row.rank <= 3 ? "700" : "400" }}>
                  {row.rank}
                </td>
                <td className="td" style={{ fontWeight: "600" }}>{row.nickname}</td>
                <td className="td">{row.solved}</td>
                <td className="td" style={{ fontWeight: "700", color: "#1f2739" }}>{row.score}</td>
            

                {/* Ячейки задач */}
                {tasks?.map((task, idx) => {
                  const stat = row.tasks[idx]; 
                  return (
                    <td key={task.task_id} className="td" style={{ textAlign: "center" }}>
                      {stat?.score > 0 ? (
                        <div>
                          <span style={{ color: "#10b981", fontWeight: "700" }}>+{stat.score}</span>
                          {stat.wrong_attempts > 0 && (
                            <div style={{ fontSize: "11px", color: "#ef4444" }}>−{stat.wrong_attempts}</div>
                          )}
                        </div>
                      ) : stat?.wrong_attempts > 0 ? (
                        <span style={{ color: "#ef4444" }}>−{stat.wrong_attempts}</span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>•</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RatingTab;