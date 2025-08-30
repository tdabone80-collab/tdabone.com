import Link from "next/link";
// import Image from "next/image";
import SignOutButtonClient from "../components/SignOutButton";
import UserCard from "../components/UserCard";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6">
        <UserCard />
        <div className="space-y-4">
          {/* <Link href="/profile" className="block w-full px-4 py-3 text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Profile
          </Link>
          <SignOutButtonClient /> */}
          {/* <Link href="/sign-in" className="block w-full px-4 py-3 text-center text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors">
            sign in
          </Link>
          <Link href="/sign-up" className="block w-full px-4 py-3 text-center text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors">
              sign up
          </Link>
          <Link href="/login" className="block w-full px-4 py-3 text-center text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors">
              Login
          </Link> */}
          <Link href="/tickets" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Buy Tickets
          </Link>
          <Link href="/scan" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            scan
          </Link>
          <Link href="/qr" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Generate QR
          </Link>
        </div>
      </div>
    </div>
  );
}