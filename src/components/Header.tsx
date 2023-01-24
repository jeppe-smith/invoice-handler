import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function Header() {
  const { status } = useSession();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="mr-auto text-3xl font-bold text-gray-900">Dashboard</h1>
        {status === "unauthenticated" ? (
          <>
            <Link href="/auth/create-account" className="mr-4">
              Create account
            </Link>
            <button type="button" onClick={() => signIn()}>
              Sign in
            </button>
          </>
        ) : (
          <button type="button" onClick={() => signOut()}>
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
