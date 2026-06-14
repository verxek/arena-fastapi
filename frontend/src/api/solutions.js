import api from "./client";
import { API_BASE_URL } from "./client";

export const solutionsApi = {
  getMySolutions: (userId) => api(`/solutions/my?user_id=${userId}`),
  
  getByTask: (taskId) => api(`/solutions/task/${taskId}`),
  
  submit: (formData) => {
    const token = localStorage.getItem("access_token");
    return fetch(`${API_BASE_URL}/solutions/submit`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error("Failed to submit solution");
      return res.json();
    });
  },
  getStatus: (id) => api(`/solutions/${id}/status`),
  getById: (id) => api(`/solutions/${id}`),
  getByContest: (contestId) => api(`/solutions/contests/${contestId}/solutions`),
};