// In production, API is served from same origin via nginx proxy
// In development, we need to hit the Flask dev server directly
const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5000';

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  return data;
}

export async function register(username, teamName, password) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, teamName, password }),
  });
  return handleResponse(response);
}

export async function login(username, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(response);
}

export async function logout() {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse(response);
}

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response);
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return handleResponse(response);
}

export async function listFiles() {
  const response = await fetch(`${API_BASE}/api/files`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response);
}

export function getFileUrl(fileId) {
  return `${API_BASE}/api/files/${fileId}`;
}
