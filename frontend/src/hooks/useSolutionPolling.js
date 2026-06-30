import { useState, useEffect, useRef } from "react";
import { getSolutionStatus } from "../api/solutions";

const INTERMEDIATE_STATUSES = ["Pending", "In Queue", "Processing"];

export function useSolutionPolling(solutionId, interval = 2000) {
  const [status, setStatus] = useState("Pending");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!solutionId) return;

    let isMounted = true;

    const poll = async () => {
      try {
        const data = await getSolutionStatus(solutionId);
        
        if (!isMounted) return;
        
        setStatus(data.status);
        setIsLoading(false);
        
        // Если статус НЕ промежуточный, значит проверка завершена
        if (!INTERMEDIATE_STATUSES.includes(data.status)) {
          setResult(data);
          return; // Останавливаем опрос
        }
        
        // Продолжаем опрос
        timerRef.current = setTimeout(poll, interval);
      } catch (err) {
        console.error("Polling error:", err);
        if (isMounted) {
          setStatus("Error");
          setIsLoading(false);
        }
      }
    };

    poll();
    
    return () => {
      isMounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [solutionId, interval]);

  // Возвращаем дефолтные значения, если solutionId нет
  
  if (!solutionId) {
    return { status: "Pending", result: null, isLoading: false };
  }

  return { status, result, isLoading };
}