import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  CircleUserRound,
  CheckCheck,
  QrCode,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  School,
  Settings,
  Users,
  UserPlus2,
} from "lucide-react";
import { clearAuth, getUser } from "@/lib/auth";
import api from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const user = getUser();
  const [pendingMappingCount, setPendingMappingCount] = useState(0);
  const [pendingStudentNames, setPendingStudentNames] = useState([]);
  const [showAllPending, setShowAllPending] = useState(false);
  const previousCountRef = useRef(0);
  const initials = (user?.name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const role = user?.role;
  const navItemsByRole = {
    admin: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/profile", label: "Profile", icon: CircleUserRound },
      { to: "/users", label: "Users", icon: Users },
      { to: "/teachers/add", label: "Add Teacher", icon: UserPlus2 },
      { to: "/classes", label: "Classes", icon: School },
      { to: "/students", label: "Students", icon: GraduationCap },
      { to: "/subjects", label: "Subjects", icon: BookOpen },
      { to: "/attendance", label: "Attendance", icon: CalendarCheck2 },
      { to: "/attendance/staff-qr", label: "Staff QR", icon: QrCode },
      { to: "/sessions", label: "Sessions", icon: ClipboardList },
      { to: "/reports", label: "Reports", icon: BarChart3 },
    ],
    teacher: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/profile", label: "Profile", icon: CircleUserRound },
      { to: "/subjects", label: "Subjects", icon: BookOpen },
      { to: "/students", label: "Students", icon: GraduationCap },
      { to: "/students/add", label: "Add Student", icon: UserPlus2 },
      { to: "/attendance/take", label: "Take Student Attendance", icon: CheckCheck },
      { to: "/attendance", label: "Attendance", icon: CalendarCheck2 },
      { to: "/attendance/scanner", label: "QR Scanner", icon: CheckCheck },
      { to: "/sessions", label: "Sessions", icon: ClipboardList },
    ],
    student: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/profile", label: "Profile", icon: CircleUserRound },
      { to: "/student/sessions", label: "Sessions", icon: ClipboardList },
      { to: "/student/subject-progress", label: "Subject Progress", icon: BookOpen },
      { to: "/student/attendance-records", label: "Attendance Records", icon: CalendarCheck2 },
      { to: "/student/attendance-percentage", label: "Attendance Percentage", icon: BarChart3 },
    ],
  };

  const navItems = navItemsByRole[role] || navItemsByRole.student;

  const navItemClass = ({ isActive }) =>
    `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
      isActive ? "bg-stone-900 font-medium text-white" : "text-stone-700 hover:bg-stone-100"
    }`;

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.07;
      masterGain.connect(ctx.destination);

      const tone = (frequency, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.6, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(start);
        osc.stop(start + duration + 0.01);
      };

      const now = ctx.currentTime;
      tone(660, now, 0.08);
      tone(830, now + 0.09, 0.08);
      tone(1040, now + 0.18, 0.12);
    } catch {
      // no-op
    }
  };

  const fetchPendingMappings = useCallback(async () => {
    if (role !== "admin" && role !== "teacher") return;
    try {
      const [usersRes, studentsRes] = await Promise.all([
        api.get("/users?page=1&limit=1000"),
        api.get("/students"),
      ]);
      const users = usersRes.data?.users || [];
      const studentRows = studentsRes.data?.students || [];
      const mappedUserIds = new Set(studentRows.map((item) => item.userId));
      const pending = users
        .filter((item) => item.role === "student" && !mappedUserIds.has(item.userId))
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

      const nextCount = pending.length;
      if (nextCount > previousCountRef.current) {
        playNotificationSound();
      }
      previousCountRef.current = nextCount;
      setPendingMappingCount(nextCount);
      setPendingStudentNames(pending.map((item) => item.name || item.email || `Student ${item.userId}`));
      setShowAllPending(false);
    } catch {
      // no-op
    }
  }, [role]);

  useEffect(() => {
    if (role !== "admin" && role !== "teacher") return;

    fetchPendingMappings();
    const timer = setInterval(fetchPendingMappings, 15000);
    const onStudentMapped = () => {
      fetchPendingMappings();
    };
    const onUserUpdated = () => {
      fetchPendingMappings();
    };
    window.addEventListener("student-mapped", onStudentMapped);
    window.addEventListener("user-updated", onUserUpdated);
    return () => {
      clearInterval(timer);
      window.removeEventListener("student-mapped", onStudentMapped);
      window.removeEventListener("user-updated", onUserUpdated);
    };
  }, [fetchPendingMappings, role]);

  const handleNotificationsClick = () => {
    navigate("/students/add");
  };

  const handleTogglePending = () => {
    setShowAllPending((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-stone-50 via-amber-50/40 to-stone-100">
      <AppNavbar initials={initials} onLogout={handleLogout} user={user} />

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-72 shrink-0 border-r bg-white/90 p-4 md:flex md:flex-col md:justify-between">
          <div>
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Navigation</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} className={navItemClass}>
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="space-y-1 border-t pt-3">
            <button
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100"
              onClick={handleNotificationsClick}
              type="button"
            >
              <span className="flex items-center gap-2">
                <Bell size={16} />
                Notifications
              </span>
              {pendingMappingCount > 0 && (role === "admin" || role === "teacher") ? (
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {pendingMappingCount}
                </span>
              ) : null}
            </button>
            {pendingMappingCount > 0 && (role === "admin" || role === "teacher") ? (
              <div className="mx-3 rounded-md border border-amber-200 bg-amber-50 px-2 py-2">
                <p className="mb-1 text-xs font-semibold text-amber-800">Pending Student Mapping</p>
                <div className="space-y-1">
                  {(showAllPending ? pendingStudentNames : pendingStudentNames.slice(0, 3)).map((name, index) => (
                    <p key={`${name}-${index}`} className="truncate text-xs text-amber-700">
                      {name}
                    </p>
                  ))}
                  {pendingMappingCount > 3 ? (
                    <button
                      className="text-left text-xs font-medium text-amber-700 hover:text-amber-800"
                      onClick={handleTogglePending}
                      type="button"
                    >
                      {showAllPending ? "Show less" : `+${pendingMappingCount - 3} more`}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100">
              <Settings size={16} />
              Settings
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">{children}</main>
      </div>

      <footer className="border-t bg-white/85 backdrop-blur">
        <div className="px-4 py-4 text-center text-sm text-stone-600 md:px-6">
          Student Attendance System
        </div>
      </footer>
    </div>
  );
}
