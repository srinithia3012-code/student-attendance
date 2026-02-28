import { useEffect, useState } from "react";
import api from "@/lib/api";
import StudentAttendanceSummary from "@/components/StudentAttendanceSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AttendanceProgressPage() {
  const [studentStats, setStudentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      setError("");
      try {
        const [attendanceRes, studentsRes, usersRes] = await Promise.all([
          api.get("/attendance"),
          api.get("/students"),
          api.get("/users?page=1&limit=200"),
        ]);

        const attendanceRows = attendanceRes.data?.attendance || [];
        const students = studentsRes.data?.students || [];
        const users = usersRes.data?.users || [];

        const userNameById = users.reduce((acc, user) => {
          acc[user.userId] = user.name;
          return acc;
        }, {});

        const studentNameMap = students.reduce((acc, student) => {
          acc[student.studentId] = userNameById[student.userId] || `Student ${student.studentId}`;
          return acc;
        }, {});

        const byStudent = attendanceRows.reduce((acc, row) => {
          if (!acc[row.studentId]) {
            acc[row.studentId] = { total: 0, present: 0 };
          }
          acc[row.studentId].total += 1;
          if (row.status === "present") {
            acc[row.studentId].present += 1;
          }
          return acc;
        }, {});

        const stats = Object.entries(byStudent)
          .map(([studentId, value]) => {
            const total = value.total || 0;
            const present = value.present || 0;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
            return {
              studentId: Number(studentId),
              name: studentNameMap[Number(studentId)] || `Student ${studentId}`,
              total,
              present,
              absent: total - present,
              percentage,
            };
          })
          .sort((a, b) => b.percentage - a.percentage);

        setStudentStats(stats);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch attendance progress");
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Attendance Progress</h2>
        <p className="text-stone-600">Student attendance percentage summary with performance overview.</p>
      </section>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Avg. Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-900">
              {loading || studentStats.length === 0
                ? "--"
                : `${Math.round(studentStats.reduce((sum, item) => sum + item.percentage, 0) / studentStats.length)}%`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Students Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-900">{loading ? "--" : studentStats.length}</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Needs Attention (&lt; 75%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-900">
              {loading ? "--" : studentStats.filter((item) => item.percentage < 75).length}
            </p>
          </CardContent>
        </Card>
      </section>

      <StudentAttendanceSummary loading={loading} studentStats={studentStats} />
    </div>
  );
}
