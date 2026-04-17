import { useEffect, useMemo, useState } from "react";
import { PencilLine, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [form, setForm] = useState({ userId: "", classId: "", rollNumber: "" });

  const userById = useMemo(
    () =>
      users.reduce((acc, user) => {
        acc[user.userId] = user;
        return acc;
      }, {}),
    [users]
  );

  const classById = useMemo(
    () =>
      classes.reduce((acc, item) => {
        acc[item.classId] = item;
        return acc;
      }, {}),
    [classes]
  );

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const [studentsRes, usersRes, classesRes] = await Promise.all([
        api.get("/students"),
        api.get("/users?page=1&limit=200"),
        api.get("/classes"),
      ]);

      setStudents(studentsRes.data?.students || []);
      setUsers(usersRes.data?.users || []);
      setClasses(classesRes.data?.classes || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const resetForm = () => {
    setEditingStudentId(null);
    setForm({ userId: "", classId: "", rollNumber: "" });
    setActionError("");
    setActionSuccess("");
  };

  const startEditing = (student) => {
    setEditingStudentId(student.studentId);
    setForm({
      userId: String(student.userId),
      classId: String(student.classId),
      rollNumber: student.rollNumber || "",
    });
    setActionError("");
    setActionSuccess("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setActionError("");
    setActionSuccess("");

    if (!editingStudentId) {
      setActionError("Select a student row to edit.");
      return;
    }

    if (!form.userId || !form.classId || !form.rollNumber.trim()) {
      setActionError("All fields are required.");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/students/${editingStudentId}`, {
        userId: Number(form.userId),
        classId: Number(form.classId),
        rollNumber: form.rollNumber.trim(),
      });
      setActionSuccess("Student updated successfully.");
      resetForm();
      fetchStudents();
    } catch (err) {
      setActionError(err?.response?.data?.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student) => {
    const confirmed = window.confirm(`Delete student ${userById[student.userId]?.name || student.studentId}?`);
    if (!confirmed) return;

    setActionError("");
    setActionSuccess("");
    try {
      await api.delete(`/students/${student.studentId}`);
      if (editingStudentId === student.studentId) {
        resetForm();
      }
      setActionSuccess("Student deleted successfully.");
      fetchStudents();
    } catch (err) {
      setActionError(err?.response?.data?.message || "Failed to delete student");
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-stone-900">Students</h2>
          <p className="text-stone-600">Edit or delete mapped student records. Use Add Student for new mappings.</p>
        </div>
      </section>

      {editingStudentId ? (
        <Card className="border-stone-200 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Edit Student</span>
              <button
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
                onClick={resetForm}
                type="button"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="userId">
                  Student
                </label>
                <select
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  id="userId"
                  name="userId"
                  onChange={handleChange}
                  value={form.userId}
                >
                  <option value="">Select student</option>
                  {users
                    .filter((user) => user.role === "student")
                    .map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.name} {user.email ? `(${user.email})` : ""}
                      </option>
                    ))}
                </select>
              </div>
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="rollNumber">
                  Roll Number
                </label>
                <input
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  id="rollNumber"
                  name="rollNumber"
                  onChange={handleChange}
                  value={form.rollNumber}
                />
              </div>
              <div className="md:col-span-3">
                {actionError ? <p className="mb-2 text-sm text-red-600">{actionError}</p> : null}
                {actionSuccess ? <p className="mb-2 text-sm text-emerald-700">{actionSuccess}</p> : null}
                <button
                  className="inline-flex items-center justify-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
                  disabled={saving}
                  type="submit"
                >
                  {saving ? "Saving..." : "Save Student"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          {actionError && !editingStudentId ? <p className="mb-3 text-sm text-red-600">{actionError}</p> : null}
          {actionSuccess && !editingStudentId ? <p className="mb-3 text-sm text-emerald-700">{actionSuccess}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Class Name</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading students...</TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5}>
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>{student.userName || userById[student.userId]?.name || "-"}</TableCell>
                    <TableCell>{student.userEmail || userById[student.userId]?.email || "-"}</TableCell>
                    <TableCell>
                      {student.className || classById[student.classId]?.name || `Class ${student.classId}`}
                      {student.classSection ? ` - ${student.classSection}` : ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
                          onClick={() => startEditing(student)}
                          type="button"
                        >
                          <PencilLine className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDelete(student)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </TableCell>
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
