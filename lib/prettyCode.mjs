let getHighlighter;

import("shiki")
  .then((module) => {
    getHighlighter = module.getHighlighter;
    // Use getHighlighter here
  })
  .catch((error) => {
    console.error("Failed to load shiki", error);
  });
  import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import rangeParser2 from 'parse-numeric-range';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';

// src/index.ts
function isJSONTheme(value) {
  return value ? Object.hasOwn(value, "tokenColors") : false;
}
function isElement(value) {
  return value ? value.type === "element" : false;
}
function isText(value) {
  return value ? value.type === "text" : false;
}
function isInlineCode(element, parent) {
  return element.tagName === "code" && isElement(parent) && parent.tagName !== "pre" || element.tagName === "inlineCode";
}
function isBlockCode(element) {
  return element.tagName === "pre" && Array.isArray(element.children) && element.children.length === 1 && isElement(element.children[0]) && element.children[0].tagName === "code";
}
function getInlineCodeLang(meta, defaultFallbackLang) {
  const placeholder = "\0";
  let temp = meta.replace(/\\\\/g, placeholder);
  temp = temp.replace(/\\({:[a-zA-Z.-]+})$/, "$1");
  const lang = temp.match(/{:([a-zA-Z.-]+)}$/)?.[1];
  return lang?.replace(new RegExp(placeholder, "g"), "\\") || defaultFallbackLang;
}
function parseBlockMetaString(element, filter, defaultFallback) {
  let meta = filter(
    // @ts-expect-error: TODO handle this
    element.data?.meta ?? element.properties?.metastring ?? ""
  );
  const titleMatch = meta.match(/title="([^"]*)"/);
  const title = titleMatch?.[1] ?? null;
  meta = meta.replace(titleMatch?.[0] ?? "", "");
  const captionMatch = meta.match(/caption="([^"]*)"/);
  const caption = captionMatch?.[1] ?? null;
  meta = meta.replace(captionMatch?.[0] ?? "", "");
  let lang = defaultFallback;
  if (element.properties && Array.isArray(element.properties.className) && typeof element.properties.className[0] === "string" && element.properties.className[0].startsWith("language-")) {
    lang = element.properties.className[0].replace("language-", "");
  }
  return {
    title,
    caption,
    lang,
    meta
  };
}
function getThemeNames(theme) {
  if (isJSONTheme(theme)) {
    return [theme.name];
  }
  if (typeof theme === "string") {
    return [theme];
  }
  return Object.values(theme).map(
    (theme2) => typeof theme2 === "string" ? theme2 : theme2.name
  );
}
function replaceLineClass(element) {
  if (Array.isArray(element.properties?.className) && element.properties.className.includes("line")) {
    const className = element.properties.className.filter((c) => c !== "line");
    element.properties.className = className.length > 0 ? className : void 0;
    element.properties["data-line"] = "";
  }
}
function getLineId(lineNumber, meta) {
  const segments = meta.match(/\{[^}]+\}#[a-zA-Z0-9]+/g);
  if (!segments)
    return null;
  for (const segment of segments) {
    const [range, id] = segment.split("#");
    if (!(range && id))
      continue;
    const match = range.match(/\{(.*?)\}/);
    const capture = match?.[1];
    if (capture && rangeParser2(capture).includes(lineNumber)) {
      return id;
    }
  }
  return null;
}

