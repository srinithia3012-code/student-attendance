import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import useStudentAttendanceData from "@/hooks/useStudentAttendanceData";

export default function StudentSubjectProgressPage() {
  const user = getUser();
  const { loading, error, studentRecord, subjectProgress, subjectsForClass } = useStudentAttendanceData(user?.userId);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Subject Progress</h2>
        <p className="text-stone-600">Your attendance percentage for each subject.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-stone-600">Loading subjects...</p>
          ) : !studentRecord ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
              Your account is not linked to a student profile yet. Ask admin/teacher to map your account in Add
              Student.
            </p>
          ) : subjectsForClass.length === 0 ? (
            <p className="text-sm text-stone-600">No subjects found for your class.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subjectsForClass.map((item) => (
                <span key={item.subjectId} className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs">
                  {item.name}
                </span>
              ))}
            </div>
          )}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Progress by Subject</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-stone-600">Calculating progress...</p>
          ) : !studentRecord ? (
            <p className="text-sm text-stone-600">No progress available until profile is mapped.</p>
          ) : subjectProgress.length === 0 ? (
            <p className="text-sm text-stone-600">No attendance records to calculate progress.</p>
          ) : (
            <div className="space-y-3">
              {subjectProgress.map((item) => (
                <div key={item.subjectId} className="rounded-lg border border-stone-200 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium text-stone-900">{item.subjectName}</p>
                    <p className="text-sm font-semibold text-stone-700">{item.percentage}%</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${item.percentage}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-stone-600">
                    Present: {item.present} | Absent: {item.absent} | Total: {item.total}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
