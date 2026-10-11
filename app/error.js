"use client";
export default function Error({ reset }) {
  return (
    <main className="flex justify-center items-center flex-col gap-6 text-center">
      <h1 className="text-3xl font-semibold">
        We couldn&apos;t load this page
      </h1>
      <p className="text-lg">Please try again in a moment.</p>
      <button
        className="inline-block bg-accent-500 text-primary-800 px-6 py-3 text-lg"
        onClick={reset}
      >
        Try again
      </button>
    </main>
  );
}
