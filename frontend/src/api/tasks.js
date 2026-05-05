import api from "./client";

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
};