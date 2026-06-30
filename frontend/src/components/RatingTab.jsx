import { useState, useEffect } from "react";
import { getContestRating } from "../api/contests";

const RatingTab = ({ contestId, tasks }) => {  
  const [rating, setRating] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contestId) return;  

    const fetchRating = async () => {
      try {
        const data = await getContestRating(contestId);
        setRating(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Rating error:", err);
        setRating([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [contestId]);  

  if (loading) {
    return <div className="empty-state">Загрузка рейтинга...</div>;
  }

  return (
    <div className="rating-container">
      <table className="table">
        <thead>
          <tr>
            <th className="rating-col-rank">#</th>
            <th>Участник</th>
            <th className="rating-col-solved">Решено</th>
            <th className="rating-col-score">Очки</th>
            {tasks?.map((_, index) => {
              const letter = String.fromCharCode(1040 + index);
              return (
                <th key={index} className="rating-col-task">
                  {letter}
                </th>
              );
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
                <td className={row.rank <= 3 ? "rating-rank-top" : ""}>
                  {row.rank}
                </td>
                <td className="rating-nickname">{row.nickname}</td>
                <td>{row.solved}</td>
                <td className="rating-score">{row.score}</td>

                {tasks?.map((task, idx) => {
                  const stat = row.tasks?.[idx];
                  return (
                    <td key={task.task_id} className="rating-task-cell">
                      {stat?.score > 0 ? (
                        <div>
                          <span className="rating-task-solved">+{stat.score}</span>
                          {stat.wrong_attempts > 0 && (
                            <div className="rating-task-penalty">
                              −{stat.wrong_attempts}
                            </div>
                          )}
                        </div>
                      ) : stat?.wrong_attempts > 0 ? (
                        <span className="rating-task-wrong">
                          −{stat.wrong_attempts}
                        </span>
                      ) : (
                        <span className="rating-task-empty">•</span>
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