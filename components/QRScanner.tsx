/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// components/QRScanner.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Props = {
    onDetected?: (text: string) => void;
};

export default function QRScanner({ onDetected }: Props) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
    const [torchSupported, setTorchSupported] = useState(false);
    const [torchOn, setTorchOn] = useState(false);

    // Stop any active stream
    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }
    };

    const listCameras = async () => {
        try {
            const all = await navigator.mediaDevices.enumerateDevices();
            setDevices(all.filter(d => d.kind === "videoinput"));
        } catch (e) {
            // ignore
        }
    };

    const start = async () => {
        setError(null);
        setResult(null);
        setScanning(false);
        stopStream();

        try {
            const constraints: MediaStreamConstraints = {
                audio: false,
                video: {
                    // prefer back camera on phones
                    facingMode: deviceId ? undefined : { ideal: "environment" },
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const s = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(s);

            const v = videoRef.current!;
            v.srcObject = s;
            await v.play();

            // Torch support?
            const track = s.getVideoTracks()[0];
            const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
            setTorchSupported(Boolean(caps && "torch" in caps));

            await listCameras();
            setScanning(true);
            scanLoop();
        } catch (e: any) {
            setError(e?.message || "Camera error");
        }
    };

    const toggleTorch = async () => {
        if (!stream) return;
        const track = stream.getVideoTracks()[0];
        // @ts-ignore: advanced torch constraint
        const ok = await track.applyConstraints({ advanced: [{ torch: !torchOn }] }).catch(() => null);
        if (ok !== null) setTorchOn(!torchOn);
    };

    // The scanning loop
    const scanLoop = () => {
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c) return;

        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const step = () => {
            if (!scanning) return;

            const w = v.videoWidth;
            const h = v.videoHeight;
            if (w && h) {
                c.width = w;
                c.height = h;
                ctx.drawImage(v, 0, 0, w, h);
                const img = ctx.getImageData(0, 0, w, h);
                const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
                if (code?.data) {
                    setResult(code.data);
                    setScanning(false);
                    // haptic feedback
                    if (navigator.vibrate) navigator.vibrate(100);
                    stopStream();
                    onDetected?.(code.data);
                    return; // stop scanning
                }
            }
            requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
    };

    useEffect(() => {
        // iOS needs playsInline to avoid fullscreen
        const v = videoRef.current;
        if (v) {
            // @ts-ignore
            v.playsInline = true;
            v.setAttribute("playsinline", "true");
            v.muted = true;
            v.autoplay = true;
        }
        // auto-start when mounted
        start();

        return () => {
            stopStream();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deviceId]);

    return (
        <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <button onClick={start} style={btnStyle}>Start</button>
                <button onClick={() => { setScanning(true); scanLoop(); }} style={btnStyle} disabled={!stream}>
                    Scan
                </button>
                <button onClick={stopStream} style={btnStyle} disabled={!stream}>
                    Stop
                </button>
            </div>

            {devices.length > 1 && (
                <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, marginRight: 8 }}>Camera:</label>
                    <select
                        value={deviceId ?? ""}
                        onChange={(e) => setDeviceId(e.target.value || undefined)}
                        style={{ padding: 6 }}
                    >
                        <option value="">Default (Back/Environment)</option>
                        {devices.map(d => (
                            <option key={d.deviceId} value={d.deviceId}>
                                {d.label || `Camera ${d.deviceId.slice(0, 4)}…`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {torchSupported && stream && (
                <div style={{ marginBottom: 8 }}>
                    <button onClick={toggleTorch} style={btnStyle}>{torchOn ? "Torch Off" : "Torch On"}</button>
                </div>
            )}

            <div style={{ position: "relative" }}>
                <video
                    ref={videoRef}
                    style={{ width: "100%", borderRadius: 12, background: "#000" }}
                />
                {/* Hidden canvas used for decoding frames */}
                <canvas ref={canvasRef} style={{ display: "none" }} />
                {/* Simple overlay */}
                <div style={overlayStyle} />
            </div>

            {error && <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>}
            {result && (
                <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Detected:</div>
                    <code style={{ wordBreak: "break-word" }}>{result}</code>
                    <div style={{ marginTop: 8 }}>
                        <button style={btnStyle} onClick={() => { setResult(null); start(); }}>
                            Scan Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const btnStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer"
};

const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    border: "2px solid rgba(255,255,255,0.6)",
    borderRadius: 12,
    pointerEvents: "none",
    boxShadow: "inset 0 0 0 9999px rgba(0,0,0,0.15)"
};