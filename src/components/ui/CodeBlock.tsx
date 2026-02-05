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
 }
 
 export function CodeBlock({ code, language, className }: CodeBlockProps) {
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
 
   return (
     <pre className={cn("p-4 text-sm font-mono whitespace-pre-wrap break-words", className)}>
       <code ref={codeRef} className={`language-${prismLanguage}`}>
         {code}
       </code>
     </pre>
   );
 }