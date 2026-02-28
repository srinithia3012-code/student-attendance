import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUser } from "@/lib/auth";
import useStudentAttendanceData from "@/hooks/useStudentAttendanceData";

export default function StudentAttendanceRecordsPage() {
  const user = getUser();
  const { loading, error, studentRecord, attendance, subjectNameById, sessionLabelById } = useStudentAttendanceData(
    user?.userId
  );

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Attendance Records</h2>
        <p className="text-stone-600">Detailed record of your attendance.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>My Records</CardTitle>
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
                    Your account is not linked to a student profile yet. Ask admin/teacher to map your account.
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
