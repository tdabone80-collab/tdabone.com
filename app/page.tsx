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
          <Link href="/tickets" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Buy Tickets
          </Link>

          <Link href="/order/review" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Order Review (checkout)
          </Link>

          <Link href="/order/success" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Order Success (example)
          </Link>

          <Link href="/my/tickets" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            My Tickets
          </Link>

          <Link href="/profile" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Profile
          </Link>

          <Link href="/scan" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Scan (admin)
          </Link>

          <Link href="/admin" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Admin
          </Link>

          <Link href="/admin/tickets" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Admin Tickets
          </Link>

          <Link href="/qr" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Generate QR
          </Link>

          <Link href="/login" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Login
          </Link>

          <Link href="/sign-in" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Sign In (Clerk)
          </Link>

          <Link href="/sign-up" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Sign Up
          </Link>

          <Link href="/dev/button-showcase" className="block w-full px-4 py-3 text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            Dev: Button Showcase
          </Link>
        </div>
      </div>
    </div>
  );
}