import { useEffect, useMemo, useState } from "react";
import { PencilLine, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";

export default function SubjectsPage() {
  const navigate = useNavigate();
  const user = getUser();
  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [form, setForm] = useState({ name: "", classId: "", teacherId: "" });

  const classNameById = useMemo(
    () =>
      classes.reduce((acc, classItem) => {
        acc[classItem.classId] = classItem.name;
        return acc;
      }, {}),
    [classes]
  );

  const teacherNameById = useMemo(
    () =>
      teachers.reduce((acc, teacher) => {
        acc[teacher.userId] = teacher.name;
        return acc;
      }, {}),
    [teachers]
  );

  const fetchSubjects = async () => {
    setLoading(true);
    setError("");
    try {
      const [subjectsRes, classesRes, usersRes, attendanceRes] = await Promise.all([
        api.get("/subjects"),
        api.get("/classes"),
        api.get("/users?page=1&limit=200"),
        api.get("/attendance"),
      ]);

      const subjectsData = subjectsRes.data?.subjects || [];
      const classesData = classesRes.data?.classes || [];
      const usersData = usersRes.data?.users || [];
      const attendanceData = attendanceRes.data?.attendance || [];

      setSubjects(subjectsData);
      setClasses(classesData);
      setTeachers(usersData.filter((userItem) => userItem.role === "teacher"));
      setAttendanceRows(attendanceData);
      if (!selectedSubjectId && subjectsData.length > 0) {
        setSelectedSubjectId(subjectsData[0].subjectId);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (isTeacher && user?.userId) {
      setForm((prev) => ({ ...prev, teacherId: String(user.userId) }));
    }
  }, [isTeacher, user?.userId]);

  const resetForm = () => {
    setEditingSubjectId(null);
    setForm({
      name: "",
      classId: "",
      teacherId: isTeacher && user?.userId ? String(user.userId) : "",
    });
    setSubmitError("");
    setSubmitSuccess("");
  };

  const startEditing = (subject) => {
    setEditingSubjectId(subject.subjectId);
    setForm({
      name: subject.name || "",
      classId: String(subject.classId),
      teacherId: String(subject.teacherId),
    });
    setSubmitError("");
    setSubmitSuccess("");
  };

  const selectedSubject = subjects.find((subject) => subject.subjectId === selectedSubjectId) || subjects[0] || null;
  const selectedSubjectStats = selectedSubject
    ? attendanceRows.reduce(
        (acc, row) => {
          if (Number(row.subjectId) !== Number(selectedSubject.subjectId)) {
            return acc;
          }
          acc.total += 1;
          if (row.status === "present") {
            acc.present += 1;
          }
          if (row.status === "absent") {
            acc.absent += 1;
          }
          return acc;
        },
        { total: 0, present: 0, absent: 0 }
      )
    : { total: 0, present: 0, absent: 0 };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!form.name.trim() || !form.classId) {
      setSubmitError("Subject name and class are required.");
      return;
    }

    const classIdValue = Number(form.classId);
    if (!Number.isInteger(classIdValue) || classIdValue < 1) {
      setSubmitError("Please select a valid class.");
      return;
    }

    const teacherIdValue = Number(isTeacher ? user?.userId : form.teacherId);
    if (!Number.isInteger(teacherIdValue) || teacherIdValue < 1) {
      setSubmitError("Please select a valid teacher.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        classId: classIdValue,
        teacherId: teacherIdValue,
      };

      if (editingSubjectId) {
        await api.put(`/subjects/${editingSubjectId}`, payload);
        setSubmitSuccess("Subject updated successfully.");
        window.dispatchEvent(new CustomEvent("subject-created", { detail: { classId: classIdValue } }));
      } else {
        await api.post("/subjects", payload);
        setSubmitSuccess("Subject added successfully.");
        window.dispatchEvent(new CustomEvent("subject-created", { detail: { classId: classIdValue } }));
      }

      if (!editingSubjectId && isTeacher) {
        navigate("/attendance/take");
        return;
      }

      resetForm();
      fetchSubjects();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to save subject.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (subject) => {
    const confirmed = window.confirm(`Delete subject ${subject.name}?`);
    if (!confirmed) return;

    setSubmitError("");
    setSubmitSuccess("");
    try {
      await api.delete(`/subjects/${subject.subjectId}`);
      if (editingSubjectId === subject.subjectId) {
        resetForm();
      }
      setSubmitSuccess("Subject deleted successfully.");
      fetchSubjects();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to delete subject");
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-stone-900">Subjects</h2>
          <p className="text-stone-600">Add, edit, or delete subjects for each class.</p>
        </div>
      </section>

      {(isAdmin || isTeacher) && (
        <Card className="max-w-3xl border-stone-200 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>{editingSubjectId ? "Edit Subject" : "Add Subject"}</span>
              {editingSubjectId ? (
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
                  onClick={resetForm}
                  type="button"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="name">
                  Subject Name
                </label>
                <input
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  id="name"
                  name="name"
                  onChange={handleChange}
                  placeholder="Mathematics"
                  value={form.name}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="classId">
                    Class
                  </label>
                  <select
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    id="classId"
                    name="classId"
                    onChange={handleChange}
                    value={form.classId}
                  >
                    <option value="">Select class</option>
                    {classes.map((classItem) => (
                      <option key={classItem.classId} value={classItem.classId}>
                        {classItem.name} {classItem.section ? `- ${classItem.section}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {isAdmin ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700" htmlFor="teacherId">
                      Teacher
                    </label>
                    <select
                      className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                      id="teacherId"
                      name="teacherId"
                      onChange={handleChange}
                      value={form.teacherId}
                    >
                      <option value="">Select teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.userId} value={teacher.userId}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Teacher</label>
                    <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                      {user?.name || "Current teacher"}
                    </div>
                  </div>
                )}
              </div>

              {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
              {submitSuccess ? <p className="text-sm text-emerald-700">{submitSuccess}</p> : null}
              {isTeacher && !editingSubjectId && submitSuccess ? (
                <button
                  className="inline-flex items-center justify-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-100"
                  onClick={() => navigate("/attendance/take")}
                  type="button"
                >
                  Create Session
                </button>
              ) : null}

              <button
                className="inline-flex items-center justify-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Saving..." : editingSubjectId ? "Save Subject" : "Add Subject"}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-stone-200 bg-white/95">
          <CardHeader>
            <CardTitle>Subject List</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
            {submitError && !editingSubjectId ? <p className="mb-3 text-sm text-red-600">{submitError}</p> : null}
            {submitSuccess && !editingSubjectId ? <p className="mb-3 text-sm text-emerald-700">{submitSuccess}</p> : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4}>Loading subjects...</TableCell>
                  </TableRow>
                ) : subjects.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={4}>
                      No subjects found.
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((subject) => {
                    const isSelected = selectedSubjectId === subject.subjectId;
                    return (
                      <TableRow
                        key={subject.subjectId}
                        className={isSelected ? "bg-amber-50" : "cursor-pointer"}
                        onClick={() => setSelectedSubjectId(subject.subjectId)}
                      >
                        <TableCell>{subject.name}</TableCell>
                        <TableCell>{classNameById[subject.classId] || `Class ${subject.classId}`}</TableCell>
                        <TableCell>{teacherNameById[subject.teacherId] || `Teacher ${subject.teacherId}`}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <button
                              className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
                              onClick={(event) => {
                                event.stopPropagation();
                                startEditing(subject);
                              }}
                              type="button"
                            >
                              <PencilLine className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(subject);
                              }}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white/95">
          <CardHeader>
            <CardTitle>Total Subjects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-amber-50 to-white p-4">
              <p className="text-sm font-medium text-stone-700">All subjects</p>
              <p className="mt-1 text-3xl font-bold text-stone-900">{loading ? "--" : subjects.length}</p>
              <p className="mt-1 text-sm text-stone-600">Select a subject from the list to inspect present and absent counts.</p>
            </div>
            {selectedSubject ? (
              <div className="rounded-2xl border border-stone-200 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Selected subject</p>
                <p className="mt-1 text-xl font-semibold text-stone-900">{selectedSubject.name}</p>
                <p className="text-sm text-stone-600">
                  {classNameById[selectedSubject.classId] || `Class ${selectedSubject.classId}`} |{" "}
                  {teacherNameById[selectedSubject.teacherId] || `Teacher ${selectedSubject.teacherId}`}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-xs text-stone-500">Present</p>
                    <p className="text-lg font-bold text-emerald-700">{loading ? "--" : selectedSubjectStats.present}</p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-xs text-stone-500">Absent</p>
                    <p className="text-lg font-bold text-rose-700">{loading ? "--" : selectedSubjectStats.absent}</p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-xs text-stone-500">Total</p>
                    <p className="text-lg font-bold text-stone-900">{loading ? "--" : selectedSubjectStats.total}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600">
                No subject selected yet.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
