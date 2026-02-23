const integrations = [
  { name: "Vue.js", color: "#4FC08D" },
  { name: "React", color: "#61DAFB" },
  { name: "Next.js", color: "#FFFFFF" },
  { name: "Three.js", color: "#049EF4" },
  { name: "TypeScript", color: "#3178C6" },
  { name: "Node.js", color: "#339933" },
  { name: "Swift", color: "#F05138" },
  { name: "PixiJS", color: "#E72264" },
  { name: "Tailwind", color: "#06B6D4" },
  { name: "Prisma", color: "#2D3748" },
];

export default function IntegrationLogos() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-2 font-mono text-sm text-syntax-purple">
            {"// 技術整合"}
          </p>
          <h2 className="font-mono text-3xl font-bold text-text-main md:text-4xl">
            Powered By
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {integrations.map((tech) => (
            <div
              key={tech.name}
              className="group flex flex-col items-center gap-3 rounded-xl border border-slate-700/50 bg-card/50 p-6 transition-all duration-300 hover:border-slate-600 hover:bg-card cursor-pointer"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold font-mono transition-transform duration-300 group-hover:scale-110"
                style={{ color: tech.color, backgroundColor: `${tech.color}15` }}
              >
                {tech.name.charAt(0)}
              </div>
              <span className="font-mono text-xs text-text-muted group-hover:text-text-main transition-colors">
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
