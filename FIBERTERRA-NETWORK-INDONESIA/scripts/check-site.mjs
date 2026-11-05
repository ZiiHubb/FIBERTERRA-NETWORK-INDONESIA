import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const htmlFiles = [];
let checkedReferences = 0;
let checkedAccessibilityRules = 0;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules") return [];
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? ""]));
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function accessibleText(markup) {
  return decodeEntities(markup
    .replace(/<(?:script|style|svg)\b[^>]*>[\s\S]*?<\/(?:script|style|svg)\s*>/gi, "")
    .replace(/<[^>]+\baria-hidden=["']true["'][^>]*>[\s\S]*?<\/[^>]+>/gi, "")
    .replace(/<img\b[^>]*>/gi, (image) => attributes(image).alt ?? "")
    .replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function extractIds(source) {
  return [...source.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
}

function hasAttributeReference(sourceIds, value) {
  return value.split(/\s+/).filter(Boolean).every((id) => sourceIds.includes(id));
}

function existsWithExactCase(targetPath) {
  const relativePath = path.relative(root, targetPath);
  if (relativePath.startsWith(`..${path.sep}`) || relativePath === "..") return false;

  let currentPath = root;
  for (const segment of relativePath.split(path.sep).filter(Boolean)) {
    let entries;
    try {
      entries = fs.readdirSync(currentPath);
    } catch {
      return false;
    }
    if (!entries.includes(segment)) return false;
    currentPath = path.join(currentPath, segment);
  }

  try {
    return fs.statSync(currentPath).isFile();
  } catch {
    return false;
  }
}

function checkReference(sourceFile, rawReference, sourceIds) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(rawReference)) {
    if (rawReference.startsWith("#")) {
      const fragment = decodeURIComponent(rawReference.slice(1));
      if (fragment && !sourceIds.includes(fragment)) {
        errors.push(`${path.relative(root, sourceFile)}: missing anchor #${fragment}`);
      }
    } else if (/^(?:javascript|vbscript):/i.test(rawReference)) {
      errors.push(`${path.relative(root, sourceFile)}: unsafe URL scheme in ${rawReference}`);
    } else if (/^(?:https?:)?\/\//i.test(rawReference)) {
      try {
        new URL(rawReference, "https://example.invalid");
      } catch {
        errors.push(`${path.relative(root, sourceFile)}: invalid external URL ${rawReference}`);
      }
    }
    return;
  }

  let reference;
  try {
    reference = decodeURIComponent(rawReference);
  } catch {
    errors.push(`${path.relative(root, sourceFile)}: invalid URL encoding in ${rawReference}`);
    return;
  }

  const hashIndex = reference.indexOf("#");
  const pathPart = (hashIndex >= 0 ? reference.slice(0, hashIndex) : reference).split("?")[0];
  const fragment = hashIndex >= 0 ? reference.slice(hashIndex + 1) : "";
  const targetPath = path.resolve(path.dirname(sourceFile), pathPart);
  checkedReferences += 1;

  if (!existsWithExactCase(targetPath)) {
    errors.push(`${path.relative(root, sourceFile)}: missing or mis-cased local reference ${rawReference}`);
    return;
  }

  if (fragment && targetPath.toLowerCase().endsWith(".html")) {
    const destination = fs.readFileSync(targetPath, "utf8");
    if (!extractIds(destination).includes(fragment)) {
      errors.push(`${path.relative(root, sourceFile)}: missing destination anchor ${rawReference}`);
    }
  }

  if (sourceFile.toLowerCase().endsWith(".html") && pathPart === "") {
    const fragmentId = decodeURIComponent(fragment);
    if (fragmentId && !sourceIds.includes(fragmentId)) {
      errors.push(`${path.relative(root, sourceFile)}: missing anchor #${fragmentId}`);
    }
  }
}

function checkAccessibleName(file, tag, content, tagName) {
  const attrs = attributes(tag);
  const hasName = Boolean(attrs["aria-label"]?.trim() || attrs["aria-labelledby"]?.trim()
    || attrs.title?.trim() || accessibleText(content));
  if (!hasName) errors.push(`${path.relative(root, file)}: ${tagName} has no accessible name`);
  checkedAccessibilityRules += 1;
}

for (const file of walk(root)) {
  const relativePath = path.relative(root, file);
  if (relativePath.startsWith(`assets${path.sep}`) && /[A-Z]/.test(relativePath)) {
    errors.push(`${relativePath}: asset paths must use lowercase names`);
  }
  if (!/\.(?:html|css|js|mjs)$/i.test(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  const isHtml = file.toLowerCase().endsWith(".html");
  const ids = isHtml ? extractIds(source) : [];

  if (isHtml) {
    htmlFiles.push(file);
    const relativeFile = path.relative(root, file);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    for (const duplicate of new Set(duplicates)) {
      errors.push(`${relativeFile}: duplicate id="${duplicate}"`);
    }

    const title = source.match(/<title>\s*([^<]+)\s*<\/title>/i)?.[1]?.trim() ?? "";
    const description = source.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim() ?? "";
    if (!title) errors.push(`${relativeFile}: missing page title`);
    if (!description) errors.push(`${relativeFile}: missing meta description`);
    if (title.length > 60) errors.push(`${relativeFile}: page title exceeds 60 characters`);
    if (description.length < 50 || description.length > 160) {
      errors.push(`${relativeFile}: meta description must be 50-160 characters`);
    }
    if (!/<meta\s+name=["']robots["']\s+content=["']index,follow["']/i.test(source)) {
      errors.push(`${relativeFile}: missing index,follow robots metadata`);
    }
    if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(source)) errors.push(`${relativeFile}: missing document language`);
    if ((source.match(/<main\b/gi) ?? []).length !== 1) errors.push(`${relativeFile}: expected exactly one main landmark`);
    if ((source.match(/<h1\b/gi) ?? []).length !== 1) errors.push(`${relativeFile}: expected exactly one h1 heading`);
    checkedAccessibilityRules += 4;

    const navs = [...source.matchAll(/<nav\b[^>]*>/gi)];
    for (const nav of navs) {
      const attrs = attributes(nav[0]);
      if (!attrs["aria-label"]?.trim() && !attrs["aria-labelledby"]?.trim()) {
        errors.push(`${relativeFile}: navigation landmark needs an accessible label`);
      }
      checkedAccessibilityRules += 1;
    }

    const skipLink = source.match(/<a\b[^>]*\bclass=["'][^"']*\bskip-link\b[^"']*["'][^>]*>/i)?.[0];
    if (!skipLink) {
      errors.push(`${relativeFile}: missing keyboard skip link`);
    } else {
      const target = attributes(skipLink).href?.slice(1);
      const main = source.match(/<main\b[^>]*>/i)?.[0];
      const mainAttrs = main ? attributes(main) : {};
      if (!target || target !== mainAttrs.id || mainAttrs.tabindex !== "-1") {
        errors.push(`${relativeFile}: skip link must target the focusable main landmark`);
      }
    }
    checkedAccessibilityRules += 1;

    for (const image of source.matchAll(/<img\b[^>]*>/gi)) {
      if (!Object.hasOwn(attributes(image[0]), "alt")) {
        errors.push(`${relativeFile}: image is missing alt text`);
      }
      checkedAccessibilityRules += 1;
    }

    for (const anchor of source.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
      checkAccessibleName(file, anchor[0].slice(0, anchor[0].indexOf(">") + 1), anchor[2], "link");
      const attrs = attributes(anchor[0].slice(0, anchor[0].indexOf(">") + 1));
      if (attrs.target?.toLowerCase() === "_blank" && !/\b(?:noopener|noreferrer)\b/i.test(attrs.rel ?? "")) {
        errors.push(`${relativeFile}: target=_blank link must use rel=noopener or rel=noreferrer`);
      }
    }

    for (const button of source.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button\s*>/gi)) {
      checkAccessibleName(file, `<button${button[1]}>`, button[2], "button");
    }

    for (const reference of source.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
      checkReference(file, reference[1], ids);
    }
    for (const set of source.matchAll(/\bsrcset=["']([^"']+)["']/gi)) {
      for (const candidate of set[1].split(",")) {
        const url = candidate.trim().split(/\s+/)[0];
        if (url) checkReference(file, url, ids);
      }
    }

    for (const property of ["og:locale", "og:type", "og:site_name", "og:title", "og:description", "og:image", "og:image:alt", "og:image:type", "og:image:width", "og:image:height"]) {
      const meta = source.match(new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, "i"));
      if (!meta) {
        errors.push(`${relativeFile}: missing Open Graph ${property}`);
      } else if (property === "og:image") {
        checkReference(file, meta[1], ids);
      }
    }
    for (const name of ["twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt"]) {
      const meta = source.match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, "i"));
      if (!meta) {
        errors.push(`${relativeFile}: missing social metadata ${name}`);
      } else if (name === "twitter:image") {
        checkReference(file, meta[1], ids);
      }
    }

    for (const reference of source.matchAll(/\b(?:aria-labelledby|aria-describedby|aria-controls|aria-owns|aria-activedescendant)=["']([^"']+)["']/gi)) {
      if (!hasAttributeReference(ids, reference[1])) {
        errors.push(`${relativeFile}: ARIA reference points to a missing id: ${reference[1]}`);
      }
    }
  }

  for (const reference of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    checkReference(file, reference[1].trim(), ids);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `ERROR ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Site checks passed: ${htmlFiles.length} HTML pages, ${checkedReferences} local references, and ${checkedAccessibilityRules} accessibility checks.`);
}
