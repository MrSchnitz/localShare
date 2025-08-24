export function checkAdmin() {
  return document.cookie.split(";").map(cookie => cookie.trim()).some(cookie => cookie.startsWith("superuser"));
}