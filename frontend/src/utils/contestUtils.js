/**
 * Вычисляет время окончания контеста
 * @param {Object} contest - Объект контеста
 * @returns {number} Timestamp окончания (в миллисекундах)
 */
export const getContestEndTime = (contest) => {
  if (!contest?.start_time || !contest?.duration) {
    return 0;
  }
  
  const startTime = new Date(contest.start_time).getTime();
  const durationMs = (contest.duration || 0) * 60 * 1000; // минуты → миллисекунды
  
  return startTime + durationMs;
};

/**
 * Вычисляет время начала контеста
 * @param {Object} contest - Объект контеста
 * @returns {number} Timestamp начала (в миллисекундах)
 */
export const getContestStartTime = (contest) => {
  if (!contest?.start_time) return 0;
  return new Date(contest.start_time).getTime();
};

/**
 * Сортирует контесты по дате окончания (сначала свежие)
 * @param {Array} contests - Массив контестов
 * @returns {Array} Отсортированный массив
 */
export const sortContestsByEndTime = (contests) => {
  if (!Array.isArray(contests)) return [];
  
  return [...contests].sort((a, b) => {
    const endA = getContestEndTime(a);
    const endB = getContestEndTime(b);
    return endB - endA; // По убыванию (сначала новые)
  });
};

/**
 * Сортирует контесты по дате начала (сначала ближайшие)
 * @param {Array} contests - Массив контестов
 * @returns {Array} Отсортированный массив
 */
export const sortContestsByStartTime = (contests) => {
  if (!Array.isArray(contests)) return [];
  
  return [...contests].sort((a, b) => {
    const startA = getContestStartTime(a);
    const startB = getContestStartTime(b);
    return startA - startB; // По возрастанию (сначала ближайшие)
  });
};

/**
 * Фильтрует и сортирует завершенные контесты
 * @param {Array} contests - Массив контестов
 * @returns {Array} Завершенные контесты, отсортированные по дате окончания
 */
export const getFinishedContests = (contests) => {
  if (!Array.isArray(contests)) return [];
  
  return sortContestsByEndTime(
    contests.filter(c => c.is_finished)
  );
};

/**
 * Фильтрует и сортирует активные и предстоящие контесты
 * @param {Array} contests - Массив контестов
 * @returns {Array} Активные и предстоящие, отсортированные по дате начала
 */
export const getActiveAndUpcomingContests = (contests) => {
  if (!Array.isArray(contests)) return [];
  
  return sortContestsByStartTime(
    contests.filter(c => c.is_upcoming || c.is_active)
  );
};

/**
 * Форматирует оставшееся время контеста
 * @param {number} endTime - Timestamp окончания
 * @returns {string} Форматированная строка "ЧЧ:ММ:СС"
 */
export const formatTimeLeft = (endTime) => {
  const now = Date.now();
  const diff = endTime - now;
  
  if (diff <= 0) return "00:00:00";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};