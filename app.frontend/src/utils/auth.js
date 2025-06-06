// Funcții de lucru cu JWT și user

export function isTokenExpired() {
  const expiry = localStorage.getItem('token_expiry');
  if (!expiry) return true;

  const now = new Date();
  return new Date(expiry) < now;
}

export function getToken() {
  if (isTokenExpired()) {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expiry');
    return null;
  }
  return localStorage.getItem('token');
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('token_expiry');
}

function parseJwt(token) {
  try {
    const base64Payload = token.split('.')[1]; // partea din mijloc a JWT
    const decodedPayload = atob(base64Payload); // decodează base64
    return JSON.parse(decodedPayload); // parsează în obiect
  } catch (e) {
    return null;
  }
}

export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  return parseJwt(token); // returnează { id, email, role, etc. }
}