"use client";

import React from "react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Unauthenticated, Authenticated } from "convex/react";
import { useStoreUser } from "@/hooks/use-store-user";

const Header = () => {
  const { isLoading, isAuthenticated } = useStoreUser();

  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-4 sm:px-6 md:px-8 py-3 flex items-center justify-end gap-2">
        <Unauthenticated>
          <SignInButton>
            <button className="bg-transparent text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer border border-white/20">
              Sign In
            </button>
          </SignInButton>

          <SignUpButton>
            <button className="bg-[#6c47ff] text-ceramic-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
              Sign Up
            </button>
          </SignUpButton>
        </Unauthenticated>

        <Authenticated>
          <UserButton />
        </Authenticated>
      </div>
    </header>
  );
};

export default Header;
