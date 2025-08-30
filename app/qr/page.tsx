/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function DemoQRPage() {
    // dummy person data you can changea
    const [person, setPerson] = useState({
        id: "PW-DEMO-8F4K2R",
        name: "John Doe",
        email: "john.doe@example.com",
        paid: true,
    });

    // what gets encoded into the QR (JSON object)
    const payload = useMemo(() => JSON.stringify(person, null, 2), [person]);

    function randomId() {
        const s = Math.random().toString(36).slice(2, 8).toUpperCase();
        setPerson((p) => ({ ...p, id: `PW-DEMO-${s}` }));
    }

    async function copy() {
        await navigator.clipboard.writeText(payload);
        if (navigator.vibrate) navigator.vibrate(60);
        alert("Copied: " + payload);
    }

    return (
        <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
                Dummy QR (Scan with the Scanner)
            </h1>

            <div
                style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "1fr",
                    alignItems: "start",
                }}
            >
                <div
                    style={{
                        padding: 16,
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        textAlign: "center",
                        background: "#fff",
                    }}
                >
                    <QRCodeCanvas
                        value={payload}
                        size={260}
                        includeMargin
                        level="M"
                        aria-label="Dummy QR Code"
                    />
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8, textAlign: "left" }}>
                        <p>Encodes:</p>
                        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f5f5f5", padding: 8, borderRadius: 4 }}>
                            <code>{payload}</code>
                        </pre>
                    </div>
                </div>

                <div
                    style={{
                        padding: 12,
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        background: "#fafafa",
                    }}
                >
                    <label style={{ display: "block", marginBottom: 6, fontSize: 12 }}>
                        Name
                    </label>
                    <input
                        value={person.name}
                        onChange={(e) => setPerson(p => ({ ...p, name: e.target.value }))}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                        }}
                    />

                    <label style={{ display: "block", marginBottom: 6, fontSize: 12, marginTop: 10 }}>
                        Email
                    </label>
                    <input
                        value={person.email}
                        onChange={(e) => setPerson(p => ({ ...p, email: e.target.value }))}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                        }}
                    />

                    <div style={{ marginTop: 10 }}>
                        <label style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={person.paid}
                                onChange={(e) => setPerson(p => ({ ...p, paid: e.target.checked }))}
                            />
                            Has Paid
                        </label>
                    </div>

                    <label style={{ display: "block", marginBottom: 6, fontSize: 12, marginTop: 10 }}>
                        ID
                    </label>
                    <input
                        value={person.id}
                        readOnly
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                            fontFamily: "monospace",
                            background: "#eee"
                        }}
                    />

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={randomId} style={btn}>
                            Randomize ID
                        </button>
                        <button onClick={copy} style={btn}>
                            Copy Payload
                        </button>
                    </div>

                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                        Tip: open <a href="/" style={{ textDecoration: "underline" }}>the scanner</a> on your phone, then point it at this QR.
                    </div>
                </div>
            </div>
        </main>
    );
}

const btn: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
};