"use client";

import React from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export function Header() {
  return (
    <header className="w-full px-6 py-4 border-b border-white/10 bg-slate-900 text-white flex items-center justify-between">
      <div className="font-semibold">creatr</div>

      <div className="flex items-center gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15">
              Sign in
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700">
              Sign up
            </button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}
