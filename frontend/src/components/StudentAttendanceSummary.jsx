import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getPerformanceStyle(percentage) {
  if (percentage >= 85) {
    return {
      label: "Excellent",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      barClass: "bg-emerald-600",
    };
  }
  if (percentage >= 70) {
    return {
      label: "Good",
      badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
      barClass: "bg-blue-600",
    };
  }
  if (percentage >= 50) {
    return {
      label: "Average",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      barClass: "bg-amber-500",
    };
  }
  return {
    label: "Low",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
    barClass: "bg-rose-600",
  };
}

export default function StudentAttendanceSummary({ loading, studentStats }) {
  return (
    <Card className="border-stone-200 bg-white/95 shadow-sm">
      <CardHeader>
        <CardTitle className="text-stone-900">Student Attendance Percentage</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="rounded-md border border-stone-200 bg-stone-50 px-3 py-4 text-sm text-stone-600">
            Calculating percentages...
          </p>
        ) : studentStats.length === 0 ? (
          <p className="rounded-md border border-stone-200 bg-stone-50 px-3 py-4 text-sm text-stone-600">
            No attendance data available for percentage summary.
          </p>
        ) : (
          <div className="space-y-4">
            {studentStats.map((item, index) => {
              const performance = getPerformanceStyle(item.percentage);
              return (
                <div
                  key={item.studentId}
                  className="rounded-xl border border-stone-200 bg-gradient-to-r from-white to-stone-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-stone-900 px-2 text-xs font-semibold text-white">
                        #{index + 1}
                      </span>
                      <p className="font-semibold text-stone-900">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${performance.badgeClass}`}>
                        {performance.label}
                      </span>
                      <p className="text-sm font-semibold text-stone-800">{item.percentage}%</p>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
                    <div
                      className={`h-full rounded-full transition-all ${performance.barClass}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-stone-600">
                    Present: <span className="font-medium text-stone-800">{item.present}</span> | Absent:{" "}
                    <span className="font-medium text-stone-800">{item.absent}</span> | Total:{" "}
                    <span className="font-medium text-stone-800">{item.total}</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