// src/chars/splitElement.ts
function splitElement({
  elements,
  elementToWrap,
  innerString,
  rightString,
  leftString,
  rest,
  nextElementContinues,
  index,
  ignoreChars
}) {
  if (isElement(elementToWrap) && elementToWrap.children?.[0]?.type !== "text" || ignoreChars) {
    return [elementToWrap, index];
  }
  let newIndex = index;
  const textElement = elementToWrap.children[0];
  if (isText(textElement)) {
    textElement.value = innerString;
  }
  let rightStr = rightString;
  const leftStr = leftString;
  if (rest.length > 0) {
    rightStr += rest.map((s) => s === "" ? innerString : innerString + s).join("");
  }
  if (leftStr.length > 0) {
    elements.splice(newIndex, 0, {
      ...elementToWrap,
      properties: { ...elementToWrap.properties },
      children: [{ type: "text", value: leftStr }]
    });
  }
  if (rightStr.length > 0 && !nextElementContinues) {
    newIndex = leftStr.length > 0 ? newIndex + 2 : newIndex + 1;
    elements.splice(newIndex, 0, {
      ...elementToWrap,
      properties: { ...elementToWrap.properties },
      children: [{ type: "text", value: rightStr }]
    });
  }
  return [elementToWrap, index + 1];
}
function nextElementMaybeContinuesChars({
  elements,
  nextIndex,
  remainingPart
}) {
  if (remainingPart === "") {
    return false;
  }
  const nextNode = elements[nextIndex];
  const content = getContent(nextNode);
  if (!content) {
    return false;
  }
  const includesNext = content.startsWith(remainingPart) || remainingPart.startsWith(content);
  const overlap = findOverlap(content, remainingPart);
  if (overlap === remainingPart && content.startsWith(remainingPart)) {
    return true;
  }
  if (includesNext) {
    return nextElementMaybeContinuesChars({
      elements,
      nextIndex: nextIndex + 1,
      remainingPart: remainingPart.replace(content, "")
    });
  }
  return false;
}
function getContent(node) {
  if (!node)
    return;
  return toString(node);
}
function findOverlap(a, b) {
  if (b.length === 0) {
    return "";
  }
  if (a.endsWith(b)) {
    return b;
  }
  if (a.indexOf(b) >= 0) {
    return b;
  }
  return findOverlap(a, b.substring(0, b.length - 1));
}
function reverseString(s) {
  return s.split("").reverse().join("");
}

// src/chars/getElementsToHighlight.ts
function getElementsToHighlight(element, chars, startIndex = 0, ignoreChars = false) {
  const toWrap = [];
  let charsSoFar = "";
  if (element.children) {
    const elements = element.children;
    for (let i = startIndex; i < elements.length; i++) {
      const remaining = charsSoFar ? chars.replace(charsSoFar, "") : chars;
      if (remaining === "") {
        return toWrap;
      }
      const maybeElement = elements[i];
      if (!maybeElement || maybeElement.type !== "element" || // ignore any previously matched chars within
      Object.hasOwn(
        maybeElement.properties ?? {},
        "rehype-pretty-code-visited"
      )) {
        continue;
      }
      const content = getContent(maybeElement) || "";
      if (content === chars || charsSoFar + content === chars) {
        toWrap.push({ element: maybeElement, index: i });
        return toWrap;
      }
      if (chars.startsWith(charsSoFar + content)) {
        if (nextElementMaybeContinuesChars({
          elements,
          nextIndex: i + 1,
          remainingPart: remaining.replace(content, "")
        })) {
          toWrap.push({ element: elements[i], index: i });
          charsSoFar += content;
          continue;
        }
      }
      const overlap = findOverlap(content, remaining);
      const partialMatch = overlap && remaining.startsWith(overlap);
      if (partialMatch) {
        const nextPart = remaining.replace(overlap, "");
        if (nextPart !== "" && getContent(elements[i + 1]) && !nextElementMaybeContinuesChars({
          elements,
          nextIndex: i + 1,
          remainingPart: nextPart
        })) {
          continue;
        }
        const splitParts = content.split(overlap);
        const [leftPart, rightPart, ...rest] = splitParts;
        if (rightPart || leftPart || rest.length > 0) {
          const withNextNode = content + (getContent(elements[i + 1]) ? getContent(elements[i + 1]) : "");
          const nextNodeOverlap = findOverlap(withNextNode, remaining);
          const splitIndex = withNextNode.indexOf(nextNodeOverlap);
          if (chars.endsWith(overlap) || chars.startsWith(overlap)) {
            const rightString = rightPart.replace(overlap, "");
            const innerString = overlap;
            const leftString = content.substring(0, splitIndex);
            const nextElementContinues = nextElementMaybeContinuesChars({
              elements,
              nextIndex: i + 1,
              remainingPart: nextPart
            });
            const [newElement, updatedIndex] = splitElement({
              elements,
              elementToWrap: elements[i],
              innerString,
              rightString,
              leftString,
              rest,
              nextElementContinues,
              index: i,
              ignoreChars
            });
            charsSoFar += overlap;
            toWrap.push({
              element: newElement,
              index: updatedIndex
            });
          }
        }
      }
    }
  }
  return toWrap;
}

