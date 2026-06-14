import { useState, useEffect } from "react";
import { useSolutionPolling } from "../hooks/useSolutionPolling"; // <-- используем хук
import SubmissionRow from "../components/SubmissionRow";

const SubmissionsTab = ({ contestId, token }) => {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contestId || !token) return;

    const fetchSolutions = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/solutions/contests/${contestId}/solutions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (res.ok) {
          const data = await res.json();
          setSolutions(Array.isArray(data) ? data : []);
        } else {
          console.error("Failed to fetch solutions");
          setSolutions([]);
        }
      } catch (err) {
        console.error("Network error:", err);
        setSolutions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSolutions();
  }, [contestId, token]);

  if (loading) {
    return <div className="empty-state">Загрузка отправок...</div>;
  }

  return (
    <div className="submissions-container">
      <table className="table">
        <thead>
          <tr>
            <th className="th">№</th>
            <th className="th">Время</th>
            <th className="th">Никнейм</th>
            <th className="th">Задача</th>
            <th className="th">Язык</th>
            <th className="th">Вердикт</th>
          </tr>
        </thead>
        <tbody>
          {solutions.length === 0 ? (
            <tr>
              <td colSpan="6" className="empty-cell">Пока нет отправок</td>
            </tr>
          ) : (
            solutions.map((s, index) => (
              <SubmissionRow
                key={s.id}
                solution={s}
                index={index}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SubmissionsTab;