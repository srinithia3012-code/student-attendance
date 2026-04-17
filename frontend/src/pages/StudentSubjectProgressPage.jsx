import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
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
            <div className="grid gap-4 md:grid-cols-2">
              {subjectProgress.map((item) => {
                const getPercentageColor = (percentage) => {
                  if (percentage >= 80) return "from-emerald-50 to-white border-emerald-200";
                  if (percentage >= 60) return "from-amber-50 to-white border-amber-200";
                  return "from-rose-50 to-white border-rose-200";
                };

                const getProgressBarColor = (percentage) => {
                  if (percentage >= 80) return "bg-emerald-600";
                  if (percentage >= 60) return "bg-amber-600";
                  return "bg-rose-600";
                };

                const getPercentageTextColor = (percentage) => {
                  if (percentage >= 80) return "text-emerald-700";
                  if (percentage >= 60) return "text-amber-700";
                  return "text-rose-700";
                };

                return (
                  <div
                    key={item.subjectId}
                    className={`rounded-2xl border bg-gradient-to-br ${getPercentageColor(item.percentage)} p-4 shadow-sm`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-600">Subject</p>
                          <p className="mt-1 text-lg font-bold text-stone-900">{item.subjectName}</p>
                        </div>
                        <div className={`rounded-xl px-3 py-2 text-center ${getPercentageTextColor(item.percentage)} font-bold text-xl`}>
                          {item.percentage}%
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="h-3 w-full overflow-hidden rounded-full bg-stone-200">
                          <div
                            className={`h-full rounded-full transition-all ${getProgressBarColor(item.percentage)}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/70 p-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-lg font-bold text-stone-900">{item.present}</span>
                          </div>
                          <p className="text-xs text-stone-600">Present</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <XCircle className="h-4 w-4 text-rose-600" />
                            <span className="text-lg font-bold text-stone-900">{item.absent}</span>
                          </div>
                          <p className="text-xs text-stone-600">Absent</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-4 w-4 text-stone-600" />
                            <span className="text-lg font-bold text-stone-900">{item.total}</span>
                          </div>
                          <p className="text-xs text-stone-600">Total</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