// src/chars/wrapHighlightedChars.ts
function wrapHighlightedChars(parentElement, elementsToWrap, options, ignoreWord, onVisitHighlightedChars) {
  if (!elementsToWrap || elementsToWrap.length === 0) {
    return;
  }
  const [{ element }] = elementsToWrap;
  if (ignoreWord) {
    if (element.properties) {
      element.properties["rehype-pretty-code-visited"] = "";
    }
    return;
  }
  if (elementsToWrap.length > 1) {
    parentElement.children.splice(
      elementsToWrap[0].index,
      elementsToWrap.length,
      {
        type: "element",
        tagName: "mark",
        properties: { "data-highlighted-chars-mark": "" },
        children: elementsToWrap.map(({ element: element3 }) => element3)
      }
    );
    const element2 = parentElement.children[elementsToWrap[0].index];
    if (!isElement(element2)) {
      return;
    }
    const wordStr = element2.children.reduce((acc, node) => {
      const textElement = isElement(node) ? node.children[0] : null;
      if (isText(textElement)) {
        return acc + textElement.value;
      }
      return acc;
    }, "");
    const id = options.idsMap.get(wordStr);
    element2.properties = element2.properties || {};
    element2.properties["data-highlighted-chars"] = "";
    element2.properties["data-chars-id"] = id;
    element2.tagName = "mark";
    onVisitHighlightedChars?.(element2, id);
  } else {
    const [{ element: element2 }] = elementsToWrap;
    const textElement = element2.children[0];
    if (!isText(textElement)) {
      return;
    }
    const id = options.idsMap.get(textElement.value);
    element2.properties = element2.properties || {};
    element2.properties["rehype-pretty-code-visited"] = "";
    element2.properties["data-highlighted-chars"] = "";
    element2.properties["data-chars-id"] = id;
    element2.tagName = "mark";
    element2.children = [
      {
        type: "element",
        tagName: "span",
        properties: {
          style: element2.properties.style
        },
        children: element2.children
      }
    ];
    element2.properties.style = void 0;
    onVisitHighlightedChars?.(element2, id);
  }
}
function charsHighlighter(element, charsList, options, onVisitHighlightedChars) {
  const { ranges = [] } = options;
  const textContent = toString(element);
  charsList.forEach((chars, index) => {
    if (chars && textContent?.includes(chars)) {
      let textContent2 = toString(element);
      let startIndex = 0;
      while (textContent2.includes(chars)) {
        const currentCharsRange = ranges[index] || [];
        const id = `${chars}-${index}`;
        options.counterMap.set(id, (options.counterMap.get(id) || 0) + 1);
        const ignoreChars = currentCharsRange.length > 0 && !currentCharsRange.includes(options.counterMap.get(id) ?? -1);
        const elementsToWrap = getElementsToHighlight(
          element,
          chars,
          startIndex,
          ignoreChars
        );
        if (elementsToWrap.length === 0)
          break;
        wrapHighlightedChars(
          element,
          elementsToWrap,
          options,
          ignoreChars,
          onVisitHighlightedChars
        );
        startIndex = Math.max(
          elementsToWrap[elementsToWrap.length - 1].index - 2,
          0
        );
        textContent2 = element.children.map((childNode) => {
          const props = isElement(childNode) ? childNode.properties : {};
          if (props && !Object.hasOwn(props, "rehype-pretty-code-visited") && !Object.hasOwn(props, "data-highlighted-chars-mark")) {
            return toString(childNode);
          }
        }).join("");
      }
    }
  });
  element.children.forEach((childNode) => {
    if (!isElement(childNode))
      return;
    if (Object.hasOwn(childNode.properties, "rehype-pretty-code-visited")) {
      childNode.properties["rehype-pretty-code-visited"] = void 0;
    }
  });
}

