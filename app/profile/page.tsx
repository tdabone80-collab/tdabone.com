/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from '@/components/ui/button'
import { PersonFill, Envelope, Whatsapp, GenderAmbiguous, GeoAlt, Briefcase, ArrowLeft } from 'react-bootstrap-icons'
import { Input } from "@/components/ui/input";

export default function ProfilePage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [gender, setGender] = useState("");
    const [city, setCity] = useState("");
    const [occupation, setOccupation] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isLoaded && user) {
            setName(user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim());
            const primaryEmail = (user.primaryEmailAddress && user.primaryEmailAddress.emailAddress) ||
                (user.emailAddresses && user.emailAddresses[0] && user.emailAddresses[0].emailAddress) || "";
            setEmail(primaryEmail);
            // try to populate custom public metadata if available
            try {
                const md = (user.publicMetadata || {}) as any;
                if (md.whatsapp) setWhatsapp(md.whatsapp);
                if (md.gender) setGender(md.gender);
                if (md.city) setCity(md.city);
                if (md.occupation) setOccupation(md.occupation);
            } catch (e) {
                // log unexpected metadata parsing errors
                console.error('Error reading user.publicMetadata', e);
            }
        }
    }, [isLoaded, user]);

    if (!isLoaded) return <div className="p-4">Loading...</div>;
    if (!isSignedIn) return (
        <main className="max-w-lg mx-auto p-6 text-center">
            <h1 className="text-xl font-semibold mb-2">Not signed in</h1>
            <p>Please <Link href="/sign-in" className="text-blue-600 underline">sign in</Link> to view your profile.</p>
        </main>
    );

    async function saveProfile() {
        setSaving(true);
        setStatus(null);
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, whatsapp, gender, city, occupation }),
            });
            const json = await res.json();
            if (res.ok) {
                setStatus('Profile tersimpan');
            } else {
                setStatus(json?.error || 'Gagal menyimpan');
            }
        } catch (err) {
            console.error('saveProfile network error', err);
            setStatus('Network error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
            <div className="w-full max-w-md md:max-w-lg bg-white rounded-2xl shadow-sm p-6 md:p-10">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-medium">Lengkapi profile</h1>
                        <p className="text-base text-gray-700 mt-2">Lengkapi profile untuk melanjutkan</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <label className="text-lg font-medium">Nama lengkap</label>
                        <div className="flex items-center bg-white border border-gray-200 rounded-xl p-3 gap-3">
                            <PersonFill className="text-gray-400" size={20} aria-hidden />
                            <Input className="w-full outline-none border-0 p-0 text-lg h-auto" disabled value={name} onChange={e => setName(e.target.value)} placeholder="Masukkan nama lengkap" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <label className="text-lg font-medium">Masukkan email Anda</label>
                        <div className="flex items-center bg-white border border-gray-200 rounded-xl p-3 gap-3">
                            <Envelope className="text-gray-400" size={20} aria-hidden />
                            <Input className="w-full outline-none border-0 p-0 text-lg h-auto" disabled value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <label className="text-lg font-medium">Nomor Whatsapp</label>
                        <div className="flex items-center bg-white border border-gray-200 rounded-xl p-3 gap-3">
                            <Whatsapp className="text-gray-400" size={20} aria-hidden />
                            <input className="w-full outline-none text-base"  value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="0812xxxx" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-lg font-medium">Jenis kelamin</label>
                            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-3 gap-3">
                                <GenderAmbiguous className="text-gray-400" size={20} aria-hidden />
                                <select className="w-full bg-transparent outline-none" value={gender} onChange={e => setGender(e.target.value)}>
                                    <option value="">Pilih jenis kelamin</option>
                                    <option value="male">Laki - Laki</option>
                                    <option value="female">Perempuan</option>
                                    <option value="other">Lainnya</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-lg font-medium">Kota Domisili</label>
                            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-3 gap-3">
                                <GeoAlt className="text-gray-400" size={20} aria-hidden />
                                <input className="w-full bg-transparent outline-none" value={city} onChange={e => setCity(e.target.value)} placeholder="Kota tempat tinggal" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-medium">Pekerjaan / Status</label>
                        <div className="flex items-center bg-white border border-gray-200 rounded-xl p-3 gap-3">
                            <Briefcase className="text-gray-400" size={20} aria-hidden />
                            <input className="w-full bg-transparent outline-none" value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="Contoh: Mahasiswa, Wiraswasta" />
                        </div>
                    </div>

                    <div className="mt-4">
                        <Button size="big" fullWidth variant="default" className="bg-[#313131] text-white text-lg md:text-xl md:h-auto" onClick={saveProfile}>
                            {saving ? 'Menyimpan...' : 'Continue'}
                        </Button>
                    </div>

                    <div className="text-sm text-gray-600">
                        {status}
                    </div>

                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-gray-700 gap-2 px-2 py-1 rounded-md transition-colors hover:text-gray-900 hover:underline hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-200"
                        >
                            <ArrowLeft className="text-gray-600" size={16} aria-hidden />
                            <span>Kembali</span>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

