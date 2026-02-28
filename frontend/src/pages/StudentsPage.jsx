import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [userById, setUserById] = useState({});
  const [classById, setClassById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError("");
      try {
        const [studentsRes, usersRes, classesRes] = await Promise.all([
          api.get("/students"),
          api.get("/users?page=1&limit=200"),
          api.get("/classes"),
        ]);

        const users = usersRes.data?.users || [];
        const classes = classesRes.data?.classes || [];
        const usersMap = users.reduce((acc, user) => {
          acc[user.userId] = user;
          return acc;
        }, {});
        const classesMap = classes.reduce((acc, item) => {
          acc[item.classId] = item;
          return acc;
        }, {});

        setStudents(studentsRes.data?.students || []);
        setUserById(usersMap);
        setClassById(classesMap);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Students</h2>
        <p className="text-stone-600">Student records and class assignment details.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Class Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading students...</TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={4}>
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>{userById[student.userId]?.name || "-"}</TableCell>
                    <TableCell>{userById[student.userId]?.email || "-"}</TableCell>
                    <TableCell>{classById[student.classId]?.name || `Class ${student.classId}`}</TableCell>
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
