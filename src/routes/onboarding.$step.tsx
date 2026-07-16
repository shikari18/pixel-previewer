import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import orbImg from "@/assets/onboard-orb.jpg";
import focusImg from "@/assets/onboard-focus.jpg";
import aiImg from "@/assets/onboard-ai.jpg";
import puzzleImg from "@/assets/the-puzzle.png";

type Slide = {
  image: string;
  alt: string;
  title: string;
  description: string;
};

const slides: Slide[] = [
  {
    image: orbImg,
    alt: "Glowing The Flow orb",
    title: "Welcome to\nThe Flow",
    description: "Your all-in-one space to study, collaborate, and grow.",
  },
  {
    image: focusImg,
    alt: "Focus timer cube",
    title: "Focus Deeply,\nEvery Session",
    description: "Enter distraction-free study sessions built to keep you in the zone.",
  },
  {
    image: aiImg,
    alt: "AI assistant lightning cube",
    title: "AI That Learns\nWith You",
    description: "Get instant help on assignments, notes, and tough questions.",
  },
];

export const Route = createFileRoute("/onboarding/$step")({
  parseParams: ({ step }) => {
    const n = Number(step);
    if (!Number.isInteger(n) || n < 1 || n > 4) throw notFound();
    return { step: String(n) };
  },
  head: ({ params }) => {
    const titles = [
      "Welcome to The Flow",
      "Focus Deeply, Every Session",
      "AI That Learns With You",
      "Everything You Need to Succeed",
    ];
    const title = titles[Number(params.step) - 1] ?? titles[0];
    return {
      meta: [
        { title: `${title} — The Flow` },
      ],
    };
  },
  component: Onboarding,
  notFoundComponent: () => (
    <div className="min-h-screen bg-black text-white grid place-items-center">
      Onboarding step not found
    </div>
  ),
});

function Onboarding() {
  const { step } = Route.useParams();
  const navigate = useNavigate();
  const index = Number(step) - 1;
  const isLast = index === 3;

  const goNext = () => {
    if (isLast) {
      navigate({ to: "/home" });
    } else {
      navigate({
        to: "/onboarding/$step",
        params: { step: String(index + 2) },
      });
    }
  };

  // Dot indicators — shared across all slides
  const dots = (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-1 rounded-full transition-all ${
            i === index ? "w-10 bg-white" : "w-10 bg-white/20"
          }`}
        />
      ))}
    </div>
  );

  // ─── SLIDE 4 — completely rewritten layout ───────────────────────────────
  if (isLast) {
    return (
      <div className="fixed inset-0 bg-black text-white flex overflow-hidden page-transition">
        <div className="relative w-full h-full flex flex-col">

          {/* Full-bleed image — top half */}
          <div className="relative w-full flex-1 overflow-hidden">
            <img
              src={puzzleImg}
              alt="The puzzle — everything fits together"
              className="w-full h-full object-cover object-center"
            />
            {/* Gradient fade at bottom so text reads clean */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
          </div>

          {/* Bottom content panel */}
          <div className="flex flex-col px-8 pb-10 pt-6 bg-black">
            {/* Dots */}
            {dots}

            {/* Text */}
            <h1 className="mt-6 text-4xl font-bold tracking-tight leading-[1.1] whitespace-pre-line">
              {"Everything You\nNeed to Succeed"}
            </h1>
            <p className="mt-4 text-base text-white/50 leading-relaxed">
              Assignments, AI help, study with friends, and powerful tools.
            </p>

            {/* Start button */}
            <button
              onClick={goNext}
              className="mt-8 w-full rounded-2xl bg-white text-black font-semibold py-5 text-base shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              Start
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ─── SLIDES 1–3 — original shared layout ────────────────────────────────
  const slide = slides[index];

  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden page-transition">
      <div className="relative w-full h-full flex flex-col px-8 pt-12 pb-10">
        <header className="flex items-center justify-end h-6">
          <button
            onClick={() => navigate({ to: "/" })}
            className="text-base text-white/90"
          >
            Skip
          </button>
        </header>

        <div className="mt-8">
          {dots}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <img
            src={slide.image}
            alt={slide.alt}
            width={1024}
            height={1024}
            className="w-80 h-80 object-contain"
          />

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-center leading-[1.1] whitespace-pre-line">
            {slide.title}
          </h1>
          <p className="mt-4 text-base text-white/50 text-center px-6 leading-relaxed">
            {slide.description}
          </p>
        </div>

        <button
          onClick={goNext}
          className="w-full rounded-2xl bg-white/[0.04] border border-white/10 py-5 text-base font-medium text-white"
        >
          Next
        </button>
      </div>
    </div>
  );
}
