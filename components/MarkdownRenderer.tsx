import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";
import { useEffect, useState } from "react";

export const MarkdownRenderer = ({
  children,
  style,
  isDarkMode,
}: {
  children: string;
  style: any;
  isDarkMode: boolean;
}) => {
  const [renderedMarkdown, setRenderedMarkdown] = useState("");

  useEffect(() => {
    const processMarkdown = async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypePrettyCode, {
          theme: isDarkMode ? "github-dark-default" : "github-light-default",
          defaultLang: "python",
        })
        .use(rehypeStringify);

      const result = await processor.process(children);
      setRenderedMarkdown(result.toString());
    };

    processMarkdown();
  }, [children]);

  return (
    <div style={style} dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
  );
};
