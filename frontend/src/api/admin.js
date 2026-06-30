import api from "./client";

/**
 * Получить список всех пользователей (для админ-панели)
 * @returns {Promise<Array>}
 */
export async function getAllUsers() {
  return api("/admin/users");
}

/**
 * Создать нового пользователя (администратором)
 * @param {Object} data - данные пользователя
 */
export async function createUser(data) {
  return api("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Изменить роль пользователя
 * @param {number} userId 
 * @param {number|string} newRole - новая роль
 */
export async function changeUserRole(userId, newRole) {
  return api(`/admin/users/${userId}/role?role=${newRole}`, {
    method: "PATCH",
  });
}