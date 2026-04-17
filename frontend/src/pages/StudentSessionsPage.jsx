import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { getUser } from "@/lib/auth";
import useStudentAttendanceData from "@/hooks/useStudentAttendanceData";
import { formatSessionTiming } from "@/lib/sessionLabel";

export default function StudentSessionsPage() {
  const user = getUser();
  const { loading, error, studentRecord, classNameById, sessionsForClass, subjectNameById } =
    useStudentAttendanceData(user?.userId);
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());

  const toggleSubject = (subjectId) => {
    const newSet = new Set(expandedSubjects);
    if (newSet.has(subjectId)) {
      newSet.delete(subjectId);
    } else {
      newSet.add(subjectId);
    }
    setExpandedSubjects(newSet);
  };

  const sessionsBySubject = sessionsForClass.reduce((acc, session) => {
    const subjectId = session.subjectId;
    if (!acc[subjectId]) {
      acc[subjectId] = [];
    }
    acc[subjectId].push(session);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">My Sessions</h2>
        <p className="text-stone-600">Session schedule organized by subject.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
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
            <div className="space-y-2">
              <p className="text-sm text-stone-700">
                <span className="font-medium text-stone-900">{classNameById[studentRecord.classId]}</span>
              </p>
              <p className="text-xs text-stone-600">Roll: {studentRecord.rollNumber}</p>
            </div>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Subjects & Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-stone-600">Loading sessions...</p>
          ) : !studentRecord ? (
            <p className="text-sm text-stone-600">Sessions will appear once your profile is mapped.</p>
          ) : sessionsForClass.length === 0 ? (
            <p className="text-sm text-stone-600">No sessions scheduled yet for your class.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(sessionsBySubject)
                .sort(([, sessionsA], [, sessionsB]) => {
                  const dateA = sessionsA[0]?.sessionDate || "";
                  const dateB = sessionsB[0]?.sessionDate || "";
                  return String(dateB).localeCompare(String(dateA));
                })
                .map(([subjectId, sessions]) => {
                  const isExpanded = expandedSubjects.has(Number(subjectId));
                  const subjectName = subjectNameById[subjectId] || `Subject ${subjectId}`;
                  return (
                    <div key={subjectId} className="rounded-lg border border-stone-200 overflow-hidden">
                      <button
                        onClick={() => toggleSubject(Number(subjectId))}
                        className="w-full px-4 py-3 flex items-center justify-between gap-3 bg-stone-50 hover:bg-stone-100 transition"
                      >
                        <span className="font-semibold text-stone-900">{subjectName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-600">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
                          <ChevronDown
                            className={`h-4 w-4 text-stone-600 transition ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="bg-white border-t border-stone-200 p-3 space-y-2">
                          {sessions
                            .sort((a, b) => String(b.sessionDate).localeCompare(String(a.sessionDate)))
                            .map((session) => (
                              <div key={session.sessionId} className="rounded-lg bg-stone-50 px-3 py-2 flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                  <span className="text-sm text-stone-700">{session.sessionDate}</span>
                                  {formatSessionTiming(session) ? (
                                    <span className="text-xs text-stone-500">{formatSessionTiming(session)}</span>
                                  ) : null}
                                </div>
                                <span className="text-xs font-medium text-stone-500">Session {session.sessionId}</span>
                              </div>
                            ))}
                        </div>
                      )}
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
