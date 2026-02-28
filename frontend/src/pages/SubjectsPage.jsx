import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [classNameById, setClassNameById] = useState({});
  const [teacherNameById, setTeacherNameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

        setSubjects(subjectsData);
        setClassNameById(
          classesData.reduce((acc, classItem) => {
            acc[classItem.classId] = classItem.name;
            return acc;
          }, {})
        );
        setTeacherNameById(
          usersData.reduce((acc, user) => {
            acc[user.userId] = user.name;
            return acc;
          }, {})
        );
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch subjects");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Subjects</h2>
        <p className="text-stone-600">Subjects offered for each class.</p>
      </section>

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
