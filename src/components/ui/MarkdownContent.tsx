"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-custom">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-6 mt-10 font-mono text-3xl font-bold text-text-main">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 mt-8 font-mono text-2xl font-bold text-text-main">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-6 font-mono text-xl font-semibold text-text-main">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-text-muted">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary underline decoration-primary/30 transition-colors hover:text-syntax-green hover:decoration-syntax-green/30"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-disc space-y-1 text-text-muted">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-decimal space-y-1 text-text-muted">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-card px-1.5 py-0.5 font-mono text-sm text-syntax-orange">
                  {children}
                </code>
              );
            }
            return (
              <code className="block overflow-x-auto rounded-lg bg-[#1a1b26] p-4 font-mono text-sm leading-7 text-text-main">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-4 overflow-hidden rounded-lg border border-slate-700/50">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-primary/50 pl-4 italic text-text-muted">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto rounded-lg border border-slate-700/50">
              <table className="w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-slate-700/50 bg-card px-4 py-3 text-left font-mono text-sm font-semibold text-text-main">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-slate-800/30 px-4 py-3 text-sm text-text-muted">
              {children}
            </td>
          ),
          hr: () => <hr className="my-8 border-slate-700/50" />,
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || ""}
              className="mb-4 rounded-lg border border-slate-700/50"
              loading="lazy"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
