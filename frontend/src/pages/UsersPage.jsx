import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";

export default function UsersPage() {
  const currentUser = getUser();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const teacherCount = useMemo(() => users.filter((user) => user.role === "teacher").length, [users]);

  const fetchUsers = async (page) => {
    setLoading(true);
    setError("");
    setActionMessage("");
    try {
      const { data } = await api.get(`/users?page=${page}&limit=${pagination.limit}`);
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (user) => {
    if (user.userId === currentUser?.userId) {
      setActionMessage("You cannot delete your own account from this page.");
      return;
    }

    const confirmed = window.confirm(`Delete ${user.name || user.email || `User ${user.userId}`}?`);
    if (!confirmed) return;

    setError("");
    setActionMessage("");
    try {
      await api.delete(`/users/${user.userId}`);
      setActionMessage("User deleted successfully.");
      fetchUsers(pagination.page);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-stone-900">Users</h2>
          <p className="text-stone-600">Manage user accounts and remove teachers when required.</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
          <span className="font-semibold text-stone-900">{teacherCount}</span> teachers on this page
        </div>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {actionMessage ? <p className="text-sm text-emerald-700">{actionMessage}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={6}>
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={6}>
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>{user.userId}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell className="capitalize">{user.status}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {user.role === "teacher" ? (
                          <button
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={user.userId === currentUser?.userId}
                            onClick={() => handleDelete(user)}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove Teacher
                          </button>
                        ) : (
                          <span className="text-sm text-stone-400">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-600">
              Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total})
            </p>
            <div className="flex gap-2">
              <Button
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchUsers(pagination.page - 1)}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchUsers(pagination.page + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
