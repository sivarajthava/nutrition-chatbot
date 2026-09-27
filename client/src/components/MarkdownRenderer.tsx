import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-base font-bold my-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-semibold my-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs font-semibold my-1">{children}</h3>,
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-emerald-700 dark:text-emerald-400">{children}</strong>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 border border-slate-200 dark:border-slate-700 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="px-3 py-2 bg-slate-100 dark:bg-slate-800 font-semibold text-left">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-800">{children}</td>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 font-mono text-xs text-emerald-600 dark:text-emerald-400">
              {children}
            </code>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
