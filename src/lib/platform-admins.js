export const PLATFORM_ADMIN_EMAILS = [
  "jdelhierro2192@gmail.com",
];

export function isPlatformAdmin(user) {
  return !!user?.email && PLATFORM_ADMIN_EMAILS.includes(user.email);
}