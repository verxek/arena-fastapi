import api from "./client";

export const contestsApi = {
  getAll: () => api("/contests/"),
  
  getById: (id) => api(`/contests/${id}`),
  
  create: (data) => api("/contests/", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => api(`/contests/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  
  delete: (id) => api(`/contests/${id}`, { method: "DELETE" }),
  
  getRating: (id) => api(`/contests/${id}/rating`),
   
  recalculateScores: (id) => api(`/contests/${id}/recalculate-scores`, {
    method: "POST",
  }),
  
  save: async (data, id = null) => {
    const url = id ? `/contests/${id}` : "/contests/";
    const method = id ? "PUT" : "POST";
    
    return api(url, {
      method,
      body: JSON.stringify(data),
    });
  },
  
  getAuthorTasks: (authorId, includeHidden = true) => {
    const params = new URLSearchParams({
      author_id: authorId,
      include_hidden: includeHidden.toString()
    });
    return api(`/tasks?${params.toString()}`);
  },
  register: (contestId) => api(`/contests/${contestId}/register`, {
    method: "POST",
  }),
  getRating: (contestId) => api(`/contests/${contestId}/rating`),

};