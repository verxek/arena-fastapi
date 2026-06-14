import api from "./client";
import { API_BASE_URL } from "./client";

export const tasksApi = {
  getAll: () => api("/tasks/"),
  
  getById: (id) => api(`/tasks/${id}`),
  
  create: (formData) => {
    const token = localStorage.getItem("access_token");
    return fetch(`${API_BASE_URL}/tasks/`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData, 
    }).then(res => {
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    });
  },
  
  update: (id, data) => api(`/tasks/${id}`, { 
    method: "PUT", 
    body: JSON.stringify(data) 
  }),
  
  delete: (id) => api(`/tasks/${id}`, { method: "DELETE" }),

  /** Получить список категорий */
  getCategories: () => api("/tasks/categories"),
  
  /** Получить список уровней сложности */
  getDifficulties: () => api("/tasks/difficulties"),
  
  /** 
   * Создать задачу с загрузкой файлов
   * @param {FormData} formData - FormData с полями задачи и файлами
   */
  createWithFiles: async (formData) => {
    const token = localStorage.getItem("access_token");
    
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
  },
  getBatch: (taskIds) => {
    if (!taskIds || taskIds.length === 0) return Promise.resolve([]);
    
    const params = new URLSearchParams();
    taskIds.forEach(id => params.append('task_ids', String(id)));
    
    return api(`/tasks/batch?${params.toString()}`);
  },
};