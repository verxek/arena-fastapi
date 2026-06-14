import { API_BASE_URL } from "./client";

/**
 * Авторизация пользователя
 * @param {string} nickname 
 * @param {string} password 
 * @returns {Promise<{access_token: string, refresh_token: string, user_id: number, role: string}>}
 */
export async function login(nickname, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Бросаем ошибку с сообщением от сервера — она попадёт в catch компонента
    throw new Error(error.detail || "Неверный логин или пароль");
  }

  return response.json();
}

/**
 * Регистрация нового пользователя (на будущее)
 * @param {Object} data 
 */
export async function register(data) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Ошибка регистрации");
  }

  return response.json();
}