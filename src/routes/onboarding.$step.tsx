import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import orbImg from "@/assets/onboard-orb.jpg";
import focusImg from "@/assets/onboard-focus.jpg";
import aiImg from "@/assets/onboard-ai.jpg";
import cubesImg from "@/assets/onboard-cubes.jpg";

type Slide = {
  image: string;
  alt: string;
  title: string;
  description: string;
};

const slides: Slide[] = [
  {
    image: orbImg,
    alt: "Glowing Flow State orb",
    title: "Welcome to\nFlow State",
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
  {
    image: cubesImg,
    alt: "Cluster of feature cubes",
    title: "Everything You\nNeed to Succeed",
    description: "Assignments, AI help, study with friends, and powerful tools.",
  },
];

export const Route = createFileRoute("/onboarding/$step")({
  parseParams: ({ step }) => {
    const n = Number(step);
    if (!Number.isInteger(n) || n < 1 || n > slides.length) throw notFound();
    return { step: String(n) };
  },
  head: ({ params }) => {
    const slide = slides[Number(params.step) - 1] ?? slides[0];
    const title = slide.title.replace(/\n/g, " ");
    return {
      meta: [
        { title: `${title} — Flow State` },
        { name: "description", content: slide.description },
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
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  const goNext = () => {
    if (isLast) {
      navigate({ to: "/" });
    } else {
      navigate({
        to: "/onboarding/$step",
        params: { step: String(index + 2) },
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex justify-center overflow-hidden">
      <div className="relative w-full max-w-md h-full flex flex-col px-8 pt-12 pb-10">
        <header className="flex items-center justify-end h-6">
          {!isLast && (
            <button
              onClick={() => navigate({ to: "/" })}
              className="text-base text-white/90"
            >
              Skip
            </button>
          )}
        </header>

        <div className="mt-8 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === index ? "w-10 bg-white" : "w-10 bg-white/20"
              }`}
            />
          ))}
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
          {isLast ? "Start" : "Next"}
        </button>
      </div>
    </div>
  );
}
