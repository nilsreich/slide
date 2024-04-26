"use client";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { useEffect, useState } from "react";
import rehypePrism from "rehype-prism-plus";
import { refractor } from "refractor/lib/core.js";
import python from "refractor/lang/python";
import rehypePrismGenerator from "rehype-prism-plus/generator";
import "./code.css";

refractor.register(python);
const myPrismPlugin = rehypePrismGenerator(refractor);

export const MarkdownRenderer = ({
  markdown,
  style,
}: {
  markdown: string;
  style?: any;
}) => {
  const [renderedMarkdown, setRenderedMarkdown] = useState("");

  useEffect(() => {
    const processMarkdown = async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypePrism)
        .use(rehypeStringify)
        .use(myPrismPlugin, {
          showLineNumbers: true,
          ignoreMissing: false,
          defaultLanguage: "python",
        });

      const result = await processor.process(markdown);
      setRenderedMarkdown(result.toString());
    };

    processMarkdown();
  }, [markdown]);

  return (
    <div style={style} dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
  );
};
