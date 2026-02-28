import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, Camera, Play, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

function tryParseQrPayload(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default function AttendanceScannerPage() {
  const [lastScan, setLastScan] = useState("");
  const [decodedText, setDecodedText] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanSuccess, setScanSuccess] = useState("");
  const [inAppNotification, setInAppNotification] = useState("");
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const scannerRef = useRef(null);
  const lastDecodedRef = useRef("");
  const scannerElementId = "teacher-qr-camera";

  const helperText = useMemo(() => "Teacher scan mode: scan QR to store attendance.", []);

  const showStoredNotification = () => {
    if (!("Notification" in window)) return;

    const title = "Attendance";
    const body = "Your attendance stored successfully.";

    if (Notification.permission === "granted") {
      new Notification(title, { body });
      return;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body });
        }
      });
    }
  };

  const stopCamera = () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setIsCameraRunning(false);
      return;
    }

    scanner
      .stop()
      .catch(() => {
        // no-op
      })
      .finally(() => {
        scanner
          .clear()
          .catch(() => {
            // no-op
          })
          .finally(() => {
            scannerRef.current = null;
            setIsCameraRunning(false);
          });
      });
  };

  const submitAttendanceFromPayload = async (payload) => {
    const required = ["teacherId", "date"];
    const hasRequired = required.every((key) => payload?.[key] !== undefined && payload?.[key] !== null);

    if (!hasRequired) {
      setScanError(
        "QR decoded, but payload is incomplete. Required: teacherId and date."
      );
      return;
    }

    try {
      setSubmitting(true);
      setScanError("");
      await api.post("/staff-attendance", {
        teacherId: Number(payload.teacherId),
        date: String(payload.date),
        department: payload.department || null,
        subject: payload.subject || null,
        scanType: payload.scanType || "qr",
        status: payload.status || "present",
      });
      setScanSuccess("Your attendance stored successfully.");
      setInAppNotification("Your attendance stored successfully.");
      showStoredNotification();
      setTimeout(() => {
        setScanSuccess("");
        setInAppNotification("");
      }, 3000);
    } catch (err) {
      setScanError(err?.response?.data?.message || "Failed to mark teacher attendance from QR data.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecodedValue = async (value) => {
    if (!value) return;
    if (lastDecodedRef.current === value) return;
    lastDecodedRef.current = value;

    setDecodedText(value);
    setLastScan(new Date().toLocaleTimeString());
    setScanError("");

    const payload = tryParseQrPayload(value);
    if (!payload) {
      setScanError("QR decoded. Use JSON QR payload to auto-mark teacher attendance.");
      return;
    }
    await submitAttendanceFromPayload(payload);
  };

  const startCamera = async () => {
    try {
      setScanError("");
      setScanSuccess("");
      lastDecodedRef.current = "";
      if (scannerRef.current) return;

      const scanner = new Html5Qrcode(scannerElementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.777778,
        },
        async (decodedTextValue) => {
          await handleDecodedValue(decodedTextValue);
        },
        () => {
          // ignore decode errors while camera is scanning
        }
      );

      setIsCameraRunning(true);
    } catch {
      setScanError("Unable to start camera scanner. Check camera permission and HTTPS/localhost.");
      stopCamera();
    }
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="space-y-6">
      {inAppNotification ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {inAppNotification}
        </div>
      ) : null}

      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">QR Attendance Scanner</h2>
        <p className="text-stone-600">Teacher panel scanner for automatic attendance storage.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner Mode
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="default">
              <Camera className="mr-2 h-4 w-4" />
              Camera Scan
            </Button>
          </div>
          <p className="text-xs text-stone-500">
            Camera scan works on localhost with camera permission.
          </p>

          <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
            <p className="font-medium text-stone-800">{helperText}</p>
            <div className="mt-4 space-y-3">
              <div
                className="mx-auto min-h-[260px] w-full rounded-md bg-black/90"
                id={scannerElementId}
              />
              <div className="flex justify-center gap-2">
                {!isCameraRunning ? (
                  <Button onClick={startCamera} type="button" variant="outline">
                    <Play className="mr-2 h-4 w-4" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} type="button" variant="outline">
                    <Square className="mr-2 h-4 w-4" />
                    Stop Camera
                  </Button>
                )}
              </div>
            </div>
          </div>

          {lastScan ? <p className="text-sm text-emerald-700">Last scan recorded at {lastScan}</p> : null}
          {decodedText ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-semibold text-emerald-700">Decoded QR Data</p>
              <p className="break-all text-sm text-emerald-800">{decodedText}</p>
            </div>
          ) : null}
          {scanSuccess ? <p className="text-sm text-emerald-700">{scanSuccess}</p> : null}
          {scanError ? <p className="text-sm text-red-600">{scanError}</p> : null}
          {submitting ? <p className="text-sm text-stone-600">Submitting attendance...</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
