/* ============================================================================
 * Copyright (c) Palo Alto Networks
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * ========================================================================== */

// @ts-nocheck

import slugify from "slugify";

/**
 * Maps over array passing `isLast` bool to iterator as the second argument
 */
export function mapWithLast<T, P>(
  array: T[],
  iteratee: (item: T, isLast: boolean) => P
) {
  const res: P[] = [];
  for (let i = 0; i < array.length - 1; i++) {
    res.push(iteratee(array[i], false));
  }
  if (array.length !== 0) {
    res.push(iteratee(array[array.length - 1], true));
  }
  return res;
}

/**
 * Creates an object with the same keys as object and values generated by running each
 * own enumerable string keyed property of object thru iteratee.
 * The iteratee is invoked with three arguments: (value, key, object).
 *
 * @param object the object to iterate over
 * @param iteratee the function invoked per iteration.
 */
export function mapValues<T, P>(
  object: Record<string, T>,
  iteratee: (val: T, key: string, obj: Record<string, T>) => P
): Record<string, P> {
  const res: { [key: string]: P } = {};
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      res[key] = iteratee(object[key], key, object);
    }
  }
  return res;
}

/**
 * flattens collection using `prop` field as a children
 * @param collectionItems collection items
 * @param prop item property with child elements
 */
export function flattenByProp<T extends object, P extends keyof T>(
  collectionItems: T[],
  prop: P
): T[] {
  const res: T[] = [];
  const iterate = (items: T[]) => {
    for (const item of items) {
      res.push(item);
      if (item[prop]) {
        iterate(item[prop] as any as T[]);
      }
    }
  };
  iterate(collectionItems);
  return res;
}

export function stripTrailingSlash(path: string): string {
  if (path.endsWith("/")) {
    return path.substring(0, path.length - 1);
  }
  return path;
}

export function isNumeric(n: any): n is number {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export function appendToMdHeading(
  md: string,
  heading: string,
  content: string
) {
  // if  heading is already in md and append to the end of it
  const testRegex = new RegExp(`(^|\\n)#\\s?${heading}\\s*\\n`, "i");
  const replaceRegex = new RegExp(
    `((\\n|^)#\\s*${heading}\\s*(\\n|$)(?:.|\\n)*?)(\\n#|$)`,
    "i"
  );
  if (testRegex.test(md)) {
    return md.replace(replaceRegex, `$1\n\n${content}\n$4`);
  } else {
    // else append heading itself
    const br =
      md === "" || md.endsWith("\n\n") ? "" : md.endsWith("\n") ? "\n" : "\n\n";
    return `${md}${br}# ${heading}\n\n${content}`;
  }
}

// credits https://stackoverflow.com/a/46973278/1749888
export const mergeObjects = (target: any, ...sources: any[]): any => {
  if (!sources.length) {
    return target;
  }
  const source = sources.shift();
  if (source === undefined) {
    return target;
  }

  if (isMergebleObject(target) && isMergebleObject(source)) {
    Object.keys(source).forEach((key: string) => {
      if (isMergebleObject(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        mergeObjects(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    });
  }

  return mergeObjects(target, ...sources);
};

export const isObject = (item: unknown): item is Record<string, unknown> => {
  return item !== null && typeof item === "object";
};

const isMergebleObject = (item): boolean => {
  return isObject(item) && !isArray(item);
};

/**
 * slugify() returns empty string when failed to slugify.
 * so try to return minimum slugified-string with failed one which keeps original value
 * the regex codes are referenced with https://gist.github.com/mathewbyrne/1280286
 */
export function safeSlugify(value: string): string {
  return (
    slugify(value) ||
    value
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/&/g, "-and-") // Replace & with 'and'
      .replace(/--+/g, "-") // Replace multiple - with single -
      .replace(/^-+/, "") // Trim - from start of text
      .replace(/-+$/, "")
  ); // Trim - from end of text
}

export function isAbsoluteUrl(url: string) {
  return /(?:^[a-z][a-z0-9+.-]*:|\/\/)/i.test(url);
}

/**
 * simple resolve URL which doesn't break on strings with url fragments
 * e.g. resolveUrl('http://test.com:{port}', 'path') results in http://test.com:{port}/path
 */
export function resolveUrl(url: string, to: string) {
  let res;
  if (to.startsWith("//")) {
    try {
      res = `${new URL(url).protocol || "https:"}${to}`;
    } catch {
      res = `https:${to}`;
    }
  } else if (isAbsoluteUrl(to)) {
    res = to;
  } else if (!to.startsWith("/")) {
    res = stripTrailingSlash(url) + "/" + to;
  } else {
    try {
      const urlObj = new URL(url);
      urlObj.pathname = to;
      res = urlObj.href;
    } catch {
      res = to;
    }
  }
  return stripTrailingSlash(res);
}

export function getBasePath(serverUrl: string): string {
  try {
    return parseURL(serverUrl).pathname;
  } catch (e) {
    // when using with redoc-cli serverUrl can be empty resulting in crash
    return serverUrl;
  }
}

export function titleize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function removeQueryString(serverUrl: string): string {
  try {
    const url = parseURL(serverUrl);
    url.search = "";
    return url.toString();
  } catch (e) {
    // when using with redoc-cli serverUrl can be empty resulting in crash
    return serverUrl;
  }
}

function parseURL(url: string) {
  if (typeof URL === "undefined") {
    // node
    return new (require("url").URL)(url);
  } else {
    return new URL(url);
  }
}

export function escapeHTMLAttrChars(str: string): string {
  return str.replace(/["\\]/g, "\\$&");
}

export function unescapeHTMLChars(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

export function isArray(value: unknown): value is any[] {
  return Array.isArray(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}
