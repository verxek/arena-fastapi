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
    throw new Error(error.detail || "Неверный логин или пароль");
  }

  return response.json();
}

/**
 * Регистрация нового пользователя
 * @param {Object} data - { email, nickname, password }
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

/**
 * Отправка кода подтверждения на email
 * @param {string} email 
 */
export async function sendRegistrationCode(email) {
  const response = await fetch(`${API_BASE_URL}/auth/register/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Ошибка отправки кода");
  }

  return response.json();
}

/**
 * Проверка кода подтверждения
 * @param {string} email 
 * @param {string} code 
 */
export async function verifyRegistrationCode(email, code) {
  const response = await fetch(`${API_BASE_URL}/auth/register/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Неверный код подтверждения");
  }

  return response.json();
}