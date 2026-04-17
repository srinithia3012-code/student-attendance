import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CircleUserRound,
  CheckCheck,
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
  AlertCircle,
  BellRing,
} from "lucide-react";
import { clearAuth, getUser } from "@/lib/auth";
import api from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";

const getTodayIso = () => new Date().toLocaleDateString("en-CA");

const getNotifiedStorageKey = () => `staff_absence_notifications_${getTodayIso()}`;

const loadNotifiedKeys = () => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(getNotifiedStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const saveNotifiedKeys = (keys) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getNotifiedStorageKey(), JSON.stringify(Array.from(keys)));
  } catch {
    // no-op
  }
};

const sendBrowserNotifications = (alerts) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const notifiedKeys = loadNotifiedKeys();
  let updated = false;

  alerts.forEach((alert) => {
    if (notifiedKeys.has(alert.key)) return;

    const title =
      alert.status === "absent"
        ? `Teacher absent on ${alert.dateLabel}`
        : `Teacher running late on ${alert.dateLabel}`;
    const body = [alert.teacherName, alert.subject ? `Subject: ${alert.subject}` : null]
      .filter(Boolean)
      .join(" - ");

    new Notification(title, {
      body,
      tag: alert.key,
    });

    notifiedKeys.add(alert.key);
    updated = true;
  });

  if (updated) {
    saveNotifiedKeys(notifiedKeys);
  }
};

const formatAttendanceDate = (attendanceDate) => {
  if (!attendanceDate) return "Unknown date";

  const [year, month, day] = attendanceDate.split("-").map(Number);
  const formatted = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(formatted);
};

