"use client";

export default function LoginPage() {
    return (
        <main style={{ maxWidth: 480, margin: "0 auto", padding: 16, textAlign: "center" }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Masuk</h1>
            <button 
                style={{ 
                    padding: "12px 24px", 
                    borderRadius: 8, 
                    border: "1px solid #ddd", 
                    background: "#fff", 
                    cursor: "pointer",
                    width: "100%",
                    fontSize: 16,
                }}
            >
                Masuk dengan Google
            </button>
        </main>
    );
}
