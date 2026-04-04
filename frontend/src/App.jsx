import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import DashboardPage from "./pages/DashboardPage";
import BookReaderPage from "./pages/BookReaderPage";
import AddBookPage from "./pages/AddBookPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AppLayout from "./components/AppLayout";
import BookmarksPage from "./pages/BookmarksPage";

function App() {
  return (
    <div className="min-h-screen bg-[#050505]">
      <Routes>
        {/* Auth routes — no sidebar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* App routes — all wrapped in AppLayout (Navbar + Sidebar) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/books/:id" element={<BookReaderPage />} />

          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <BookmarksPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-book"
            element={
              <ProtectedRoute requiredRole={["librarian", "admin"]}>
                <AddBookPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </div>
  );
}

export default App;