// src/index.ts
function apply(element, {
  tree,
  lang,
  title,
  caption,
  inline = false,
  keepBackground = true,
  grid = true,
  lineNumbersMaxDigits = 1,
  theme,
  onVisitTitle,
  onVisitCaption
}) {
  element.tagName = inline ? "span" : "figure";
  element.properties["data-rehype-pretty-code-figure"] = "";
  const codeData = element.children[0]?.data;
  element.children = [tree].map((tree2) => {
    const pre = tree2.children[0];
    const themeNames = getThemeNames(theme);
    const themeNamesString = themeNames.join(" ");
    if (!(isElement(pre) && pre.properties)) {
      return [];
    }
    const code = pre.children[0];
    if (Array.isArray(pre.properties.className) && pre.properties.className.includes("shiki")) {
      const className = pre.properties.className.filter(
        (c) => c !== "shiki" && c !== "shiki-themes" && (typeof c === "string" ? !themeNames.includes(c) : true)
      );
      pre.properties.className = className.length > 0 ? className : void 0;
    }
    if (!keepBackground) {
      pre.properties.style = void 0;
    }
    pre.properties["data-language"] = lang;
    pre.properties["data-theme"] = themeNamesString;
    if (!(isElement(code) && code.properties)) {
      return [];
    }
    code.properties["data-language"] = lang;
    code.properties["data-theme"] = themeNamesString;
    code.data = codeData;
    if (inline) {
      if (keepBackground) {
        code.properties.style = pre.properties.style;
      }
      return code;
    }
    if (grid) {
      if (code.properties.style) {
        code.properties.style += "display: grid;";
      } else {
        code.properties.style = "display: grid;";
      }
    }
    if (Object.hasOwn(code.properties, "data-line-numbers")) {
      code.properties["data-line-numbers-max-digits"] = lineNumbersMaxDigits.toString().length;
    }
    const fragments = [];
    if (title) {
      const elementContent = {
        type: "element",
        tagName: caption ? "div" : "figcaption",
        properties: {
          "data-rehype-pretty-code-title": "",
          "data-language": lang,
          "data-theme": themeNamesString
        },
        children: [{ type: "text", value: title }]
      };
      onVisitTitle?.(elementContent);
      fragments.push(elementContent);
    }
    fragments.push(pre);
    if (caption) {
      const elementContent = {
        type: "element",
        tagName: "figcaption",
        properties: {
          "data-rehype-pretty-code-caption": "",
          "data-language": lang,
          "data-theme": themeNamesString
        },
        children: [{ type: "text", value: caption }]
      };
      onVisitCaption?.(elementContent);
      fragments.push(elementContent);
    }
    return fragments;
  }).flatMap((c) => c);
}
var globalHighlighterCache = /* @__PURE__ */ new Map();
var hastParser = unified().use(rehypeParse, { fragment: true });
function rehypePrettyCode(options = {}) {
  const {
    grid = true,
    theme = "github-dark-dimmed",
    keepBackground = true,
    defaultLang = "",
    tokensMap = {},
    filterMetaString = (v) => v,
    getHighlighter: getHighlighter$1 = getHighlighter,
    transformers,
    onVisitLine,
    onVisitHighlightedLine,
    onVisitHighlightedChars,
    onVisitTitle,
    onVisitCaption
  } = options;
  const key = JSON.stringify(theme);
  let cachedHighlighter = globalHighlighterCache.get(key);
  if (!cachedHighlighter) {
    cachedHighlighter = getHighlighter$1({
      themes: isJSONTheme(theme) || typeof theme === "string" ? [theme] : Object.values(theme),
      langs: ["plaintext"]
    });
    globalHighlighterCache.set(key, cachedHighlighter);
  }
  const defaultCodeBlockLang = typeof defaultLang === "string" ? defaultLang : defaultLang.block || "";
  const defaultInlineCodeLang = typeof defaultLang === "string" ? defaultLang : defaultLang.inline || "";
  function getOptions(lang, meta) {
    const multipleThemes = !isJSONTheme(theme) && typeof theme === "object" ? theme : null;
    const singleTheme = isJSONTheme(theme) || typeof theme === "string" ? theme : null;
    return {
      lang,
      meta: { __raw: meta },
      transformers,
      defaultColor: typeof theme === "string" ? theme : false,
      ...multipleThemes ? { themes: multipleThemes } : { theme: singleTheme }
    };
  }
  return async (tree) => {
    const langsToLoad = /* @__PURE__ */ new Set();
    const highlighter = await cachedHighlighter;
    if (!highlighter)
      return;
    visit(tree, "element", (element, _, parent) => {
      if (isInlineCode(element, parent)) {
        const textElement = element.children[0];
        if (!isText(textElement))
          return;
        const value = textElement.value;
        if (!value)
          return;
        const lang = getInlineCodeLang(value, defaultInlineCodeLang);
        if (lang && lang[0] !== ".") {
          langsToLoad.add(lang);
        }
      }
      if (isBlockCode(element)) {
        const codeElement = element.children[0];
        if (!isElement(codeElement))
          return;
        const { lang } = parseBlockMetaString(
          codeElement,
          filterMetaString,
          defaultCodeBlockLang
        );
        if (lang) {
          langsToLoad.add(lang);
        }
      }
    });
    try {
      await Promise.allSettled(
        Array.from(langsToLoad).map((lang) => {
          try {
            return highlighter.loadLanguage(
              lang
            );
          } catch (e) {
            return Promise.reject(e);
          }
        })
      );
    } catch (e) {
      console.error(e);
    }
    visit(tree, "element", (element, _, parent) => {
      if (isInlineCode(element, parent)) {
        const textElement = element.children[0];
        if (!isText(textElement))
          return;
        const value = textElement.value;
        if (!value)
          return;
        const keepLangPart = /\\{:[a-zA-Z.-]+}$/.test(value);
        const strippedValue = keepLangPart ? value.replace(/\\({:[a-zA-Z.-]+})$/, "$1") : value.replace(/{:[a-zA-Z.-]+}$/, "");
        textElement.value = strippedValue;
        const lang = keepLangPart ? "" : getInlineCodeLang(value, defaultInlineCodeLang);
        const isLang = lang[0] !== ".";
        if (!lang)
          return;
        let codeTree;
        if (isLang) {
          try {
            codeTree = hastParser.parse(
              highlighter.codeToHtml(strippedValue, getOptions(lang))
            );
          } catch {
            codeTree = hastParser.parse(
              highlighter.codeToHtml(strippedValue, getOptions("plaintext"))
            );
          }
        } else {
          const themeNames = getThemeNames(theme);
          const isMultiTheme = typeof theme === "object" && !isJSONTheme(theme);
          const themeKeys = isMultiTheme ? Object.keys(theme) : null;
          const colorsByTheme = themeNames.map(
            (name) => name ? highlighter.getTheme(name).settings.find(
              ({ scope }) => scope?.includes(tokensMap[lang.slice(1)] ?? lang.slice(1))
            )?.settings.foreground ?? "inherit" : "inherit"
          );
          if (isMultiTheme && themeKeys) {
            codeTree = hastParser.parse(
              `<pre><code><span style="${themeKeys.map((key2, i) => `--shiki-${key2}:${colorsByTheme[i]}`).join(";")}">${strippedValue}</span></code></pre>`
            );
          } else {
            codeTree = hastParser.parse(
              `<pre><code><span style="color:${colorsByTheme[0]}">${strippedValue}</span></code></pre>`
            );
          }
        }
        visit(codeTree, "element", replaceLineClass);
        apply(element, {
          tree: codeTree,
          lang: isLang ? lang : ".token",
          inline: true,
          keepBackground,
          theme
        });
      }
      if (isBlockCode(element)) {
        const codeElement = element.children[0];
        if (!isElement(codeElement))
          return;
        const textElement = codeElement.children[0];
        const { title, caption, meta, lang } = parseBlockMetaString(
          codeElement,
          filterMetaString,
          defaultCodeBlockLang
        );
        if (!lang || lang === "math")
          return;
        const lineNumbers = [];
        if (meta) {
          const matches = meta.matchAll(/\{(.*?)\}/g);
          for (const match of matches) {
            if (match[1]) {
              lineNumbers.push(...rangeParser2(match[1]));
            }
          }
        }
        let lineNumbersMaxDigits = 0;
        const lineIdMap = /* @__PURE__ */ new Map();
        const charsList = [];
        const charsListNumbers = [];
        const charsListIdMap = /* @__PURE__ */ new Map();
        const charsMatches = meta ? [
          ...meta.matchAll(
            /(?<delimiter>["/])(?<chars>.*?)\k<delimiter>(?<charsIdAndOrRange>\S*)/g
          )
        ] : void 0;
        lineNumbers.forEach((lineNumber) => {
          const id = getLineId(lineNumber, meta);
          id && lineIdMap.set(lineNumber, id);
        });
        if (Array.isArray(charsMatches)) {
          charsMatches.forEach((name) => {
            const { chars, charsIdAndOrRange } = name.groups;
            charsList.push(chars);
            if (charsIdAndOrRange === "") {
              charsListNumbers.push([]);
            } else {
              const [range, id] = charsIdAndOrRange.split("#");
              range && charsListNumbers.push(rangeParser2(range));
              id && charsListIdMap.set(chars, id);
            }
          });
        }
        if (!isText(textElement))
          return;
        const strippedValue = textElement.value.replace(/\n$/, "");
        let codeTree;
        try {
          codeTree = hastParser.parse(
            highlighter.codeToHtml(strippedValue, getOptions(lang, meta))
          );
        } catch {
          codeTree = hastParser.parse(
            highlighter.codeToHtml(
              strippedValue,
              getOptions("plaintext", meta)
            )
          );
        }
        let lineCounter = 0;
        const charsHighlighterOptions = {
          ranges: charsListNumbers,
          idsMap: charsListIdMap,
          counterMap: /* @__PURE__ */ new Map()
        };
        visit(codeTree, "element", (element2) => {
          if (element2.tagName === "code" && /srebmuNeniLwohs(?!(.*)(\/))/.test(reverseString(meta))) {
            if (element2.properties) {
              element2.properties["data-line-numbers"] = "";
            }
            const lineNumbersStartAtMatch = reverseString(meta).match(
              /(?:\}(\d+){)?srebmuNeniLwohs(?!(.*)(\/))/
            );
            const startNumberString = lineNumbersStartAtMatch?.[1];
            if (startNumberString) {
              const startAt = startNumberString ? Number(reverseString(startNumberString)) - 1 : 0;
              lineNumbersMaxDigits = startAt;
              if (element2.properties) {
                element2.properties.style = `counter-set: line ${startAt};`;
              }
            }
          }
          if (Array.isArray(element2.properties?.className) && element2.properties?.className?.[0] === "line") {
            if (grid && toString(element2) === "") {
              element2.children = [{ type: "text", value: " " }];
            }
            replaceLineClass(element2);
            onVisitLine?.(element2);
            lineCounter++;
            if (lineNumbers.includes(lineCounter)) {
              element2.properties["data-highlighted-line"] = "";
              const lineId = lineIdMap.get(lineCounter);
              if (lineId) {
                element2.properties["data-highlighted-line-id"] = lineId;
              }
              onVisitHighlightedLine?.(element2, lineId);
            }
            charsHighlighter(
              element2,
              charsList,
              charsHighlighterOptions,
              onVisitHighlightedChars
            );
            lineNumbersMaxDigits++;
          }
        });
        apply(element, {
          tree: codeTree,
          lang,
          title,
          caption,
          keepBackground,
          grid,
          lineNumbersMaxDigits,
          theme,
          onVisitTitle,
          onVisitCaption
        });
      }
    });
  };
}

export { rehypePrettyCode as default };
