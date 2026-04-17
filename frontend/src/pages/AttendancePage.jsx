import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { formatSessionLabel } from "@/lib/sessionLabel";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [studentNameById, setStudentNameById] = useState({});
  const [subjectNameById, setSubjectNameById] = useState({});
  const [sessionLabelById, setSessionLabelById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError("");
      try {
        const [attendanceRes, studentsRes, usersRes, subjectsRes, sessionsRes, classesRes] = await Promise.all([
          api.get("/attendance"),
          api.get("/students"),
          api.get("/users?page=1&limit=200"),
          api.get("/subjects"),
          api.get("/attendance-sessions"),
          api.get("/classes"),
        ]);

        const attendanceRows = attendanceRes.data?.attendance || [];
        const students = studentsRes.data?.students || [];
        const users = usersRes.data?.users || [];
        const subjects = subjectsRes.data?.subjects || [];
        const sessions = sessionsRes.data?.sessions || [];
        const classes = classesRes.data?.classes || [];

        const userNameById = users.reduce((acc, user) => {
          acc[user.userId] = user.name;
          return acc;
        }, {});

        const studentNameMap = students.reduce((acc, student) => {
          acc[student.studentId] = userNameById[student.userId] || `Student ${student.studentId}`;
          return acc;
        }, {});

        const subjectNameMap = subjects.reduce((acc, subject) => {
          acc[subject.subjectId] = subject.name;
          return acc;
        }, {});

        const classNameById = classes.reduce((acc, classItem) => {
          acc[classItem.classId] = classItem.name;
          return acc;
        }, {});

        const sessionLabelMap = sessions.reduce((acc, session) => {
          const className = classNameById[session.classId] || `Class ${session.classId}`;
          const subjectName = subjectNameMap[session.subjectId] || `Subject ${session.subjectId}`;
          acc[session.sessionId] = formatSessionLabel(session, className, subjectName);
          return acc;
        }, {});

        setAttendance(attendanceRows);
        setStudentNameById(studentNameMap);
        setSubjectNameById(subjectNameMap);
        setSessionLabelById(sessionLabelMap);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch attendance");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Attendance</h2>
        <p className="text-stone-600">Attendance records overview.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading attendance...</TableCell>
                </TableRow>
              ) : attendance.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5}>
                    No attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((row) => (
                  <TableRow key={row.attendanceId}>
                    <TableCell>{studentNameById[row.studentId] || `Student ${row.studentId}`}</TableCell>
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
