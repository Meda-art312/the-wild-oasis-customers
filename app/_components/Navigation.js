import Link from "next/link.js";
import { auth } from "../_lib/auth.js";

export default async function Navigation() {
  const session = await auth();
  return (
    <nav aria-label="Main navigation" className="z-10 text-base sm:text-xl">
      <ul className="flex gap-4 sm:gap-10 items-center">
        <li>
          <Link
            href="/cabins"
            className="hover:text-accent-400 transition-colors"
          >
            Cabins
          </Link>
        </li>
        <li>
          <Link
            href="/about"
            className="hover:text-accent-400 transition-colors"
          >
            About
          </Link>
        </li>
        <li>
          {session?.user ? (
            <Link
              href="/account"
              className="hover:text-accent-400 transition-colors flex items-center gap-4"
            >
              {session.user.image && (
                <img
                  className="h-8 rounded-full"
                  src={session.user.image}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              )}
              <span>Guest area</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-accent-500 text-primary-950 px-4 py-2 sm:px-5 font-semibold hover:bg-accent-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400 whitespace-nowrap"
            >
              Log in
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
