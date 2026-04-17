import { useCallback, useEffect, useState } from "react";
import { ChevronDown, PencilLine, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatSessionLabel } from "@/lib/sessionLabel";

const emptyForm = {
  classId: "",
  subjectId: "",
  sessionDate: "",
  sessionStartTime: "",
  sessionEndTime: "",
};

export default function SessionsPage() {
  const user = getUser();
  const isTeacher = user?.role === "teacher";
  const canManageSessions = user?.role === "admin" || user?.role === "teacher";
  const [sessions, setSessions] = useState([]);
  const [classNameById, setClassNameById] = useState({});
  const [subjectNameById, setSubjectNameById] = useState({});
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editSessionId, setEditSessionId] = useState("");
  const [editForm, setEditForm] = useState(emptyForm);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadSessions = useCallback(async () => {
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

      const teacherSubjectIds = isTeacher
        ? subjectsData
            .filter((subject) => Number(subject.teacherId) === Number(user?.userId))
            .map((subject) => subject.subjectId)
        : [];

      const filteredSessions = isTeacher
        ? sessionsData.filter((session) => teacherSubjectIds.includes(session.subjectId))
        : sessionsData;

      setSessions(filteredSessions);
      setClassNameById(
        classesData.reduce((acc, classItem) => {
          acc[classItem.classId] = classItem.name;
          return acc;
        }, {})
      );
      setSubjectOptions(
        subjectsData
          .filter((subject) => (isTeacher ? Number(subject.teacherId) === Number(user?.userId) : true))
          .map((subject) => ({
            subjectId: subject.subjectId,
            name: subject.name,
          }))
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
  }, [isTeacher, user?.userId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const sessionsBySubject = sessions.reduce((acc, session) => {
    const subjectId = session.subjectId;
    if (!acc[subjectId]) {
      acc[subjectId] = [];
    }
    acc[subjectId].push(session);
    return acc;
  }, {});

  const toggleSubject = (subjectId) => {
    const newSet = new Set(expandedSubjects);
    if (newSet.has(subjectId)) {
      newSet.delete(subjectId);
    } else {
      newSet.add(subjectId);
    }
    setExpandedSubjects(newSet);
  };

  const resetCreateForm = () => {
    setCreateForm(emptyForm);
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "classId" ? { subjectId: "" } : null),
    }));
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    if (!createForm.classId || !createForm.subjectId || !createForm.sessionDate) {
      setCreateError("Class, subject, and date are required.");
      return;
    }

    setCreateSubmitting(true);
    try {
      await api.post("/attendance-sessions", {
        classId: Number(createForm.classId),
        subjectId: Number(createForm.subjectId),
        sessionDate: createForm.sessionDate,
        sessionStartTime: createForm.sessionStartTime || null,
        sessionEndTime: createForm.sessionEndTime || null,
      });
      setCreateSuccess("Session created successfully.");
      resetCreateForm();
      await loadSessions();
      window.dispatchEvent(new CustomEvent("attendance-session-created"));
    } catch (err) {
      setCreateError(err?.response?.data?.message || "Failed to create session");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditClick = (session) => {
    setEditSessionId(String(session.sessionId));
    setEditForm({
      classId: String(session.classId || ""),
      subjectId: String(session.subjectId || ""),
      sessionDate: session.sessionDate || "",
      sessionStartTime: session.sessionStartTime || "",
      sessionEndTime: session.sessionEndTime || "",
    });
    setEditError("");
    setEditSuccess("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "classId" ? { subjectId: "" } : null),
    }));
  };

  const handleUpdateSession = async (event) => {
    event.preventDefault();
    if (!editSessionId) return;

    setEditError("");
    setEditSuccess("");
    setEditSubmitting(true);

    try {
      await api.put(`/attendance-sessions/${editSessionId}`, {
        classId: Number(editForm.classId),
        subjectId: Number(editForm.subjectId),
        sessionDate: editForm.sessionDate,
        sessionStartTime: editForm.sessionStartTime || null,
        sessionEndTime: editForm.sessionEndTime || null,
      });
      setEditSuccess("Session updated successfully.");
      setEditSessionId("");
      setEditForm(emptyForm);
      await loadSessions();
      window.dispatchEvent(new CustomEvent("attendance-session-created"));
    } catch (err) {
      setEditError(err?.response?.data?.message || "Failed to update session");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    const confirmDelete = window.confirm("Delete this session? This cannot be undone.");
    if (!confirmDelete) return;

    try {
      await api.delete(`/attendance-sessions/${sessionId}`);
      if (String(editSessionId) === String(sessionId)) {
        setEditSessionId("");
        setEditForm(emptyForm);
      }
      await loadSessions();
      window.dispatchEvent(new CustomEvent("attendance-session-created"));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete session");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Sessions</h2>
        <p className="text-stone-600">
          {isTeacher ? "Your subject sessions organized by subject." : "Attendance sessions by class and subject."}
        </p>
      </section>

      {canManageSessions ? (
        <Card className="border-stone-200 bg-white/95">
          <CardHeader>
            <CardTitle>Create Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateSession}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="createClassId">
                    Class
                  </label>
                  <select
                    id="createClassId"
                    name="classId"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={handleCreateChange}
                    value={createForm.classId}
                  >
                    <option value="">Select class</option>
                    {Object.entries(classNameById).map(([classId, name]) => (
                      <option key={classId} value={classId}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="createSubjectId">
                    Subject
                  </label>
                  <select
                    id="createSubjectId"
                    name="subjectId"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={handleCreateChange}
                    value={createForm.subjectId}
                  >
                    <option value="">Select subject</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject.subjectId} value={subject.subjectId}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="createSessionDate">
                    Session Date
                  </label>
                  <input
                    id="createSessionDate"
                    name="sessionDate"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={handleCreateChange}
                    type="date"
                    value={createForm.sessionDate}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="createSessionStartTime">
                    Start Time
                  </label>
                  <input
                    id="createSessionStartTime"
                    name="sessionStartTime"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={handleCreateChange}
                    type="time"
                    value={createForm.sessionStartTime}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="createSessionEndTime">
                    End Time
                  </label>
                  <input
                    id="createSessionEndTime"
                    name="sessionEndTime"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={handleCreateChange}
                    type="time"
                    value={createForm.sessionEndTime}
                  />
                </div>
              </div>

              {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
              {createSuccess ? <p className="text-sm text-emerald-700">{createSuccess}</p> : null}

              <Button className="bg-stone-900 hover:bg-stone-800" disabled={createSubmitting} type="submit">
                {createSubmitting ? "Creating..." : "Add Session"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {canManageSessions && editSessionId ? (
        <Card className="border-stone-200 bg-white/95">
          <CardHeader>
            <CardTitle>Edit Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleUpdateSession}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="editClassId">
                    Class
                  </label>
                  <select
                    id="editClassId"
                    name="classId"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={handleEditChange}
                    value={editForm.classId}
                  >
                    <option value="">Select class</option>
                    {Object.entries(classNameById).map(([classId, name]) => (
                      <option key={classId} value={classId}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="editSubjectId">
                    Subject
                  </label>
                  <select
                    id="editSubjectId"
                    name="subjectId"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={handleEditChange}
                    value={editForm.subjectId}
                  >
                    <option value="">Select subject</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject.subjectId} value={subject.subjectId}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="editSessionDate">
                    Session Date
                  </label>
                  <input
                    id="editSessionDate"
                    name="sessionDate"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={handleEditChange}
                    type="date"
                    value={editForm.sessionDate}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="editSessionStartTime">
                    Start Time
                  </label>
                  <input
                    id="editSessionStartTime"
                    name="sessionStartTime"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={handleEditChange}
                    type="time"
                    value={editForm.sessionStartTime}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="editSessionEndTime">
                    End Time
                  </label>
                  <input
                    id="editSessionEndTime"
                    name="sessionEndTime"
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    onChange={handleEditChange}
                    type="time"
                    value={editForm.sessionEndTime}
                  />
                </div>
              </div>

              {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
              {editSuccess ? <p className="text-sm text-emerald-700">{editSuccess}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button className="bg-stone-900 hover:bg-stone-800" disabled={editSubmitting} type="submit">
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  className="border border-stone-300 bg-white text-stone-800 hover:bg-stone-50"
                  onClick={() => {
                    setEditSessionId("");
                    setEditForm(emptyForm);
                    setEditError("");
                    setEditSuccess("");
                  }}
                  type="button"
                  variant="outline"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Session List</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

          {loading ? (
            <p className="text-sm text-stone-600">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-stone-600">No sessions found.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(sessionsBySubject)
                .sort(([, sessionsA], [, sessionsB]) => {
                  const dateA = sessionsA[0]?.sessionDate || "";
                  const dateB = sessionsB[0]?.sessionDate || "";
                  return String(dateB).localeCompare(String(dateA));
                })
                .map(([subjectId, subjectSessions]) => {
                  const isExpanded = expandedSubjects.has(Number(subjectId));
                  const subjectName = subjectNameById[subjectId] || `Subject ${subjectId}`;
                  return (
                    <div key={subjectId} className="overflow-hidden rounded-lg border border-stone-200">
                      <button
                        className="flex w-full items-center justify-between gap-3 bg-stone-50 px-4 py-3 text-left transition hover:bg-stone-100"
                        onClick={() => toggleSubject(Number(subjectId))}
                        type="button"
                      >
                        <span className="font-semibold text-stone-900">{subjectName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-600">
                            {subjectSessions.length} session{subjectSessions.length !== 1 ? "s" : ""}
                          </span>
                          <ChevronDown className={`h-4 w-4 text-stone-600 transition ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {isExpanded ? (
                        <div className="space-y-2 border-t border-stone-200 bg-white p-3">
                          {subjectSessions
                            .sort((a, b) => String(b.sessionDate).localeCompare(String(a.sessionDate)))
                            .map((session) => {
                              const className = classNameById[session.classId] || `Class ${session.classId}`;
                              const subjectNameValue = subjectNameById[session.subjectId] || `Subject ${session.subjectId}`;
                              return (
                                <div
                                  key={session.sessionId}
                                  className="flex flex-col gap-3 rounded-lg border border-stone-100 bg-stone-50 px-3 py-3 md:flex-row md:items-center md:justify-between"
                                >
                                  <div className="space-y-1">
                                    <p className="font-medium text-stone-900">{className}</p>
                                    <p className="text-sm text-stone-700">{subjectNameValue}</p>
                                    <p className="text-xs text-stone-600">{formatSessionLabel(session, className, subjectNameValue)}</p>
                                  </div>
                                  {canManageSessions ? (
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800 hover:bg-stone-50"
                                        onClick={() => handleEditClick(session)}
                                        type="button"
                                      >
                                        <PencilLine className="h-4 w-4" />
                                        Edit
                                      </button>
                                      <button
                                        className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                                        onClick={() => handleDeleteSession(session.sessionId)}
                                        type="button"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                        </div>
                      ) : null}
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
