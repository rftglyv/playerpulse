import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center px-8 py-24 sm:px-16">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm font-medium text-loss">PlayerPulse</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Telemetry knows where. Players know why. PlayerPulse settles it.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Multilingual player complaints and gameplay telemetry, turned into verified,
          prioritised issues.
        </p>
        <Link
          href="/dashboard"
          className="mt-10 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open the dashboard
        </Link>
      </div>
    </main>
  );
}