const getLatestAttendanceDate = (records) =>
  records.reduce((latest, record) => {
    if (!record?.attendanceDate) return latest;
    if (!latest) return record.attendanceDate;
    return String(record.attendanceDate) > String(latest) ? record.attendanceDate : latest;
  }, "");

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const role = user?.role;
  const isStudent = role === "student";
  const [pendingMappingCount, setPendingMappingCount] = useState(0);
  const [pendingItems, setPendingItems] = useState([]);
  const [showAllPending, setShowAllPending] = useState(false);
  const [studentAlerts, setStudentAlerts] = useState([]);
  const [studentNotificationPermission, setStudentNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const [studentAlertError, setStudentAlertError] = useState("");
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
      { to: "/staff-attendance", label: "Staff Attendance", icon: CheckCheck },
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
      { to: "/staff-attendance", label: "Staff Attendance", icon: CheckCheck },
      { to: "/sessions", label: "Sessions", icon: ClipboardList },
    ],
    student: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/profile", label: "Profile", icon: CircleUserRound },
      { to: "/student/staff-availability", label: "Staff Availability", icon: Users },
      { to: "/student/sessions", label: "Sessions", icon: ClipboardList },
      { to: "/student/subject-progress", label: "Subject Progress", icon: BookOpen },
      { to: "/student/attendance-records", label: "Attendance Records", icon: CalendarCheck2 },
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

  useEffect(() => {
    if (role !== "admin" && role !== "teacher") return;

    const fetchPendingMappings = async () => {
      try {
        const [usersRes, studentsRes] = await Promise.all([
          api.get("/users?page=1&limit=1000"),
          api.get("/students"),
        ]);
        const users = usersRes.data?.users || [];
        const studentRows = studentsRes.data?.students || [];
        const mappedUserIds = new Set(studentRows.map((item) => item.userId));
        const pendingStudents = users.filter((item) => item.role === "student" && !mappedUserIds.has(item.userId));
        const pendingTeachers =
          role === "admin"
            ? users.filter((item) => item.role === "teacher" && item.status === "inactive")
            : [];
        const pending = [...pendingStudents, ...pendingTeachers].sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );

        const nextCount = pending.length;
        if (nextCount > previousCountRef.current) {
          playNotificationSound();
        }
        previousCountRef.current = nextCount;
        setPendingMappingCount(nextCount);
        setPendingItems(
          pending.map((item) => ({
            userId: item.userId,
            name: item.name || item.email || `${item.role === "teacher" ? "Teacher" : "Student"} ${item.userId}`,
            role: item.role,
          }))
        );
        setShowAllPending(false);
      } catch {
        // no-op
      }
    };

    void Promise.resolve().then(fetchPendingMappings);
    const timer = setInterval(() => {
      void fetchPendingMappings();
    }, 15000);
    const onStudentMapped = () => {
      void fetchPendingMappings();
    };
    const onUserUpdated = () => {
      void fetchPendingMappings();
    };
    window.addEventListener("student-mapped", onStudentMapped);
    window.addEventListener("user-updated", onUserUpdated);
    return () => {
      clearInterval(timer);
      window.removeEventListener("student-mapped", onStudentMapped);
      window.removeEventListener("user-updated", onUserUpdated);
    };
  }, [role]);

  useEffect(() => {
    if (!isStudent) return;

    const fetchStudentAlerts = async () => {
      setStudentAlertError("");
      try {
        const [staffRes, subjectsRes, usersRes] = await Promise.all([
          api.get("/staff-attendance"),
          api.get("/subjects"),
          api.get("/users?page=1&limit=1000"),
        ]);

        const staffAttendance = staffRes.data?.attendance || [];
        const subjects = subjectsRes.data?.subjects || [];
        const users = usersRes.data?.users || [];
        const teacherUsers = users.filter((item) => item.role === "teacher");
        const latestAttendanceDate = getLatestAttendanceDate(staffAttendance);

        const teacherToSubjects = subjects.reduce((acc, subject) => {
          if (!subject.teacherId) return acc;
          if (!acc[subject.teacherId]) acc[subject.teacherId] = [];
          acc[subject.teacherId].push(subject.name);
          return acc;
        }, {});

        const uniqueAlerts = new Map();

        staffAttendance
          .filter((record) => record.attendanceDate === latestAttendanceDate)
          .filter((record) => record.status === "absent")
          .forEach((record) => {
            const key = `${record.teacherId}-${record.attendanceDate}`;
            if (uniqueAlerts.has(key)) return;

            const teacherUser = teacherUsers.find((item) => Number(item.userId) === Number(record.teacherId));
            const subjectNames = teacherToSubjects[record.teacherId] || [];
            uniqueAlerts.set(key, {
              key,
              teacherId: record.teacherId,
              attendanceDate: record.attendanceDate,
              dateLabel: formatAttendanceDate(record.attendanceDate),
              teacherName: teacherUser?.name || `Teacher ${record.teacherId}`,
              status: record.status,
              subject: record.subject || subjectNames[0] || "",
            });
          });

        const alerts = Array.from(uniqueAlerts.values());

        setStudentAlerts(alerts);

        if (alerts.length > 0) {
          sendBrowserNotifications(alerts);
        }
      } catch (error) {
        console.error("Error fetching student alerts:", error);
        setStudentAlertError("Unable to load staff absence alerts right now.");
      }
    };

    const refreshAlerts = () => {
      void fetchStudentAlerts();
    };

    void Promise.resolve().then(refreshAlerts);
    const timer = setInterval(refreshAlerts, 30000);
    const onStaffAttendanceUpdated = () => {
      refreshAlerts();
    };

    window.addEventListener("staff-attendance-updated", onStaffAttendanceUpdated);
    return () => {
      clearInterval(timer);
      window.removeEventListener("staff-attendance-updated", onStaffAttendanceUpdated);
    };
  }, [isStudent]);

  const handleEnableBrowserNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      setStudentNotificationPermission("granted");
      return;
    }
    const nextPermission = await Notification.requestPermission();
    setStudentNotificationPermission(nextPermission);
  };

  const handleNotificationsClick = () => {
    navigate("/students/add");
  };

  const handleTogglePending = () => {
    setShowAllPending((prev) => !prev);
  };

  const handlePendingItemClick = (itemRole) => {
    if (itemRole === "teacher") {
      navigate("/teachers/add");
      return;
    }
    navigate("/students/add");
  };
  const showStudentBanner = isStudent && location.pathname !== "/dashboard";

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
            {(role === "admin" || role === "teacher") && (
              <>
                <button
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100"
                  onClick={handleNotificationsClick}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <Bell size={16} />
                    Pending mappings
                  </span>
                  {pendingMappingCount > 0 ? (
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                      {pendingMappingCount}
                    </span>
                  ) : null}
                </button>
                {pendingMappingCount > 0 ? (
                  <div className="mx-3 rounded-md border border-amber-200 bg-amber-50 px-2 py-2">
                    <p className="mb-1 text-xs font-semibold text-amber-800">Pending User Setup</p>
                    <div className="space-y-1">
                      {(showAllPending ? pendingItems : pendingItems.slice(0, 3)).map((item, index) => (
                        <button
                          key={`${item.userId}-${index}`}
                          className="flex w-full items-center justify-between gap-2 text-left text-xs text-amber-700 hover:text-amber-900"
                          onClick={() => handlePendingItemClick(item.role)}
                          type="button"
                        >
                          <span className="truncate">{`${item.role === "teacher" ? "Teacher" : "Student"} mapping: ${item.name}`}</span>
                          <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                            {item.role}
                          </span>
                        </button>
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
              </>
            )}
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100">
              <Settings size={16} />
              Settings
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {showStudentBanner && studentAlerts.length > 0 ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-amber-50 p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-rose-100 p-2 text-rose-700">
                    <BellRing size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">
                      Staff absence alert
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-stone-900">
                      {studentAlerts.length} teacher{studentAlerts.length > 1 ? "s are" : " is"} marked absent
                    </h2>
                    <p className="mt-1 text-sm text-stone-600">
                      You can check the list below. Each alert shows the exact attendance date.
                    </p>
                  </div>
                </div>
                {studentNotificationPermission !== "granted" ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
                    onClick={handleEnableBrowserNotifications}
                    type="button"
                  >
                    <AlertCircle size={16} />
                    Enable browser notifications
                  </button>
                ) : null}
              </div>
              {studentAlertError ? (
                <p className="mt-3 text-sm text-rose-700">{studentAlertError}</p>
              ) : null}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {studentAlerts.map((alert) => (
                  <div key={alert.key} className="rounded-xl border border-rose-200 bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-rose-900">{alert.teacherName}</p>
                    <p className="mt-1 text-sm text-rose-700">
                      {alert.dateLabel}
                      {alert.subject ? `, subject: ${alert.subject}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {children}
        </main>
      </div>

      <footer className="border-t bg-white/85 backdrop-blur">
        <div className="px-4 py-4 text-center text-sm text-stone-600 md:px-6">
          Student Attendance System
        </div>
      </footer>
    </div>
  );
}
