import { useState, useEffect, useRef } from "react";
import { solutionsApi } from "../api/solutions";

const INTERMEDIATE_STATUSES = ["Pending", "In Queue", "Processing"];

export function useSolutionPolling(solutionId, interval = 2000) {
  const [status, setStatus] = useState("Pending");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!solutionId) {
      setStatus("Pending");
      setResult(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const poll = async () => {
      try {
        const data = await solutionsApi.getStatus(solutionId);
        
        if (!isMounted) return;
        
        // data.status теперь содержит строку из БД, например "Accepted" или "Processing"
        setStatus(data.status);
        setIsLoading(false);
        
        // Если статус НЕ промежуточный, значит проверка завершена
        if (!INTERMEDIATE_STATUSES.includes(data.status)) {
          setResult(data);
          return; // Останавливаем опрос
        }
        
        // Иначе продолжаем опрос
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

  return { status, result, isLoading };
}