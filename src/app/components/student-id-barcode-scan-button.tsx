"use client";

import type { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

const READER_ELEMENT_ID = "staff-student-id-barcode-reader";

export function normalizeScannedStudentId(raw: string): string {
  const line = raw.trim().split(/\r?\n/)[0]?.trim() ?? "";
  return line.replace(/\s+/g, " ").trim();
}

type Props = {
  onDecoded: (value: string) => void;
};

export function StudentIdBarcodeScanButton({ onDecoded }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onDecodedRef = useRef(onDecoded);
  onDecodedRef.current = onDecoded;
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    scannerRef.current = null;

    void (async () => {
      setError(null);
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        const scanner = new Html5Qrcode(READER_ELEMENT_ID, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
          ],
        });
        if (cancelled) {
          scanner.clear();
          return;
        }
        scannerRef.current = scanner;

        const w = typeof window !== "undefined" ? Math.min(280, window.innerWidth - 48) : 280;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: w, height: Math.min(280, w) } },
          (decodedText) => {
            if (cancelled) {
              return;
            }
            const v = normalizeScannedStudentId(decodedText);
            if (!v) {
              return;
            }
            void (async () => {
              try {
                await scanner.stop();
                scanner.clear();
              } catch {
                scanner.clear();
              }
              scannerRef.current = null;
              if (!cancelled) {
                setOpen(false);
                onDecodedRef.current(v);
              }
            })();
          },
          () => {}
        );
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Camera could not start. Allow camera access and use HTTPS (or localhost)."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        void s
          .stop()
          .then(() => s.clear())
          .catch(() => {
            try {
              s.clear();
            } catch {
              /* ignore */
            }
          });
      }
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 active:bg-slate-100"
      >
        <svg className="h-5 w-5 text-slate-600" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 5a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM15 5a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM15 15a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Scan code
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/85 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-scan-title"
        >
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
            <div className="flex items-start justify-between gap-3 text-white">
              <div>
                <p id="student-scan-title" className="text-base font-semibold">
                  Scan student ID
                </p>
                <p className="mt-1 text-sm text-white/80">
                  QR codes and common barcodes (e.g. Code 128) are supported. Works best on HTTPS or localhost.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Close
              </button>
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-rose-400/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
                {error}
              </p>
            ) : null}

            <div
              id={READER_ELEMENT_ID}
              className="mt-4 min-h-[240px] w-full flex-1 overflow-hidden rounded-xl bg-black sm:min-h-[280px]"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
