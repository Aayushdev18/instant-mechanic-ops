"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold">Could not load operations data</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button className="mt-4 underline" onClick={reset} type="button">
        Try again
      </button>
    </div>
  );
}
