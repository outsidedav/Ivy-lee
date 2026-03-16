import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#eee]">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-light tracking-tight text-[#1a1a1a]">
            Ivy Lee
          </h1>
          <Link
            href="/login"
            className="text-xs font-medium tracking-wide text-[#1a1a1a] hover:text-[#555] transition-colors"
          >
            Sign in &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6">
        {/* Hero */}
        <section className="pt-16 pb-12">
          <h2 className="text-3xl font-light tracking-tight text-[#1a1a1a] leading-tight">
            Six things.<br />
            In order.<br />
            Every day.
          </h2>
          <p className="mt-6 text-sm text-[#666] leading-relaxed max-w-sm">
            A simple productivity app based on the Ivy Lee method — the
            century-old system that keeps you focused on what matters most.
          </p>
        </section>

        <div className="border-t border-[#eee]" />

        {/* The Method */}
        <section className="py-12">
          <h3 className="text-xs font-medium tracking-widest uppercase text-[#999] mb-6">
            The Method
          </h3>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="w-5 text-right text-xs font-mono text-[#bbb] pt-0.5">
                1
              </span>
              <p className="text-sm text-[#444] leading-relaxed">
                At the end of each day, write down the six most important things
                you need to accomplish tomorrow.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="w-5 text-right text-xs font-mono text-[#bbb] pt-0.5">
                2
              </span>
              <p className="text-sm text-[#444] leading-relaxed">
                Prioritize those six items in order of their true importance.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="w-5 text-right text-xs font-mono text-[#bbb] pt-0.5">
                3
              </span>
              <p className="text-sm text-[#444] leading-relaxed">
                When you arrive tomorrow, concentrate only on the first task.
                Work until it is finished before moving on.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="w-5 text-right text-xs font-mono text-[#bbb] pt-0.5">
                4
              </span>
              <p className="text-sm text-[#444] leading-relaxed">
                Approach the rest of the list in the same fashion. At the end of
                the day, move any unfinished items to a new list of six for
                tomorrow.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="w-5 text-right text-xs font-mono text-[#bbb] pt-0.5">
                5
              </span>
              <p className="text-sm text-[#444] leading-relaxed">
                Repeat every working day.
              </p>
            </li>
          </ol>
        </section>

        <div className="border-t border-[#eee]" />

        {/* The Story */}
        <section className="py-12">
          <h3 className="text-xs font-medium tracking-widest uppercase text-[#999] mb-6">
            The Story
          </h3>
          <div className="space-y-4 text-sm text-[#444] leading-relaxed">
            <p>
              In 1918, Charles Schwab was the president of Bethlehem Steel, one
              of the largest companies in the world. Seeking greater efficiency,
              he hired Ivy Lee — a respected productivity consultant — and gave
              him a simple challenge: help his executives get more done.
            </p>
            <p>
              Lee spent fifteen minutes with each executive and asked them to
              follow this method for three months. Schwab was so pleased with
              the results that he wrote Lee a check for $25,000 — worth
              roughly $500,000 today.
            </p>
            <p>
              The method works because it forces a single constraint:
              focus. No multitasking, no endless lists, no rearranging
              priorities mid-day. Just six things, in order.
            </p>
          </div>
        </section>

        <div className="border-t border-[#eee]" />

        {/* What This App Adds */}
        <section className="py-12">
          <h3 className="text-xs font-medium tracking-widest uppercase text-[#999] mb-6">
            What This App Adds
          </h3>
          <ul className="space-y-3">
            <li className="flex gap-4">
              <span className="w-5 text-right text-xs text-[#bbb] pt-0.5">
                &bull;
              </span>
              <p className="text-sm text-[#444] leading-relaxed">
                <span className="text-[#1a1a1a] font-medium">
                  Today & Tomorrow lists
                </span>{" "}
                — plan tomorrow&apos;s tasks tonight, then focus on today.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="w-5 text-right text-xs text-[#bbb] pt-0.5">
                &bull;
              </span>
              <p className="text-sm text-[#444] leading-relaxed">
                <span className="text-[#1a1a1a] font-medium">
                  Priority points
                </span>{" "}
                — earn more for tackling your hardest tasks first.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="w-5 text-right text-xs text-[#bbb] pt-0.5">
                &bull;
              </span>
              <p className="text-sm text-[#444] leading-relaxed">
                <span className="text-[#1a1a1a] font-medium">
                  Coffee breaks
                </span>{" "}
                — redeem points for a virtual espresso when you&apos;ve earned
                it.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="w-5 text-right text-xs text-[#bbb] pt-0.5">
                &bull;
              </span>
              <p className="text-sm text-[#444] leading-relaxed">
                <span className="text-[#1a1a1a] font-medium">
                  Drag & drop
                </span>{" "}
                — reorder and move tasks between days with ease.
              </p>
            </li>
          </ul>
        </section>

        <div className="border-t border-[#eee]" />

        {/* Footer CTA */}
        <section className="py-16 text-center">
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-[#1a1a1a] text-white text-sm font-medium tracking-wide hover:bg-[#333] transition-colors"
          >
            Get started
          </Link>
          <p className="mt-4 text-xs text-[#aaa]">
            Free. No credit card required.
          </p>
        </section>
      </main>
    </div>
  );
}
