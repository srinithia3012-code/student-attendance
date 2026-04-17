import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { formatSessionLabel } from "@/lib/sessionLabel";

export default function useStudentAttendanceData(userId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentRecord, setStudentRecord] = useState(null);
  const [classNameById, setClassNameById] = useState({});
  const [subjectNameById, setSubjectNameById] = useState({});
  const [sessionLabelById, setSessionLabelById] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [attendanceBySubject, setAttendanceBySubject] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [sessionsForClass, setSessionsForClass] = useState([]);
  const [subjectsForClass, setSubjectsForClass] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleRefresh = () => setRefreshKey((prev) => prev + 1);
    window.addEventListener("attendance-session-created", handleRefresh);
    window.addEventListener("attendance-updated", handleRefresh);
    window.addEventListener("subject-created", handleRefresh);
    return () => {
      window.removeEventListener("attendance-session-created", handleRefresh);
      window.removeEventListener("attendance-updated", handleRefresh);
      window.removeEventListener("subject-created", handleRefresh);
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const [studentsRes, subjectsRes, sessionsRes, classesRes] = await Promise.all([
          api.get("/students"),
          api.get("/subjects"),
          api.get("/attendance-sessions"),
          api.get("/classes"),
        ]);

        const students = studentsRes.data?.students || [];
        const subjects = subjectsRes.data?.subjects || [];
        const sessions = sessionsRes.data?.sessions || [];
        const classes = classesRes.data?.classes || [];

        const myStudent = students.find((item) => item.userId === userId);

        const classNameMap = classes.reduce((acc, classItem) => {
          acc[classItem.classId] = classItem.name;
          return acc;
        }, {});
        setClassNameById(classNameMap);

        const subjectNameMap = subjects.reduce((acc, subject) => {
          acc[subject.subjectId] = subject.name;
          return acc;
        }, {});
        setSubjectNameById(subjectNameMap);

        const sessionLabelMap = sessions.reduce((acc, session) => {
          const className = classNameMap[session.classId] || `Class ${session.classId}`;
          const subjectName = subjectNameMap[session.subjectId] || `Subject ${session.subjectId}`;
          acc[session.sessionId] = formatSessionLabel(session, className, subjectName);
          return acc;
        }, {});
        setSessionLabelById(sessionLabelMap);

        if (!myStudent) {
          setStudentRecord(null);
          setAttendance([]);
        setAttendanceBySubject([]);
          return;
        }

        setStudentRecord(myStudent);

        const classSubjects = subjects.filter((item) => item.classId === myStudent.classId);
        setSubjectsForClass(classSubjects);

        const classSessions = sessions
          .filter((item) => String(item.classId) === String(myStudent.classId))
          .sort((a, b) => String(b.sessionDate).localeCompare(String(a.sessionDate)));
        setSessionsForClass(classSessions);

        const attendanceRes = await api.get(`/attendance/student/${myStudent.studentId}`);
        const rows = attendanceRes.data?.attendance || [];
        setAttendance(rows);

        const allAttendanceRes = await api.get(`/attendance`);
        const allAttendance = allAttendanceRes.data?.attendance || [];
        const studentMap = students.reduce((acc, student) => {
          acc[student.studentId] = student;
          return acc;
        }, {});

        const classStudentIds = students
          .filter((student) => student.classId === myStudent.classId)
          .map((student) => student.studentId);

        const attendanceBySubjectObject = allAttendance.reduce((acc, row) => {
          if (!classStudentIds.includes(row.studentId)) return acc;

          const subjectId = row.subjectId;
          const sessionKey = `${row.subjectId}|${row.sessionId}|${row.attendanceDate}`;
          if (!acc[subjectId]) acc[subjectId] = {};
          if (!acc[subjectId][sessionKey]) {
            acc[subjectId][sessionKey] = {
              sessionId: row.sessionId,
              attendanceDate: row.attendanceDate,
              present: [],
              absent: [],
              presentIds: new Set(),
              absentIds: new Set(),
              total: 0,
            };
          }

          const record = acc[subjectId][sessionKey];
          const studentId = row.studentId;
          const studentName = studentMap[studentId]?.userName || `Student ${studentId}`;

          if (row.status === "present") {
            if (!record.presentIds.has(studentId)) {
              record.presentIds.add(studentId);
              record.present.push(studentName);
            }
          } else {
            if (!record.absentIds.has(studentId)) {
              record.absentIds.add(studentId);
              record.absent.push(studentName);
            }
          }

          record.total += 1;
          return acc;
        }, {});

        const attendanceBySubject = Object.entries(attendanceBySubjectObject).map(([subjectId, sessions]) => ({
          subjectId: Number(subjectId),
          subjectName: subjectNameMap[Number(subjectId)] || `Subject ${subjectId}`,
          sessions: Object.values(sessions)
            .map(({ present, absent, ...session }) => ({
              ...session,
              present: present || [],
              absent: absent || [],
            }))
            .sort((a, b) => String(a.attendanceDate).localeCompare(String(b.attendanceDate))),
        }));
        setAttendanceBySubject(attendanceBySubject);

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

        const progress = Object.entries(bySubject)
          .map(([subjectId, value]) => {
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
          })
          .sort((a, b) => b.percentage - a.percentage);
        setSubjectProgress(progress);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch student details");
        setAttendanceBySubject([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      run();
    } else {
      setLoading(false);
    }
  }, [userId, refreshKey]);

  const attendanceSummary = useMemo(() => {
    const uniqueByDate = attendance.reduce((acc, row) => {
      const key = `${row.sessionId || "session"}|${row.attendanceDate || "date"}`;
      if (!acc[key]) acc[key] = row.status;
      return acc;
    }, {});

    const total = Object.keys(uniqueByDate).length;
    const present = Object.values(uniqueByDate).filter((status) => status === "present").length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  }, [attendance]);

  return {
    loading,
    error,
    studentRecord,
    classNameById,
    subjectNameById,
    sessionLabelById,
    attendance,
    attendanceBySubject,
    subjectProgress,
    sessionsForClass,
    subjectsForClass,
    attendanceSummary,
  };
}
