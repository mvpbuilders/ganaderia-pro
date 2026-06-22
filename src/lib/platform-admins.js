export const PLATFORM_ADMIN_EMAILS = [
  "mllucanera@gmail.com",
];

export function isPlatformAdmin(user) {
  return !!user?.email && PLATFORM_ADMIN_EMAILS.includes(user.email);
}