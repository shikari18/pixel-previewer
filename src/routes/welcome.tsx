import { createFileRoute, useNavigate } from "@tanstack/react-router";
import orbImg from "@/assets/flow-orb.jpg";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to Flow State" },
      { name: "description", content: "Your all-in-one space to study, collaborate, and grow." },
      { property: "og:title", content: "Welcome to Flow State" },
      { property: "og:description", content: "Your all-in-one space to study, collaborate, and grow." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 bg-black text-white flex justify-center overflow-hidden">
      <div className="relative w-full max-w-md h-full flex flex-col px-8 pt-12 pb-10">
        <header className="flex items-center justify-end">
          <button
            onClick={() => navigate({ to: "/" })}
            className="text-base text-white/90"
          >
            Skip
          </button>
        </header>

        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="h-1 w-10 rounded-full bg-white" />
          <span className="h-1 w-10 rounded-full bg-white/25" />
          <span className="h-1 w-10 rounded-full bg-white/25" />
          <span className="h-1 w-10 rounded-full bg-white/25" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <img
            src={orbImg}
            alt="Flow State orb"
            width={1024}
            height={1024}
            className="w-72 h-72 object-contain"
          />

          <h1 className="mt-6 text-5xl font-bold tracking-tight text-center leading-tight">
            Welcome to
            <br />
            Flow State
          </h1>
          <p className="mt-4 text-lg text-white/50 text-center px-6">
            Your all-in-one space to study, collaborate, and grow.
          </p>
        </div>

        <button
          onClick={() => navigate({ to: "/" })}
          className="w-full rounded-2xl bg-white/[0.04] border border-white/10 py-5 text-base font-medium text-white"
        >
          Next
        </button>
      </div>
    </div>
  );
}
