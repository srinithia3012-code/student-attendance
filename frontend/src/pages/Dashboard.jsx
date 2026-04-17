import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarCheck2, GraduationCap, School, AlertCircle, Clock, BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";

const metricConfig = [
  {
    key: "students",
    label: "Total Students",
    icon: GraduationCap,
    tone: "from-amber-50 to-white border-amber-200 text-amber-700",
    routeTeacher: "/students",
    routeStudent: "/student/attendance-records",
  },
  {
    key: "presentToday",
    label: "Present Today",
    icon: CalendarCheck2,
    tone: "from-emerald-50 to-white border-emerald-200 text-emerald-700",
    routeTeacher: "/attendance",
    routeStudent: "/my-attendance",
  },
  {
    key: "absentToday",
    label: "Absent Today",
    icon: BookOpen,
    tone: "from-rose-50 to-white border-rose-200 text-rose-700",
    routeTeacher: "/attendance",
    routeStudent: "/my-attendance",
  },
  {
    key: "classes",
    label: "Total Class",
    icon: School,
    tone: "from-blue-50 to-white border-blue-200 text-blue-700",
    routeTeacher: "/classes",
    routeStudent: "/student/sessions",
  },
];

const loadNotifiedKeys = (storageKey) => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const saveNotifiedKeys = (storageKey, keys) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(keys)));
  } catch {
    // no-op
  }
};

const sendBrowserNotifications = (storageKey, alerts) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const notifiedKeys = loadNotifiedKeys(storageKey);
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
    saveNotifiedKeys(storageKey, notifiedKeys);
  }
};

