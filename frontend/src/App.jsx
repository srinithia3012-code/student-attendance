import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AttendancePage from "./pages/AttendancePage.jsx";
import AttendanceProgressPage from "./pages/AttendanceProgressPage.jsx";
import AttendanceScannerPage from "./pages/AttendanceScannerPage.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import SessionsPage from "./pages/SessionsPage.jsx";
import Signup from "./pages/Signup.jsx";
import StudentAttendancePage from "./pages/StudentAttendancePage.jsx";
import StudentAttendancePercentagePage from "./pages/StudentAttendancePercentagePage.jsx";
import StudentAttendanceRecordsPage from "./pages/StudentAttendanceRecordsPage.jsx";
import StudentSessionsPage from "./pages/StudentSessionsPage.jsx";
import StudentSubjectProgressPage from "./pages/StudentSubjectProgressPage.jsx";
import StudentsPage from "./pages/StudentsPage.jsx";
import StaffQrGeneratorPage from "./pages/StaffQrGeneratorPage.jsx";
import SubjectsPage from "./pages/SubjectsPage.jsx";
import TakeAttendancePage from "./pages/TakeAttendancePage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import ClassesPage from "./pages/ClassesPage.jsx";
import AddStudentPage from "./pages/AddStudentPage.jsx";
import AddTeacherPage from "./pages/AddTeacherPage.jsx";

function withLayout(element, allowedRoles) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout>{element}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={withLayout(<Dashboard />)} />
      <Route path="/profile" element={withLayout(<Profile />)} />
      <Route path="/users" element={withLayout(<UsersPage />, ["admin"])} />
      <Route path="/teachers/add" element={withLayout(<AddTeacherPage />, ["admin"])} />
      <Route path="/classes" element={withLayout(<ClassesPage />, ["admin"])} />
      <Route path="/students" element={withLayout(<StudentsPage />, ["admin", "teacher"])} />
      <Route path="/students/add" element={withLayout(<AddStudentPage />, ["admin", "teacher"])} />
      <Route path="/subjects" element={withLayout(<SubjectsPage />, ["admin", "teacher"])} />
      <Route path="/attendance" element={withLayout(<AttendancePage />, ["admin", "teacher"])} />
      <Route path="/attendance-progress" element={withLayout(<AttendanceProgressPage />, ["admin", "teacher"])} />
      <Route path="/attendance/scanner" element={withLayout(<AttendanceScannerPage />, ["teacher"])} />
      <Route path="/attendance/staff-qr" element={withLayout(<StaffQrGeneratorPage />, ["admin"])} />
      <Route path="/my-attendance" element={withLayout(<StudentAttendancePage />, ["student"])} />
      <Route path="/student/sessions" element={withLayout(<StudentSessionsPage />, ["student"])} />
      <Route path="/student/subject-progress" element={withLayout(<StudentSubjectProgressPage />, ["student"])} />
      <Route path="/student/attendance-records" element={withLayout(<StudentAttendanceRecordsPage />, ["student"])} />
      <Route path="/student/attendance-percentage" element={withLayout(<StudentAttendancePercentagePage />, ["student"])} />
      <Route path="/sessions" element={withLayout(<SessionsPage />, ["admin", "teacher"])} />
      <Route path="/reports" element={withLayout(<ReportsPage />, ["admin"])} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
