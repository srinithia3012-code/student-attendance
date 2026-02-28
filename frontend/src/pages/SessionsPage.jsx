import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [classNameById, setClassNameById] = useState({});
  const [subjectNameById, setSubjectNameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError("");
      try {
        const [sessionsRes, classesRes, subjectsRes] = await Promise.all([
          api.get("/attendance-sessions"),
          api.get("/classes"),
          api.get("/subjects"),
        ]);

        const sessionsData = sessionsRes.data?.sessions || [];
        const classesData = classesRes.data?.classes || [];
        const subjectsData = subjectsRes.data?.subjects || [];

        setSessions(sessionsData);
        setClassNameById(
          classesData.reduce((acc, classItem) => {
            acc[classItem.classId] = classItem.name;
            return acc;
          }, {})
        );
        setSubjectNameById(
          subjectsData.reduce((acc, subject) => {
            acc[subject.subjectId] = subject.name;
            return acc;
          }, {})
        );
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Sessions</h2>
        <p className="text-stone-600">Attendance sessions by class and subject.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Session List</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Session Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3}>Loading sessions...</TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={3}>
                    No sessions found.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.sessionId}>
                    <TableCell>{classNameById[session.classId] || `Class ${session.classId}`}</TableCell>
                    <TableCell>{subjectNameById[session.subjectId] || `Subject ${session.subjectId}`}</TableCell>
                    <TableCell>{session.sessionDate}</TableCell>
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
