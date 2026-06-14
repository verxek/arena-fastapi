import api from "./client";

export const adminApi = {
  getUsers: () => api("/admin/users"),

  createUser: (data) => api("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  
  changeRole: (userId, newRole) => 
    api(`/admin/users/${userId}/role?role=${newRole}`, {
      method: "PATCH",
    }),
};