const toIsoDate = (date) => {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export default function Dashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const isStudent = user?.role === "student";
  const [studentNotificationPermission, setStudentNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  
  const [stats, setStats] = useState({
    students: 0,
    presentToday: 0,
    absentToday: 0,
    classes: 0,
  });
  const [selectedMetric, setSelectedMetric] = useState("students");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffAlerts, setStaffAlerts] = useState([]);

  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const notificationStorageKey = `dashboard_staff_alerts_${todayIso}`;

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const [studentsRes, subjectsRes, attendanceRes, classesRes] = await Promise.all([
          api.get("/students"),
          api.get("/subjects"),
          api.get("/attendance"),
          api.get("/classes"),
        ]);

        const students = studentsRes.data?.students || [];
        const subjects = subjectsRes.data?.subjects || [];
        const attendanceRows = attendanceRes.data?.attendance || [];
        const classes = classesRes.data?.classes || [];

        const todaysRows = attendanceRows.filter((row) => row.attendanceDate === todayIso);
        const presentToday = new Set(
          todaysRows.filter((row) => row.status === "present").map((row) => row.studentId)
        ).size;
        const absentTodayRecords = new Set(
          todaysRows.filter((row) => row.status === "absent").map((row) => row.studentId)
        ).size;

        setStats({
          students: students.length,
          presentToday,
          absentToday: absentTodayRecords || Math.max(students.length - presentToday, 0),
          classes: classes.length || new Set(subjects.map((subject) => subject.classId)).size,
        });

        if (isStudent) {
          await fetchStudentStaffAlerts(subjects);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    const fetchStudentStaffAlerts = async (subjects) => {
      try {
        const staffRes = await api.get("/staff-attendance");
        const staffAttendance = staffRes.data?.attendance || [];
        const latestAttendanceDate = getLatestAttendanceDate(staffAttendance);

        const teacherSubjectMap = subjects.reduce((acc, subject) => {
          if (!subject.teacherId) return acc;
          if (!acc[subject.teacherId]) acc[subject.teacherId] = [];
          acc[subject.teacherId].push(subject.name);
          return acc;
        }, {});

        const usersRes = await api.get("/users?page=1&limit=1000");
        const users = usersRes.data?.users || [];
        const teacherUsers = users.filter((u) => u.role === "teacher");

        const uniqueAlerts = new Map();

        staffAttendance
          .filter((record) => record.attendanceDate === latestAttendanceDate)
          .filter((record) => record.status === "absent" || record.status === "late")
          .forEach((record) => {
            const key = `${record.teacherId}-${record.attendanceDate}`;
            if (uniqueAlerts.has(key)) return;

            const teacherUser = teacherUsers.find((u) => Number(u.userId) === Number(record.teacherId));
            uniqueAlerts.set(key, {
              teacherId: record.teacherId,
              attendanceDate: record.attendanceDate,
              dateLabel: formatAttendanceDate(record.attendanceDate),
              teacherName: teacherUser?.name || `Teacher ${record.teacherId}`,
              status: record.status,
              subject: record.subject || teacherSubjectMap[record.teacherId]?.[0] || "",
            });
          });

        const alerts = Array.from(uniqueAlerts.values());

        setStaffAlerts(alerts);
      } catch (err) {
        console.error("Error fetching staff alerts:", err);
      }
    };

    fetchStats();
  }, [todayIso, isStudent]);

  useEffect(() => {
    if (!isStudent) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
      setStudentNotificationPermission("granted");
      sendBrowserNotifications(notificationStorageKey, staffAlerts);
      return;
    }

    setStudentNotificationPermission(Notification.permission);
  }, [isStudent, notificationStorageKey, staffAlerts]);

  const handleEnableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setStudentNotificationPermission(permission);
    if (permission === "granted") {
      sendBrowserNotifications(notificationStorageKey, staffAlerts);
    }
  };

  const selectedCard = metricConfig.find((item) => item.key === selectedMetric) || metricConfig[0];
  const SelectedIcon = selectedCard.icon;

  const handleCardClick = (metric) => {
    setSelectedMetric(metric.key);
    const route = isStudent ? metric.routeStudent : metric.routeTeacher;
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 px-6 py-8 text-white shadow-lg shadow-stone-200/60">
        <h2 className="text-3xl font-bold tracking-tight">Student attendance dashboard</h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-200">
          Welcome {user?.name ?? "User"} ({user?.role ?? "unknown"}). Select any card below to inspect the summary
          snapshot for today.
        </p>
      </section>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {isStudent && staffAlerts.length > 0 && (
        <div className="rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-rose-100 p-2 text-rose-700">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">Dashboard notification</p>
                <h3 className="mt-1 text-xl font-bold text-stone-900">
                  {staffAlerts.length} teacher{staffAlerts.length > 1 ? "s are" : " is"} absent or late today
                </h3>
                <p className="mt-1 text-sm text-stone-600">
                  This appears on your dashboard whenever staff attendance is marked absent or late. Each alert shows
                  the exact attendance date.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <div className="rounded-full border border-rose-200 bg-white px-3 py-1 text-sm font-semibold text-rose-700">
                Live update
              </div>
              {studentNotificationPermission !== "granted" ? (
                <button
                  className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
                  onClick={handleEnableNotifications}
                  type="button"
                >
                  Enable browser notification
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {staffAlerts.map((alert) => (
              <div
                key={alert.teacherId}
                className={`rounded-2xl border p-4 ${
                  alert.status === "absent" ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {alert.status === "absent" ? (
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  ) : (
                    <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  )}
                  <div className="flex-1">
                    <h4
                      className={`font-semibold ${
                        alert.status === "absent" ? "text-red-900" : "text-amber-900"
                      }`}
                    >
                      {alert.status === "absent"
                        ? `${alert.teacherName} is absent`
                        : `${alert.teacherName} is running late`}
                    </h4>
                    {alert.subject ? (
                      <p
                        className={`mt-1 text-sm ${
                          alert.status === "absent" ? "text-red-700" : "text-amber-700"
                        }`}
                      >
                        Subject: {alert.subject}
                      </p>
                    ) : null}
                    <p
                      className={`mt-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                        alert.status === "absent" ? "text-red-600" : "text-amber-700"
                      }`}
                    >
                      {alert.dateLabel}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricConfig.map((metric) => {
          const Icon = metric.icon;
          const isSelected = selectedMetric === metric.key;
          return (
            <button
              key={metric.key}
              className={`group rounded-2xl border bg-gradient-to-br p-1 text-left shadow-sm transition ${
                isSelected ? "scale-[1.01] shadow-lg" : "hover:-translate-y-0.5 hover:shadow-md"
              } ${metric.tone}`}
              onClick={() => handleCardClick(metric)}
              type="button"
            >
              <div className="flex h-full flex-col justify-between rounded-[15px] bg-white/85 p-4 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      {metric.key === "classes" ? "Academic" : "Attendance"}
                    </p>
                    <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold text-stone-900">
                      {metric.label}
                      <ArrowRight className={`h-4 w-4 transition ${isSelected ? "translate-x-0" : "group-hover:translate-x-1"}`} />
                    </h3>
                  </div>
                  <span className={`rounded-xl border p-2 ${isSelected ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-700"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-6 text-3xl font-bold text-stone-900">{loading ? "--" : stats[metric.key]}</p>
                <p className="mt-1 text-sm text-stone-600">
                  {metric.key === "students" && "Total enrolled students"}
                  {metric.key === "presentToday" && "Students marked present today"}
                  {metric.key === "absentToday" && "Students marked absent today"}
                  {metric.key === "classes" && "Available class count"}
                </p>
              </div>
            </button>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-stone-200 bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stone-900">
              <SelectedIcon className="h-5 w-5 text-stone-700" />
              {selectedCard.label} details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-stone-600">
              Clicking any summary card updates this panel. It always shows the four operational numbers requested for
              the dashboard.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {metricConfig.map((metric) => {
                const Icon = metric.icon;
                const active = selectedMetric === metric.key;
                return (
                  <div
                    key={metric.key}
                    className={`rounded-2xl border p-4 transition ${
                      active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`flex items-center gap-2 text-sm font-medium ${active ? "text-white" : "text-stone-700"}`}>
                        <Icon className="h-4 w-4" />
                        {metric.label}
                      </p>
                      <span className={`text-lg font-bold ${active ? "text-white" : "text-stone-900"}`}>
                        {loading ? "--" : stats[metric.key]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-[0.14em] text-stone-900">Today snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-amber-50 to-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">Selected view</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-stone-900">{selectedCard.label}</p>
              <p className="mt-2 text-sm text-stone-600">
                {selectedMetric === "students" && "Shows the full student count in the system."}
                {selectedMetric === "presentToday" && "Shows how many students are present today."}
                {selectedMetric === "absentToday" && "Shows how many students are absent today."}
                {selectedMetric === "classes" && "Shows how many classes are available in the system."}
              </p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl border border-stone-200 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] font-semibold text-stone-600">Total number of students</p>
                <p className="mt-1 text-2xl font-semibold text-stone-900">{loading ? "--" : stats.students}</p>
              </div>
              <div className="rounded-xl border border-stone-200 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] font-semibold text-stone-600">Number of students present</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-700">{loading ? "--" : stats.presentToday}</p>
              </div>
              <div className="rounded-xl border border-stone-200 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] font-semibold text-stone-600">Number of students absent</p>
                <p className="mt-1 text-2xl font-semibold text-rose-700">{loading ? "--" : stats.absentToday}</p>
              </div>
              <div className="rounded-xl border border-stone-200 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] font-semibold text-stone-600">Total number of class</p>
                <p className="mt-1 text-2xl font-semibold text-blue-700">{loading ? "--" : stats.classes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
