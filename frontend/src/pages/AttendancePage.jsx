import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatSessionLabel } from "@/lib/sessionLabel";

export default function AttendancePage() {
  const user = getUser();
  const isTeacher = user?.role === "teacher";
  const [attendance, setAttendance] = useState([]);
  const [studentNameById, setStudentNameById] = useState({});
  const [subjectNameById, setSubjectNameById] = useState({});
  const [sessionLabelById, setSessionLabelById] = useState({});
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
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
        const subjectList = isTeacher
          ? subjects.filter((subject) => Number(subject.teacherId) === Number(user?.userId))
          : subjects;

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

        setSubjectOptions(
          subjectList
            .slice()
            .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
            .map((subject) => ({
              subjectId: subject.subjectId,
              name: subject.name,
            }))
        );
        setAttendance(attendanceRows);
        setStudentNameById(studentNameMap);
        setSubjectNameById(subjectNameMap);
        setSessionLabelById(sessionLabelMap);

        if (
          isTeacher &&
          subjectList.length > 0 &&
          selectedSubjectId === "all"
        ) {
          setSelectedSubjectId(String(subjectList[0].subjectId));
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch attendance");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [isTeacher, user?.userId]);

  const filteredAttendance = useMemo(() => {
    if (selectedSubjectId === "all") return attendance;
    return attendance.filter((row) => String(row.subjectId) === String(selectedSubjectId));
  }, [attendance, selectedSubjectId]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Attendance</h2>
        <p className="text-stone-600">
          {isTeacher
            ? "Filter attendance by subject to view records for one class at a time."
            : "Attendance records overview."}
        </p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader className="space-y-3">
          <CardTitle>Attendance Records</CardTitle>
          <div className="max-w-sm space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="subjectFilter">
              Subject
            </label>
            <select
              id="subjectFilter"
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
              onChange={(event) => setSelectedSubjectId(event.target.value)}
              value={selectedSubjectId}
            >
              <option value="all">All subjects</option>
              {subjectOptions.map((subject) => (
                <option key={subject.subjectId} value={subject.subjectId}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
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
              ) : filteredAttendance.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5}>
                    No attendance records found for the selected subject.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendance.map((row) => (
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
