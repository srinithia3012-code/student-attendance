import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatSessionLabel } from "@/lib/sessionLabel";

export default function TakeAttendancePage() {
  const user = getUser();
  const isTeacher = user?.role === "teacher";
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [subjectsById, setSubjectsById] = useState({});
  const [classesById, setClassesById] = useState({});
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [statuses, setStatuses] = useState({});
  const [createForm, setCreateForm] = useState({
    classId: "",
    subjectId: "",
    sessionDate: "",
    sessionStartTime: "",
    sessionEndTime: "",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [attendanceBlockedMessage, setAttendanceBlockedMessage] = useState("");
  const [checkingAttendanceLock, setCheckingAttendanceLock] = useState(false);
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

  const allSubjects = useMemo(() => Object.values(subjectsById), [subjectsById]);
  const availableSubjects = useMemo(() => {
    if (isTeacher && user?.userId) {
      return allSubjects.filter((subject) => Number(subject.teacherId) === Number(user.userId));
    }
    return allSubjects;
  }, [allSubjects, isTeacher, user?.userId]);

  const createSubjects = useMemo(() => {
    if (!createForm.classId) return availableSubjects;
    return availableSubjects.filter((subject) => String(subject.classId) === String(createForm.classId));
  }, [availableSubjects, createForm.classId]);

  const teacherSubjectIds = useMemo(() => {
    if (!isTeacher || !user?.userId) return new Set();
    return new Set(
      availableSubjects
        .map((subject) => subject.subjectId)
    );
  }, [availableSubjects, isTeacher, user?.userId]);

  const visibleSessions = useMemo(() => {
    if (!isTeacher) return sessions;
    return sessions.filter((session) => teacherSubjectIds.has(session.subjectId));
  }, [isTeacher, sessions, teacherSubjectIds]);

  const selectedSession = useMemo(
    () => visibleSessions.find((s) => String(s.sessionId) === String(selectedSessionId)),
    [selectedSessionId, visibleSessions]
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

  useEffect(() => {
    const verifyTeacherAttendance = async () => {
      if (!isTeacher || !selectedSession?.sessionDate || !user?.userId) {
        setAttendanceBlockedMessage("");
        setCheckingAttendanceLock(false);
        return;
      }

      setCheckingAttendanceLock(true);
      setAttendanceBlockedMessage("");
      try {
        const res = await api.get(`/staff-attendance?teacherId=${user.userId}&date=${selectedSession.sessionDate}`);
        const records = res.data?.attendance || [];
        const staffRecord = records[0];

        if (staffRecord?.status === "absent") {
          setAttendanceBlockedMessage(
            `You are marked absent for ${selectedSession.sessionDate}, so student attendance is locked until your staff attendance is updated.`
          );
        }
      } catch (err) {
        setAttendanceBlockedMessage(err?.response?.data?.message || "Unable to verify staff attendance status");
      } finally {
        setCheckingAttendanceLock(false);
      }
    };

    void verifyTeacherAttendance();
    const onStaffAttendanceUpdated = () => {
      void verifyTeacherAttendance();
    };

    window.addEventListener("staff-attendance-updated", onStaffAttendanceUpdated);
    return () => {
      window.removeEventListener("staff-attendance-updated", onStaffAttendanceUpdated);
    };
  }, [isTeacher, selectedSession?.sessionDate, user?.userId]);

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
    if (attendanceBlockedMessage) {
      setError(attendanceBlockedMessage);
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
      window.dispatchEvent(new CustomEvent("attendance-updated"));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "classId" ? { subjectId: "" } : null),
    }));
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    if (!createForm.classId || !createForm.subjectId || !createForm.sessionDate) {
      setCreateError("Class, subject, and date are required.");
      return;
    }

    setCreateSubmitting(true);
    try {
      await api.post("/attendance-sessions", {
        classId: Number(createForm.classId),
        subjectId: Number(createForm.subjectId),
        sessionDate: createForm.sessionDate,
        sessionStartTime: createForm.sessionStartTime || null,
        sessionEndTime: createForm.sessionEndTime || null,
      });
      setCreateSuccess("Session created successfully.");
      setCreateForm({ classId: "", subjectId: "", sessionDate: "", sessionStartTime: "", sessionEndTime: "" });

      const sessionsRes = await api.get("/attendance-sessions");
      setSessions(sessionsRes.data?.sessions || []);
      window.dispatchEvent(new CustomEvent("attendance-session-created"));
    } catch (err) {
      setCreateError(err?.response?.data?.message || "Failed to create session");
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Take Student Attendance</h2>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Session Setup</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-stone-600">Loading sessions and students...</p>
          ) : (
            <div className="space-y-4">
              {isTeacher && (
                <form className="space-y-3 rounded-md border border-stone-200 bg-stone-50/70 p-4" onSubmit={handleCreateSession}>
                  <p className="text-sm font-semibold text-stone-800">Create Attendance Session</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700" htmlFor="createClassId">
                        Class
                      </label>
                      <select
                        id="createClassId"
                        name="classId"
                        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                        onChange={handleCreateChange}
                        value={createForm.classId}
                      >
                        <option value="">Select class</option>
                        {Object.values(classesById).map((classItem) => (
                          <option key={classItem.classId} value={classItem.classId}>
                            {classItem.name} {classItem.section ? `- ${classItem.section}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700" htmlFor="createSubjectId">
                        Subject
                      </label>
                      <select
                        id="createSubjectId"
                        name="subjectId"
                        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                        onChange={handleCreateChange}
                        value={createForm.subjectId}
                      >
                        <option value="">Select subject</option>
                        {createSubjects.map((subject) => (
                          <option key={subject.subjectId} value={subject.subjectId}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700" htmlFor="createSessionDate">
                        Session Date
                      </label>
                      <input
                        id="createSessionDate"
                        name="sessionDate"
                        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                        onChange={handleCreateChange}
                        type="date"
                        value={createForm.sessionDate}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700" htmlFor="createSessionStartTime">
                        Start Time
                      </label>
                      <input
                        id="createSessionStartTime"
                        name="sessionStartTime"
                        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                        onChange={handleCreateChange}
                        type="time"
                        value={createForm.sessionStartTime}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700" htmlFor="createSessionEndTime">
                        End Time
                      </label>
                      <input
                        id="createSessionEndTime"
                        name="sessionEndTime"
                        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                        onChange={handleCreateChange}
                        type="time"
                        value={createForm.sessionEndTime}
                      />
                    </div>
                  </div>

                  {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
                  {createSuccess ? <p className="text-sm text-emerald-700">{createSuccess}</p> : null}

                  <Button className="bg-stone-900 hover:bg-stone-800" disabled={createSubmitting} type="submit">
                    {createSubmitting ? "Creating..." : "Create Session"}
                  </Button>
                </form>
              )}

              {isTeacher && visibleSessions.length > 0 ? (
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-stone-800">Your Subject Sessions</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Session Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleSessions.map((session) => (
                        <TableRow key={session.sessionId}>
                          <TableCell>{classesById[session.classId]?.name || `Class ${session.classId}`}</TableCell>
                          <TableCell>{subjectsById[session.subjectId]?.name || `Subject ${session.subjectId}`}</TableCell>
                          <TableCell>{formatSessionLabel(session, classesById[session.classId]?.name, subjectsById[session.subjectId]?.name)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="sessionId">
                    Select Attendance Session
                  </label>
                  <select
                    id="sessionId"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    value={selectedSessionId}
                  >
                      <option value="">Select session</option>
                      {visibleSessions.map((session) => (
                        <option key={session.sessionId} value={session.sessionId}>
                          {formatSessionLabel(session, classesById[session.classId]?.name, subjectsById[session.subjectId]?.name)}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-stone-600">Select the session to mark attendance for, then update each student’s present/absent status.</p>
                  {visibleSessions.length === 0 ? (
                    <p className="text-xs text-amber-700">No sessions found for your subjects. Create one above.</p>
                  ) : null}
                  {attendanceBlockedMessage ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      {attendanceBlockedMessage}
                    </p>
                  ) : null}
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
                  disabled={!selectedSession || classStudents.length === 0 || submitting || checkingAttendanceLock || Boolean(attendanceBlockedMessage)}
                  type="submit"
                >
                  {submitting ? "Saving..." : "Save Attendance"}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
