import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import useStudentAttendanceData from "@/hooks/useStudentAttendanceData";

export default function StudentAttendancePercentagePage() {
  const user = getUser();
  const { loading, error, studentRecord, attendanceSummary } = useStudentAttendanceData(user?.userId);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Attendance Percentage</h2>
        <p className="text-stone-600">Overall percentage across all your attendance records.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
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
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <p className="text-4xl font-bold text-stone-900">{attendanceSummary.percentage}%</p>
                <p className="text-sm text-stone-600">
                  Present: {attendanceSummary.present} | Absent: {attendanceSummary.absent} | Total:{" "}
                  {attendanceSummary.total}
                </p>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${attendanceSummary.percentage}%` }}
                />
              </div>
            </div>
          )}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
