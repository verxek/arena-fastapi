import api from "./client";

/**
 * Получить данные текущего пользователя
 * @returns {Promise<{user_id: number, nickname: string, email: string, role: string, ...}>}
 */
export async function getCurrentUser() {
  return api("/users/me");
}

/**
 * Получить профиль пользователя по ID
 * @param {number} userId 
 */
export async function getUserById(userId) {
  return api(`/users/${userId}`);
}

/**
 * Обновить профиль пользователя
 * @param {number} userId 
 * @param {Object} data - данные для обновления
 */
export async function updateUser(userId, data) {
  return api(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}