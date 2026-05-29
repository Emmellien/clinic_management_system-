export function getAuthToken() {
  return localStorage.getItem('token');
}

export function getAuthRole() {
  return localStorage.getItem('role');
}

// Decode JWT payload without verifying signature (client-side only for UI gating)
export function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getRoleFromToken() {
  const token = getAuthToken();
  const payload = decodeJwtPayload(token);
  return payload?.role || null;
}

