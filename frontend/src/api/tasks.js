import api, { API_BASE_URL } from "./client";

/**
 * Получить список всех задач
 * @returns {Promise<Array>}
 */
export async function getAllTasks() {
  return api("/tasks/");
}

/**
 * Получить задачу по ID
 * @param {number} id 
 */
export async function getTaskById(id) {
  return api(`/tasks/${id}`);
}

/**
 * Создать задачу с загрузкой файлов (FormData)
 * @param {FormData} formData - форма с полями задачи и файлами
 */
export async function createTask(formData) {
  const token = localStorage.getItem("access_token");
  
  // ВАЖНО: НЕ ставим Content-Type — браузер сам добавит multipart/form-data с boundary
  const response = await fetch(`${API_BASE_URL}/tasks/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Ошибка создания задачи");
  }

  return response.json();
}

/**
 * Обновить задачу
 * @param {number} id 
 * @param {Object} data 
 */
export async function updateTask(id, data) {
  return api(`/tasks/${id}`, { 
    method: "PUT", 
    body: JSON.stringify(data) 
  });
}

/**
 * Удалить задачу
 * @param {number} id 
 */
export async function deleteTask(id) {
  return api(`/tasks/${id}`, { method: "DELETE" });
}

/**
 * Получить список категорий задач
 * @returns {Promise<Array>}
 */
export async function getTaskCategories() {
  return api("/tasks/categories");
}

/**
 * Получить список уровней сложности
 * @returns {Promise<Array>}
 */
export async function getTaskDifficulties() {
  return api("/tasks/difficulties");
}

/**
 * Получить задачи по списку ID (batch-запрос)
 * @param {Array<number>} taskIds 
 * @returns {Promise<Array>}
 */
export async function getTasksBatch(taskIds) {
  if (!taskIds || taskIds.length === 0) return [];
  
  const params = new URLSearchParams();
  taskIds.forEach(id => params.append('task_ids', String(id)));
  
  return api(`/tasks/batch?${params.toString()}`);
}