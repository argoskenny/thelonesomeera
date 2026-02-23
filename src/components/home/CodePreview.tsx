export default function CodePreview() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-2 font-mono text-sm text-syntax-green">
            {"// 技術堆疊一覽"}
          </p>
          <h2 className="font-mono text-3xl font-bold text-text-main md:text-4xl">
            Code Speaks Louder
          </h2>
        </div>

        {/* 模擬編輯器視窗 */}
        <div className="code-window">
          <div className="code-window-header">
            <div className="code-window-dot bg-red-500" />
            <div className="code-window-dot bg-yellow-500" />
            <div className="code-window-dot bg-green-500" />
            <span className="ml-3 font-mono text-xs text-text-muted">
              portfolio.ts
            </span>
          </div>
          <div className="overflow-x-auto p-6">
            <pre className="font-mono text-sm leading-7">
              <code>
                <Line num={1}>
                  <span className="text-syntax-purple">interface</span>{" "}
                  <span className="text-syntax-green">Developer</span>{" "}
                  <span className="text-text-muted">{"{"}</span>
                </Line>
                <Line num={2}>
                  {"  "}
                  <span className="text-syntax-blue">name</span>
                  <span className="text-text-muted">: </span>
                  <span className="text-syntax-green">string</span>
                  <span className="text-text-muted">;</span>
                </Line>
                <Line num={3}>
                  {"  "}
                  <span className="text-syntax-blue">skills</span>
                  <span className="text-text-muted">: </span>
                  <span className="text-syntax-green">string</span>
                  <span className="text-text-muted">[];</span>
                </Line>
                <Line num={4}>
                  {"  "}
                  <span className="text-syntax-blue">passion</span>
                  <span className="text-text-muted">: </span>
                  <span className="text-syntax-orange">
                    &quot;endless&quot;
                  </span>
                  <span className="text-text-muted">;</span>
                </Line>
                <Line num={5}>
                  <span className="text-text-muted">{"}"}</span>
                </Line>
                <Line num={6}>{""}</Line>
                <Line num={7}>
                  <span className="text-syntax-purple">const</span>{" "}
                  <span className="text-syntax-yellow">me</span>
                  <span className="text-text-muted">: </span>
                  <span className="text-syntax-green">Developer</span>
                  <span className="text-text-muted"> = {"{"}</span>
                </Line>
                <Line num={8}>
                  {"  "}
                  <span className="text-syntax-blue">name</span>
                  <span className="text-text-muted">: </span>
                  <span className="text-syntax-orange">
                    &quot;The Lonesome Era&quot;
                  </span>
                  <span className="text-text-muted">,</span>
                </Line>
                <Line num={9}>
                  {"  "}
                  <span className="text-syntax-blue">skills</span>
                  <span className="text-text-muted">: [</span>
                </Line>
                <Line num={10}>
                  {"    "}
                  <span className="text-syntax-orange">
                    &quot;Vue.js&quot;
                  </span>
                  <span className="text-text-muted">, </span>
                  <span className="text-syntax-orange">
                    &quot;React&quot;
                  </span>
                  <span className="text-text-muted">, </span>
                  <span className="text-syntax-orange">
                    &quot;Next.js&quot;
                  </span>
                  <span className="text-text-muted">, </span>
                  <span className="text-syntax-orange">
                    &quot;Three.js&quot;
                  </span>
                  <span className="text-text-muted">,</span>
                </Line>
                <Line num={11}>
                  {"    "}
                  <span className="text-syntax-orange">
                    &quot;Swift&quot;
                  </span>
                  <span className="text-text-muted">, </span>
                  <span className="text-syntax-orange">
                    &quot;Node.js&quot;
                  </span>
                  <span className="text-text-muted">, </span>
                  <span className="text-syntax-orange">
                    &quot;TypeScript&quot;
                  </span>
                </Line>
                <Line num={12}>
                  {"  "}
                  <span className="text-text-muted">],</span>
                </Line>
                <Line num={13}>
                  {"  "}
                  <span className="text-syntax-blue">passion</span>
                  <span className="text-text-muted">: </span>
                  <span className="text-syntax-orange">
                    &quot;endless&quot;
                  </span>
                </Line>
                <Line num={14}>
                  <span className="text-text-muted">{"};"}</span>
                </Line>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Line({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="mr-6 inline-block w-6 select-none text-right text-text-muted/30">
        {num}
      </span>
      <span>{children}</span>
    </div>
  );
}
