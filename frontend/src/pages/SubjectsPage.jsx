import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";

export default function SubjectsPage() {
  const user = getUser();
  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classNameById, setClassNameById] = useState({});
  const [teacherNameById, setTeacherNameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", classId: "", teacherId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const fetchSubjects = async () => {
    setLoading(true);
    setError("");
    try {
      const [subjectsRes, classesRes, usersRes] = await Promise.all([
        api.get("/subjects"),
        api.get("/classes"),
        api.get("/users?page=1&limit=200"),
      ]);

      const subjectsData = subjectsRes.data?.subjects || [];
      const classesData = classesRes.data?.classes || [];
      const usersData = usersRes.data?.users || [];

      const teacherUsers = usersData.filter((userItem) => userItem.role === "teacher");

      setSubjects(subjectsData);
      setClasses(classesData);
      setTeachers(teacherUsers);
      setClassNameById(
        classesData.reduce((acc, classItem) => {
          acc[classItem.classId] = classItem.name;
          return acc;
        }, {})
      );
      setTeacherNameById(
        usersData.reduce((acc, userItem) => {
          acc[userItem.userId] = userItem.name;
          return acc;
        }, {})
      );
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
      await api.post("/subjects", {
        name: form.name.trim(),
        classId: classIdValue,
        teacherId: teacherIdValue,
      });
      setSubmitSuccess("Subject added successfully.");
      setForm((prev) => ({
        ...prev,
        name: "",
        classId: "",
        teacherId: isTeacher && user?.userId ? String(user.userId) : "",
      }));
      fetchSubjects();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to add subject.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Subjects</h2>
        <p className="text-stone-600">Subjects offered for each class.</p>
      </section>

      {(isAdmin || isTeacher) && (
        <Card className="max-w-3xl border-stone-200 bg-white/95">
          <CardHeader>
            <CardTitle>Add Subject</CardTitle>
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

              <button
                className="inline-flex items-center justify-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Adding..." : "Add Subject"}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Subject List</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Teacher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3}>Loading subjects...</TableCell>
                </TableRow>
              ) : subjects.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={3}>
                    No subjects found.
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((subject) => (
                  <TableRow key={subject.subjectId}>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>{classNameById[subject.classId] || `Class ${subject.classId}`}</TableCell>
                    <TableCell>{teacherNameById[subject.teacherId] || `Teacher ${subject.teacherId}`}</TableCell>
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
