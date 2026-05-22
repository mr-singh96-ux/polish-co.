import { Navigate } from "react-router-dom";

// Admin now logs in through the regular /auth page.
export default function AdminLogin() {
  return <Navigate to="/auth" replace />;
}
