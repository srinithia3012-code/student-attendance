import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";

export default function TakeAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [subjectsById, setSubjectsById] = useState({});
  const [classesById, setClassesById] = useState({});
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [sessionsRes, studentsRes, usersRes, subjectsRes, classesRes] = await Promise.all([
          api.get("/attendance-sessions"),
          api.get("/students"),
          api.get("/users?page=1&limit=200"),
          api.get("/subjects"),
          api.get("/classes"),
        ]);

        const sessions = sessionsRes.data?.sessions || [];
        const students = studentsRes.data?.students || [];
        const users = usersRes.data?.users || [];
        const subjects = subjectsRes.data?.subjects || [];
        const classes = classesRes.data?.classes || [];

        setSessions(sessions);
        setStudents(students);
        setUsersById(users.reduce((acc, user) => ({ ...acc, [user.userId]: user }), {}));
        setSubjectsById(subjects.reduce((acc, subject) => ({ ...acc, [subject.subjectId]: subject }), {}));
        setClassesById(classes.reduce((acc, classItem) => ({ ...acc, [classItem.classId]: classItem }), {}));
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load attendance setup data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedSession = useMemo(
    () => sessions.find((s) => String(s.sessionId) === String(selectedSessionId)),
    [selectedSessionId, sessions]
  );

  const classStudents = useMemo(() => {
    if (!selectedSession) return [];
    return students.filter((s) => s.classId === selectedSession.classId);
  }, [selectedSession, students]);

  useEffect(() => {
    if (!selectedSession) return;

    setAttendanceDate(selectedSession.sessionDate);
    const defaultStatuses = {};
    classStudents.forEach((student) => {
      defaultStatuses[student.studentId] = "present";
    });
    setStatuses(defaultStatuses);
  }, [selectedSession, classStudents]);

  const handleStatusChange = (studentId, value) => {
    setStatuses((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedSession) {
      setError("Please select a session");
      return;
    }
    if (!attendanceDate) {
      setError("Please set attendance date");
      return;
    }
    if (classStudents.length === 0) {
      setError("No students found for selected class");
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all(
        classStudents.map((student) =>
          api.post("/attendance", {
            studentId: student.studentId,
            subjectId: selectedSession.subjectId,
            sessionId: selectedSession.sessionId,
            attendanceDate,
            status: statuses[student.studentId] || "present",
          })
        )
      );
      setSuccess("Attendance saved successfully");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Take Attendance</h2>
        <p className="text-stone-600">Select session, mark each student as present or absent, and save.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Session Setup</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-stone-600">Loading sessions and students...</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="sessionId">
                    Attendance Session
                  </label>
                  <select
                    id="sessionId"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    value={selectedSessionId}
                  >
                    <option value="">Select session</option>
                    {sessions.map((session) => (
                      <option key={session.sessionId} value={session.sessionId}>
                        {classesById[session.classId]?.name || `Class ${session.classId}`} |{" "}
                        {subjectsById[session.subjectId]?.name || `Subject ${session.subjectId}`} |{" "}
                        {session.sessionDate}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="attendanceDate">
                    Attendance Date
                  </label>
                  <input
                    id="attendanceDate"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    type="date"
                    value={attendanceDate}
                  />
                </div>
              </div>

              {selectedSession ? (
                <div className="space-y-3">
                  <p className="text-sm text-stone-600">
                    Class: <span className="font-medium">{classesById[selectedSession.classId]?.name || selectedSession.classId}</span>{" "}
                    | Subject:{" "}
                    <span className="font-medium">{subjectsById[selectedSession.subjectId]?.name || selectedSession.subjectId}</span>
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classStudents.length === 0 ? (
                        <TableRow>
                          <TableCell className="text-muted-foreground" colSpan={3}>
                            No students found for this class.
                          </TableCell>
                        </TableRow>
                      ) : (
                        classStudents.map((student) => (
                          <TableRow key={student.studentId}>
                            <TableCell>{usersById[student.userId]?.name || `Student ${student.studentId}`}</TableCell>
                            <TableCell>{student.rollNumber}</TableCell>
                            <TableCell>
                              <select
                                className="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm"
                                onChange={(e) => handleStatusChange(student.studentId, e.target.value)}
                                value={statuses[student.studentId] || "present"}
                              >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                              </select>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

              <Button
                className="bg-stone-900 hover:bg-stone-800"
                disabled={!selectedSession || classStudents.length === 0 || submitting}
                type="submit"
              >
                {submitting ? "Saving..." : "Save Attendance"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
