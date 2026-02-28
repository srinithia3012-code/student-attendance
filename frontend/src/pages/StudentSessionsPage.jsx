import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUser } from "@/lib/auth";
import useStudentAttendanceData from "@/hooks/useStudentAttendanceData";

export default function StudentSessionsPage() {
  const user = getUser();
  const { loading, error, studentRecord, classNameById, sessionsForClass, subjectNameById } =
    useStudentAttendanceData(user?.userId);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">My Sessions</h2>
        <p className="text-stone-600">Session schedule for your class.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-stone-600">Loading class details...</p> : null}
          {!loading && !studentRecord ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
              Your account is not linked to a student profile yet. Ask admin/teacher to map your account in Add
              Student.
            </p>
          ) : null}
          {studentRecord ? (
            <p className="text-sm text-stone-700">
              Class: <span className="font-medium">{classNameById[studentRecord.classId] || studentRecord.classId}</span>{" "}
              | Roll Number: <span className="font-medium">{studentRecord.rollNumber}</span>
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Session List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Session Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2}>Loading sessions...</TableCell>
                </TableRow>
              ) : !studentRecord ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={2}>
                    No class sessions available until profile is mapped.
                  </TableCell>
                </TableRow>
              ) : sessionsForClass.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={2}>
                    No sessions found for your class.
                  </TableCell>
                </TableRow>
              ) : (
                sessionsForClass.map((session) => (
                  <TableRow key={session.sessionId}>
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
