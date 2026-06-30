import { useState, useEffect, useRef } from "react";
import SubmissionRow from "../components/SubmissionRow";
import { getContestSolutions } from "../api/solutions";


const SubmissionsTab = ({ contestId }) => {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("access_token");
  const intervalRef = useRef(null);

  const fetchSolutions = async (showLoader = false) => {
    if (!contestId || !token) return;
    
    if (showLoader) setLoading(true);
    
    try {
      const data = await getContestSolutions(contestId, token);
      setSolutions(data);
    } catch (err) {
      console.error("Error fetching solutions:", err);
      if (showLoader) setSolutions([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Первоначальная загрузка
  useEffect(() => {
    if (!contestId || !token) {
      setLoading(false);
      return;
    }
    fetchSolutions(true);
  }, [contestId, token]);

  // Polling каждые 3 секунды для обновления статусов
  useEffect(() => {
    if (!contestId || !token) return;
    
    intervalRef.current = setInterval(() => {
      fetchSolutions(false);
    }, 3000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [contestId, token]);

  if (loading) {
    return <div className="empty-state">Загрузка отправок...</div>;
  }

  return (
    <div className="submissions-container">
      <table className="table">
        <thead>
          <tr>
            <th>№</th>
            <th>Время</th>
            <th>Никнейм</th>
            <th>Задача</th>
            <th>Язык</th>
            <th>Вердикт</th>
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