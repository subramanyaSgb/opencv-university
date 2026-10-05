"use client";

import { useEffect, useState } from "react";

interface Item {
  id: string;
  text: string;
}

/** "On this page": built from the chapter's h2 headings; highlights the section in view. */
export function TableOfContents() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const heads = Array.from(document.querySelectorAll<HTMLHeadingElement>("article.chapter h2[id]"));
    setItems(heads.map((h) => ({ id: h.id, text: h.textContent ?? "" })));
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    heads.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, []);

  return (
    <ol className="toc-list">
      {items.map((it) => (
        <li key={it.id}>
          <a href={`#${it.id}`} className={active === it.id ? "is-active" : ""}>
            {it.text}
          </a>
        </li>
      ))}
    </ol>
  );
}
