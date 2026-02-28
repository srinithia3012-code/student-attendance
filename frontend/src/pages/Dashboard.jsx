import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, GraduationCap, NotebookPen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";

export default function Dashboard() {
  const user = getUser();
  const [stats, setStats] = useState({
    students: 0,
    subjects: 0,
    todayAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const [studentsRes, subjectsRes, attendanceRes] = await Promise.all([
          api.get("/students"),
          api.get("/subjects"),
          api.get("/attendance"),
        ]);

        const students = studentsRes.data?.students?.length ?? 0;
        const subjects = subjectsRes.data?.subjects?.length ?? 0;
        const attendanceRows = attendanceRes.data?.attendance ?? [];
        const todayAttendance = attendanceRows.filter((row) => row.attendanceDate === todayIso).length;

        setStats({ students, subjects, todayAttendance });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [todayIso]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Dashboard</h2>
        <p className="text-stone-600">
          Welcome {user?.name ?? "User"} ({user?.role ?? "unknown"}).
        </p>
      </section>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-stone-900">
              <span>Total Students</span>
              <GraduationCap className="h-5 w-5 text-amber-700" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-stone-900">
            {loading ? "--" : stats.students}
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-stone-900">
              <span>Total Subjects</span>
              <NotebookPen className="h-5 w-5 text-orange-700" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-stone-900">
            {loading ? "--" : stats.subjects}
          </CardContent>
        </Card>
        <Card className="border-stone-300 bg-gradient-to-br from-stone-100 to-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-stone-900">
              <span>Today Attendance</span>
              <CalendarCheck2 className="h-5 w-5 text-stone-700" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-stone-900">
            {loading ? "--" : stats.todayAttendance}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
