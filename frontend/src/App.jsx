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

const publicRoutes = [
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/auth/callback", element: <AuthCallback /> },
];

const protectedRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/profile", element: <Profile /> },
  { path: "/users", element: <UsersPage />, allowedRoles: ["admin"] },
  { path: "/teachers/add", element: <AddTeacherPage />, allowedRoles: ["admin"] },
  { path: "/classes", element: <ClassesPage />, allowedRoles: ["admin"] },
  { path: "/students", element: <StudentsPage />, allowedRoles: ["admin", "teacher"] },
  { path: "/students/add", element: <AddStudentPage />, allowedRoles: ["admin", "teacher"] },
  { path: "/subjects", element: <SubjectsPage />, allowedRoles: ["admin", "teacher"] },
  { path: "/attendance", element: <AttendancePage />, allowedRoles: ["admin", "teacher"] },
  { path: "/attendance/take", element: <TakeAttendancePage />, allowedRoles: ["admin", "teacher"] },
  { path: "/attendance-progress", element: <AttendanceProgressPage />, allowedRoles: ["admin", "teacher"] },
  { path: "/attendance/scanner", element: <AttendanceScannerPage />, allowedRoles: ["teacher"] },
  { path: "/attendance/staff-qr", element: <StaffQrGeneratorPage />, allowedRoles: ["admin"] },
  { path: "/my-attendance", element: <StudentAttendancePage />, allowedRoles: ["student"] },
  { path: "/student/sessions", element: <StudentSessionsPage />, allowedRoles: ["student"] },
  { path: "/student/subject-progress", element: <StudentSubjectProgressPage />, allowedRoles: ["student"] },
  { path: "/student/attendance-records", element: <StudentAttendanceRecordsPage />, allowedRoles: ["student"] },
  { path: "/student/attendance-percentage", element: <StudentAttendancePercentagePage />, allowedRoles: ["student"] },
  { path: "/sessions", element: <SessionsPage />, allowedRoles: ["admin", "teacher"] },
  { path: "/reports", element: <ReportsPage />, allowedRoles: ["admin"] },
];

export default function App() {
  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      {protectedRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={withLayout(route.element, route.allowedRoles)}
        />
      ))}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
