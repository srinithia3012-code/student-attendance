import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatSessionLabel } from "@/lib/sessionLabel";

export default function StudentAttendancePage() {
  const user = getUser();
  const [studentRecord, setStudentRecord] = useState(null);
  const [classNameById, setClassNameById] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [subjectNameById, setSubjectNameById] = useState({});
  const [sessionLabelById, setSessionLabelById] = useState({});
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyAttendance = async () => {
      setLoading(true);
      setError("");
      try {
        const [studentsRes, subjectsRes, sessionsRes, classesRes] = await Promise.all([
          api.get("/students"),
          api.get("/subjects"),
          api.get("/attendance-sessions"),
          api.get("/classes"),
        ]);

        const myStudent = (studentsRes.data?.students || []).find((item) => item.userId === user?.userId);
        const subjects = subjectsRes.data?.subjects || [];
        const sessions = sessionsRes.data?.sessions || [];
        const classes = classesRes.data?.classes || [];

        const subjectNameMap = subjects.reduce((acc, subject) => {
          acc[subject.subjectId] = subject.name;
          return acc;
        }, {});
        setSubjectNameById(subjectNameMap);

        const classNameById = classes.reduce((acc, classItem) => {
          acc[classItem.classId] = classItem.name;
          return acc;
        }, {});
        setClassNameById(classNameById);

        const sessionLabelMap = sessions.reduce((acc, session) => {
          const className = classNameById[session.classId] || `Class ${session.classId}`;
          const subjectName = subjectNameMap[session.subjectId] || `Subject ${session.subjectId}`;
          acc[session.sessionId] = formatSessionLabel(session, className, subjectName);
          return acc;
        }, {});
        setSessionLabelById(sessionLabelMap);

        if (!myStudent) {
          setStudentRecord(null);
          setAttendance([]);
          setSubjectProgress([]);
          return;
        }

        setStudentRecord(myStudent);
        const attendanceRes = await api.get(`/attendance/student/${myStudent.studentId}`);
        const rows = attendanceRes.data?.attendance || [];
        setAttendance(rows);

        const bySubject = rows.reduce((acc, row) => {
          if (!acc[row.subjectId]) {
            acc[row.subjectId] = { total: 0, present: 0 };
          }
          acc[row.subjectId].total += 1;
          if (row.status === "present") {
            acc[row.subjectId].present += 1;
          }
          return acc;
        }, {});

        const progress = Object.entries(bySubject).map(([subjectId, value]) => {
          const total = value.total || 0;
          const present = value.present || 0;
          const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
          return {
            subjectId: Number(subjectId),
            subjectName: subjectNameMap[Number(subjectId)] || `Subject ${subjectId}`,
            total,
            present,
            absent: total - present,
            percentage,
          };
        });

        setSubjectProgress(progress.sort((a, b) => b.percentage - a.percentage));
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch your attendance");
      } finally {
        setLoading(false);
      }
    };

    fetchMyAttendance();
  }, [user?.userId]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">My Attendance</h2>
        <p className="text-stone-600">View your class details and subject-wise attendance progress.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {loading ? <p className="text-stone-600">Loading class details...</p> : null}
          {!loading && !studentRecord ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
              Your account is not linked to a student profile yet. Ask admin/teacher to map your account in Add Student.
            </p>
          ) : null}
          {studentRecord ? (
            <div className="grid gap-2 md:grid-cols-3">
              <p>
                <span className="font-medium text-stone-700">Class:</span>{" "}
                <span className="text-stone-900">{classNameById[studentRecord.classId] || `Class ${studentRecord.classId}`}</span>
              </p>
              <p>
                <span className="font-medium text-stone-700">Roll Number:</span>{" "}
                <span className="text-stone-900">{studentRecord.rollNumber}</span>
              </p>
              <p>
                <span className="font-medium text-stone-700">Student ID:</span>{" "}
                <span className="text-stone-900">{studentRecord.studentId}</span>
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Subject Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-stone-600">Calculating progress...</p>
          ) : !studentRecord ? (
            <p className="text-sm text-stone-600">No progress available until profile is mapped.</p>
          ) : subjectProgress.length === 0 ? (
            <p className="text-sm text-stone-600">No attendance records to calculate progress.</p>
          ) : (
            <div className="space-y-3">
              {subjectProgress.map((item) => (
                <div key={item.subjectId} className="rounded-lg border border-stone-200 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium text-stone-900">{item.subjectName}</p>
                    <p className="text-sm font-semibold text-stone-700">{item.percentage}%</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${item.percentage}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-stone-600">
                    Present: {item.present} | Absent: {item.absent} | Total: {item.total}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading attendance...</TableCell>
                </TableRow>
              ) : !studentRecord ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={4}>
                    No student profile mapped to this account.
                  </TableCell>
                </TableRow>
              ) : attendance.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={4}>
                    No attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((row) => (
                  <TableRow key={row.attendanceId}>
                    <TableCell>{subjectNameById[row.subjectId] || `Subject ${row.subjectId}`}</TableCell>
                    <TableCell>{sessionLabelById[row.sessionId] || `Session ${row.sessionId}`}</TableCell>
                    <TableCell>{row.attendanceDate}</TableCell>
                    <TableCell className="capitalize">{row.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
