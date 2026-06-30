import api from "./client";

/**
 * Получить список всех контестов
 * @returns {Promise<Array>}
 */
export async function getAllContests() {
  return api("/contests/");
}

/**
 * Получить контест по ID
 * @param {number} id 
 */
export async function getContestById(id) {
  return api(`/contests/${id}`);
}

/**
 * Создать новый контест
 * @param {Object} data 
 */
export async function createContest(data) {
  return api("/contests/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Обновить существующий контест
 * @param {number} id 
 * @param {Object} data 
 */
export async function updateContest(id, data) {
  return api(`/contests/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Удалить контест
 * @param {number} id 
 */
export async function deleteContest(id) {
  return api(`/contests/${id}`, { method: "DELETE" });
}

/**
 * Сохранить контест (создать или обновить)
 * @param {Object} data 
 * @param {number|null} id - если передан, обновляет существующий; иначе создаёт новый
 */
export async function saveContest(data, id = null) {
  const url = id ? `/contests/${id}` : "/contests/";
  const method = id ? "PUT" : "POST";
  
  return api(url, {
    method,
    body: JSON.stringify(data),
  });
}

/**
 * Пересчитать баллы участников контеста
 * @param {number} id 
 */
export async function recalculateContestScores(id) {
  return api(`/contests/${id}/recalculate-scores`, {
    method: "POST",
  });
}

/**
 * Получить задачи автора (для добавления в контест)
 * @param {number} authorId 
 * @param {boolean} includeHidden 
 */
export async function getAuthorTasks(authorId, includeHidden = true) {
  const params = new URLSearchParams({
    author_id: authorId,
    include_hidden: includeHidden.toString()
  });
  return api(`/tasks?${params.toString()}`);
}

/**
 * Зарегистрироваться на контест
 * @param {number} contestId 
 */
export async function registerToContest(contestId) {
  return api(`/contests/${contestId}/register`, {
    method: "POST",
  });
}

/**
 * Получить рейтинг контеста
 * @param {number} contestId 
 * @returns {Promise<Array>}
 */
export async function getContestRating(contestId) {
  return api(`/contests/${contestId}/rating`);
}

/**
 * Получить список всех контестов (без авторизации)
 * Используется для публичного доступа на главной странице
 * @returns {Promise<Array>}
 */
export async function getAllContestsPublic() {
  const response = await fetch(`/contests/`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
}