import api, { API_BASE_URL } from "./client";

/**
 * Получить мои решения
 * @param {number} userId 
 */
export async function getMySolutions(userId) {
  return api(`/solutions/my?user_id=${userId}`);
}

/**
 * Получить решения по задаче
 * @param {number} taskId 
 */
export async function getSolutionsByTask(taskId) {
  return api(`/solutions/task/${taskId}`);
}

/**
 * Отправить решение (FormData с файлом)
 * @param {FormData} formData 
 */
export async function submitSolution(formData) {
  const token = localStorage.getItem("access_token");
  
  const res = await fetch(`${API_BASE_URL}/solutions/submit`, {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${token}`
      // Content-Type НЕ ставим!
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Не удалось отправить решение");
  }
  
  return res.json();
}

/**
 * Получить статус решения
 * @param {number} id 
 */
export async function getSolutionStatus(id) {
  return api(`/solutions/${id}/status`);
}

/**
 * Получить решение по ID
 * @param {number} id 
 */
export async function getSolutionById(id) {
  return api(`/solutions/${id}`);
}

/**
 * Получить все посылки контеста
 * @param {number} contestId 
 * @returns {Promise<Array>}
 */
export async function getContestSolutions(contestId) {
  return api(`/solutions/contests/${contestId}/solutions`, {
    cache: "no-store"
  });
}