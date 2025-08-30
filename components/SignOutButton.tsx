"use client";

import { SignOutButton } from "@clerk/nextjs";
import React from "react";

export default function SignOutButtonClient() {
  return (
    <SignOutButton>
      <button className="block w-full px-4 py-3 text-center text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
        Sign out
      </button>
    </SignOutButton>
  );
}
