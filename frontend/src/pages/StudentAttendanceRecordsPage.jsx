import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle } from "lucide-react";
import { getUser } from "@/lib/auth";
import useStudentAttendanceData from "@/hooks/useStudentAttendanceData";
import { formatSessionTiming } from "@/lib/sessionLabel";

export default function StudentAttendanceRecordsPage() {
  const user = getUser();
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("");
  const {
    loading,
    error,
    studentRecord,
    attendance,
    attendanceBySubject,
    subjectNameById,
    sessionLabelById,
  } = useStudentAttendanceData(user?.userId);

  const filteredAttendanceBySubject = selectedSubjectFilter
    ? attendanceBySubject.filter((subject) => String(subject.subjectId) === String(selectedSubjectFilter))
    : attendanceBySubject;

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

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Subject-wise Attendance</CardTitle>
            {!loading && attendanceBySubject.length > 0 && (
              <select
                className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                value={selectedSubjectFilter}
              >
                <option value="">All Subjects</option>
                {attendanceBySubject.map((subject) => (
                  <option key={subject.subjectId} value={subject.subjectId}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-stone-600">Loading subject-wise attendance...</p>
          ) : !studentRecord ? (
            <p className="text-sm text-stone-600">No subject attendance available until your student profile is mapped.</p>
          ) : attendanceBySubject.length === 0 ? (
            <p className="text-sm text-stone-600">No attendance records found for your class yet.</p>
          ) : (
            <div className="space-y-4">
              {filteredAttendanceBySubject.map((subject) => (
                <div key={subject.subjectId} className="rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-stone-200 px-4 py-3">
                    <h3 className="text-lg font-bold text-stone-900">{subject.subjectName}</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {subject.sessions.map((session) => (
                      <div key={`${subject.subjectId}-${session.sessionId}-${session.attendanceDate}`} className="rounded-xl border border-stone-100 bg-white p-4">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-600">Session Date</p>
                            <p className="mt-1 text-sm font-semibold text-stone-900">{session.attendanceDate}</p>
                            {formatSessionTiming(session) ? (
                              <p className="mt-1 text-xs font-medium text-stone-600">{formatSessionTiming(session)}</p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3 rounded-lg bg-stone-50 px-3 py-2">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span className="font-semibold text-stone-900">{session.present.length}</span>
                            </span>
                            <span className="text-stone-400">•</span>
                            <span className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-rose-600" />
                              <span className="font-semibold text-stone-900">{session.absent.length}</span>
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Present</p>
                            {session.present.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(session.present)).map((name) => (
                                  <span key={name} className="rounded-full bg-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-900">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-emerald-700">—</p>
                            )}
                          </div>

                          <div className="rounded-lg bg-rose-50 border border-rose-100 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">Absent</p>
                            {session.absent.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(session.absent)).map((name) => (
                                  <span key={name} className="rounded-full bg-rose-200 px-2.5 py-1 text-xs font-medium text-rose-900">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-rose-700">—</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
