import { redirect } from "next/navigation";

/**
 * Root: redirect unauthenticated users to login,
 * authenticated users to their role-appropriate dashboard.
 */
export default function RootPage() {
  // Middleware handles auth — if we reach here, redirect to login
  redirect("/login");
}
