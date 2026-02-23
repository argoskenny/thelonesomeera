import { Check, Minus } from "lucide-react";

const features = [
  {
    category: "前端框架",
    items: [
      { name: "Vue.js 3", web: true, game: true, mobile: false },
      { name: "React / Next.js", web: true, game: false, mobile: false },
      { name: "SwiftUI", web: false, game: false, mobile: true },
    ],
  },
  {
    category: "3D / 遊戲",
    items: [
      { name: "Three.js", web: true, game: true, mobile: false },
      { name: "PixiJS", web: false, game: true, mobile: false },
      { name: "Canvas 2D", web: true, game: true, mobile: false },
    ],
  },
  {
    category: "後端 / 工具",
    items: [
      { name: "Node.js", web: true, game: true, mobile: false },
      { name: "TypeScript", web: true, game: true, mobile: false },
      { name: "SQLite / Prisma", web: true, game: false, mobile: false },
    ],
  },
];

function Cell({ active }: { active: boolean }) {
  return active ? (
    <Check className="mx-auto h-4 w-4 text-syntax-green" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-slate-600" />
  );
}

export default function FeatureTable() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <p className="mb-2 font-mono text-sm text-syntax-orange">
            {"// 技術能力矩陣"}
          </p>
          <h2 className="font-mono text-3xl font-bold text-text-main md:text-4xl">
            Tech Stack Overview
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-card">
                <th className="px-6 py-4 text-left font-mono text-sm font-semibold text-text-main">
                  技術
                </th>
                <th className="px-6 py-4 text-center font-mono text-sm font-semibold text-syntax-blue">
                  Web
                </th>
                <th className="px-6 py-4 text-center font-mono text-sm font-semibold text-syntax-green">
                  Game
                </th>
                <th className="px-6 py-4 text-center font-mono text-sm font-semibold text-syntax-purple">
                  Mobile
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((group) => (
                <>
                  <tr
                    key={`cat-${group.category}`}
                    className="border-b border-slate-800/50"
                  >
                    <td
                      colSpan={4}
                      className="bg-slate-800/30 px-6 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-text-muted"
                    >
                      {group.category}
                    </td>
                  </tr>
                  {group.items.map((item) => (
                    <tr
                      key={item.name}
                      className="border-b border-slate-800/30 transition-colors hover:bg-card/50"
                    >
                      <td className="px-6 py-3 font-mono text-sm text-text-main">
                        {item.name}
                      </td>
                      <td className="px-6 py-3">
                        <Cell active={item.web} />
                      </td>
                      <td className="px-6 py-3">
                        <Cell active={item.game} />
                      </td>
                      <td className="px-6 py-3">
                        <Cell active={item.mobile} />
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
