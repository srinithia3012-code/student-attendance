import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import useStudentAttendanceData from "@/hooks/useStudentAttendanceData";

export default function StudentAttendancePercentagePage() {
  const user = getUser();
  const {
    loading,
    error,
    studentRecord,
    attendanceSummary,
    attendance,
    sessionsForClass,
    classNameById,
    subjectNameById,
  } = useStudentAttendanceData(user?.userId);
    useStudentAttendanceData(user?.userId);

  const attendanceBySession = useMemo(() => {
    const map = {};
    attendance.forEach((row) => {
      if (!row.sessionId) return;
      if (!map[row.sessionId]) map[row.sessionId] = { present: false, absent: false };
      if (row.status === "present") map[row.sessionId].present = true;
      if (row.status === "absent") map[row.sessionId].absent = true;
    });
    return map;
  }, [attendance]);

  const sessionTiles = useMemo(() => {
    const seen = new Set();
    return attendance
      .filter((row) => {
        const key = `${row.sessionId || "session"}|${row.attendanceDate || "date"}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((row) => {
        const session = sessionsForClass.find((item) => item.sessionId === row.sessionId);
        const className = session ? classNameById[session.classId] || `Class ${session.classId}` : "Class";
        const subjectName = session ? subjectNameById[session.subjectId] || `Subject ${session.subjectId}` : "Subject";
        const label = `${className} • ${subjectName} • ${row.attendanceDate || "Date"}`;
        return {
          sessionId: row.sessionId || label,
          status: row.status || "pending",
          label,
        };
      });
  }, [attendance, sessionsForClass, classNameById, subjectNameById]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Attendance Percentage</h2>
        <p className="text-stone-600">Overall percentage based on total sessions for your class.</p>
      </section>

      <Card className="overflow-hidden border-stone-200 bg-white/95">
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-500" />
        <CardHeader className="pb-2">
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-stone-600">Calculating percentage...</p>
          ) : !studentRecord ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
              Your account is not linked to a student profile yet. Ask admin/teacher to map your account in Add
              Student.
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              <div className="flex items-center justify-center rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 via-amber-50 to-emerald-50 p-6">
                <div className="relative h-36 w-36">
                  <div className="absolute inset-0 rounded-full border-4 border-stone-200" />
                  <div
                    className="absolute inset-0 rounded-full border-4 border-emerald-500 transition-all"
                    style={{
                      clipPath: `inset(${100 - attendanceSummary.percentage}% 0 0 0)`,
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold text-stone-900">{attendanceSummary.percentage}%</p>
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Overall</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Present: {attendanceSummary.present}
                  </span>
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    Absent: {attendanceSummary.absent}
                  </span>
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700">
                    Total: {attendanceSummary.total}
                  </span>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-sm font-medium text-stone-700">Attendance Progress</p>
                  <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition-all"
                      style={{ width: `${attendanceSummary.percentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-stone-500">Keep your streak above 75% to stay on track.</p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-stone-700">Day-by-day Status</p>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                        Present
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-rose-400" />
                        Absent
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-stone-200" />
                        Pending
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-10 gap-1 sm:grid-cols-12 lg:grid-cols-14">
                    {sessionTiles.map((tile) => (
                      <div
                        key={tile.sessionId}
                        className={`h-3 w-3 rounded-sm ${
                          tile.status === "present"
                            ? "bg-emerald-500"
                            : tile.status === "absent"
                              ? "bg-rose-400"
                              : "bg-stone-200"
                        }`}
                        title={`${tile.label || `Session ${tile.sessionId}`} • ${tile.status}`}
                      />
                    ))}
                    {sessionTiles.length === 0 ? (
                      <p className="col-span-full text-xs text-stone-500">No sessions available yet.</p>
                    ) : null}
                  </div>
                  {sessionTiles.length > 0 ? (
                    <div className="mt-4 space-y-2 text-xs text-stone-600">
                      {sessionTiles.map((tile) => (
                        <div key={`label-${tile.sessionId}`} className="flex items-center justify-between gap-3">
                          <span className="truncate">{tile.label || `Session ${tile.sessionId}`}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              tile.status === "present"
                                ? "bg-emerald-50 text-emerald-700"
                                : tile.status === "absent"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {tile.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
