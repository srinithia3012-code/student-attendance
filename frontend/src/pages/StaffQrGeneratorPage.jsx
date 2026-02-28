import { useMemo, useState } from "react";
import { QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";

export default function StaffQrGeneratorPage() {
  const user = getUser();
  const [teacherIdInput, setTeacherIdInput] = useState(String(user?.userId || ""));
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [departmentInput, setDepartmentInput] = useState("");
  const [statusInput, setStatusInput] = useState("present");
  const [generatedPayload, setGeneratedPayload] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const qrImageUrl = useMemo(() => {
    if (!generatedPayload) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(generatedPayload)}`;
  }, [generatedPayload]);
  const displayDate = useMemo(() => {
    if (!dateInput) return "";
    const dt = new Date(`${dateInput}T00:00:00`);
    return Number.isNaN(dt.getTime()) ? dateInput : dt.toLocaleDateString("en-US");
  }, [dateInput]);

  const handleGenerateTeacherQr = () => {
    const teacherId = Number(teacherIdInput);
    if (!teacherId || Number.isNaN(teacherId)) {
      setError("Enter a valid Teacher ID.");
      return;
    }
    if (!dateInput) {
      setError("Select a valid date.");
      return;
    }

    setError("");
    setMessage("");
    const payload = JSON.stringify({
      teacherId,
      date: dateInput,
      department: departmentInput || undefined,
      status: statusInput || "present",
      scanType: "qr",
    });
    setGeneratedPayload(payload);
  };

  const handleCopyPayload = async () => {
    if (!generatedPayload) return;
    try {
      await navigator.clipboard.writeText(generatedPayload);
      setMessage("QR payload copied.");
      setError("");
    } catch {
      setError("Unable to copy payload.");
      setMessage("");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Staff QR Generator</h2>
        <p className="text-stone-600">Admin creates teacher attendance QR codes for scanning.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generate Staff QR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-stone-700">
              Teacher ID
              <input
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                onChange={(e) => setTeacherIdInput(e.target.value)}
                placeholder="e.g. 13"
                type="number"
                value={teacherIdInput}
              />
            </label>
            <label className="text-sm text-stone-700">
              Department (Optional)
              <input
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                onChange={(e) => setDepartmentInput(e.target.value)}
                placeholder="e.g. CSE"
                type="text"
                value={departmentInput}
              />
            </label>
          </div>

          <details className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-stone-700">Advanced options</summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-stone-700">
              Date (YYYY-MM-DD)
              <input
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                onChange={(e) => setDateInput(e.target.value)}
                type="date"
                value={dateInput}
              />
              <span className="mt-1 block text-xs text-stone-500">Selected: {displayDate || "-"}</span>
            </label>
            <label className="text-sm text-stone-700">
              Status
              <select
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                onChange={(e) => setStatusInput(e.target.value)}
                value={statusInput}
              >
                <option value="present">present</option>
                <option value="absent">absent</option>
                <option value="late">late</option>
              </select>
            </label>
            </div>
          </details>

          <p className="text-xs text-stone-500">
            Quick mode uses today&apos;s date and <code>present</code> status. Open Advanced options only if needed.
          </p>

          <div className="flex gap-2">
            <Button onClick={handleGenerateTeacherQr} type="button">
              Generate QR
            </Button>
            <Button onClick={handleCopyPayload} type="button" variant="outline">
              Copy Payload
            </Button>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <div className="space-y-3 rounded-md border border-stone-200 bg-stone-50 p-3">
            <p className="text-sm font-medium text-stone-800">QR Code Preview</p>
            {generatedPayload ? (
              <>
                <img
                  alt="Teacher attendance QR"
                  className="mx-auto h-[280px] w-[280px] rounded-md bg-white p-2"
                  src={qrImageUrl}
                />
                <p className="break-all text-xs text-stone-600">{generatedPayload}</p>
              </>
            ) : (
              <p className="text-xs text-stone-500">Fill details and click "Generate QR" to show the QR code here.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
