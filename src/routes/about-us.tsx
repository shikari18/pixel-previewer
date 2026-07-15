import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Target, Shield, Heart } from "lucide-react";

export const Route = createFileRoute("/about-us")({
  head: () => ({
    meta: [
      { title: "About Us — The Flow" },
      { name: "description", content: "Learn about the mission, values, and vision of The Flow." },
    ],
  }),
  component: AboutUs,
});

function AboutUs() {
  const navigate = useNavigate();

  const values = [
    {
      icon: <Target className="h-5 w-5 text-white/80" strokeWidth={1.5} />,
      title: "Deep Focus",
      desc: "We design features that actively minimize distractions, helping you enter and maintain flow states.",
    },
    {
      icon: <Shield className="h-5 w-5 text-white/80" strokeWidth={1.5} />,
      title: "Simplicity First",
      desc: "Our user interfaces are lightweight, clean, and intuitive, prioritizing functionality and clarity.",
    },
    {
      icon: <Heart className="h-5 w-5 text-white/80" strokeWidth={1.5} />,
      title: "Continuous Growth",
      desc: "Through calendar scheduling and AI tutoring, we build structures that support long-term habits.",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex justify-center page-transition">
      <div className="relative w-full max-w-md min-h-screen flex flex-col px-8 pt-12 pb-10">
        <header className="flex items-center justify-between">
          <button
            aria-label="Back"
            onClick={() => navigate({ to: "/" })}
            className="text-white/90"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </header>

        <div className="mt-10">
          <h1 className="text-5xl font-bold tracking-tight">Our Story</h1>
          <p className="mt-3 text-lg text-white/50">Our mission is to help minds align.</p>
        </div>

        <div className="mt-8 space-y-6 text-base text-white/70 leading-relaxed">
          <p>
            The Flow was born out of a simple need: a focused, quiet environment in a loud digital world. We believe that learning shouldn't be about endless multitasking, but about immersion.
          </p>
          <p>
            We compile the best elements of focus timers, interactive calendars, AI tutors, and collaborative peer spaces into one cohesive, lightweight application.
          </p>
        </div>

        <section className="mt-10 space-y-5">
          <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold">Our Core Principles</h2>
          <div className="space-y-4">
            {values.map((val, i) => (
              <div key={i} className="flex gap-4 items-start p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="p-3 bg-white/[0.05] rounded-xl flex items-center justify-center">
                  {val.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white">{val.title}</h3>
                  <p className="mt-1 text-sm text-white/50 leading-relaxed">{val.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
