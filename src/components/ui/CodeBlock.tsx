 import { useEffect, useRef } from "react";
 import Prism from "prismjs";
 import "prismjs/components/prism-json";
 import "prismjs/components/prism-css";
 import "prismjs/components/prism-scss";
 import "prismjs/components/prism-markdown";
 import { cn } from "@/lib/utils";
 
 interface CodeBlockProps {
   code: string;
   language: "json" | "css" | "scss" | "markdown" | "md";
   className?: string;
  showLineNumbers?: boolean;
 }
 
export function CodeBlock({ code, language, className, showLineNumbers = true }: CodeBlockProps) {
   const codeRef = useRef<HTMLElement>(null);
 
   // Map language aliases
   const languageMap: Record<string, string> = {
     md: "markdown",
     json: "json",
     css: "css",
     scss: "scss",
     markdown: "markdown",
   };
 
   const prismLanguage = languageMap[language] || language;
 
   useEffect(() => {
     if (codeRef.current) {
       Prism.highlightElement(codeRef.current);
     }
   }, [code, language]);
 
  const lines = code.split('\n');
  const lineNumberWidth = String(lines.length).length;

  if (showLineNumbers) {
    return (
      <pre className={cn("text-sm font-mono overflow-x-auto", className)}>
        <div className="flex">
          {/* Line numbers column */}
          <div className="flex-shrink-0 select-none pr-4 text-right text-muted-foreground/50 border-r border-border mr-4">
            {lines.map((_, index) => (
              <div key={index} className="leading-6" style={{ minWidth: `${lineNumberWidth}ch` }}>
                {index + 1}
              </div>
            ))}
          </div>
          {/* Code column */}
          <code ref={codeRef} className={`language-${prismLanguage} flex-1`}>
            {lines.map((line, index) => (
              <div key={index} className="leading-6 whitespace-pre">
                {line || ' '}
              </div>
            ))}
          </code>
        </div>
      </pre>
    );
  }

   return (
     <pre className={cn("p-4 text-sm font-mono whitespace-pre-wrap break-words", className)}>
       <code ref={codeRef} className={`language-${prismLanguage}`}>
         {code}
       </code>
     </pre>
   );
 }