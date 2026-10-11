import SignInButton from "../_components/SignInButton";
import { googleConfigured } from "../_lib/auth";
export const metadata = { title: "Login" };
export default async function Page({ searchParams }) {
  const { error } = await searchParams;
  return (
    <div className="flex flex-col gap-8 mt-10 items-center text-center">
      <h1 className="text-3xl font-semibold">
        Sign in to access your guest area
      </h1>
      {error && (
        <p role="alert" className="text-red-300">
          We couldn&apos;t sign you in. Please try again with a verified Google
          account.
        </p>
      )}
      {googleConfigured ? (
        <SignInButton />
      ) : (
        <p className="text-primary-300 max-w-xl">
          Guest sign-in is not available yet. You can still explore our cabins.
          Please check back soon.
        </p>
      )}
    </div>
  );
}
