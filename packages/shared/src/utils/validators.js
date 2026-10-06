export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password) {
  // Minimo 8 caracteres, al menos una letra y un numero
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}
