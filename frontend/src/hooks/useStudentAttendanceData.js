import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

export default function useStudentAttendanceData(userId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentRecord, setStudentRecord] = useState(null);
  const [classNameById, setClassNameById] = useState({});
  const [subjectNameById, setSubjectNameById] = useState({});
  const [sessionLabelById, setSessionLabelById] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [sessionsForClass, setSessionsForClass] = useState([]);
  const [subjectsForClass, setSubjectsForClass] = useState([]);

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
          acc[session.sessionId] = `${className} - ${subjectName} (${session.sessionDate})`;
          return acc;
        }, {});
        setSessionLabelById(sessionLabelMap);

        if (!myStudent) {
          setStudentRecord(null);
          setAttendance([]);
          setSubjectProgress([]);
          setSessionsForClass([]);
          setSubjectsForClass([]);
          return;
        }

        setStudentRecord(myStudent);

        const classSubjects = subjects.filter((item) => item.classId === myStudent.classId);
        setSubjectsForClass(classSubjects);

        const classSessions = sessions
          .filter((item) => item.classId === myStudent.classId)
          .sort((a, b) => String(b.sessionDate).localeCompare(String(a.sessionDate)));
        setSessionsForClass(classSessions);

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
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      run();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const attendanceSummary = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((item) => item.status === "present").length;
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
    subjectProgress,
    sessionsForClass,
    subjectsForClass,
    attendanceSummary,
  };
}
