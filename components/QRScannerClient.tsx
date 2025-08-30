'use client';

import QRScanner from './QRScanner';

export default function QRScannerClient() {
    return (
        <QRScanner
            onDetected={async (text: string) => {
                await fetch('/api/check-in', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: text }),
                });
                alert('Checked in: ' + text);
            }}
        />
    );
}