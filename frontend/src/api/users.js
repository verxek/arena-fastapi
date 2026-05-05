import api from "./client";

export const usersApi = {
  getCurrent: () => api("/users/me"),
  
  getProfile: (userId) => api(`/users/${userId}`),
  
  updateProfile: (userId, data) => api(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
};