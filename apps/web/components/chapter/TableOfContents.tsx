"use client";

import { useEffect, useState } from "react";

interface Item {
  id: string;
  text: string;
  numbered: boolean;
}

const COLLAPSE_THRESHOLD = 8;

/** "On this page": grouped Concepts / Practice, highlights the section in view, collapses long concept lists to the current one. */
export function TableOfContents() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string>("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const heads = Array.from(document.querySelectorAll<HTMLHeadingElement>("article.chapter h2[id]"));
    setItems(
      heads.map((h) => ({ id: h.id, text: h.textContent ?? "", numbered: /^\d+\.\s/.test(h.textContent ?? "") })),
    );
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

  const concepts = items.filter((it) => it.numbered);
  const practice = items.filter((it) => !it.numbered);
  const activeIndex = concepts.findIndex((it) => it.id === active);
  const collapse = concepts.length > COLLAPSE_THRESHOLD && !showAll;
  const visibleConcepts = collapse
    ? concepts.filter((_, i) => Math.abs(i - Math.max(activeIndex, 0)) <= 1)
    : concepts;

  const row = (it: Item) => (
    <li key={it.id}>
      <a href={`#${it.id}`} className={active === it.id ? "is-active" : ""} title={it.text}>
        {it.text}
      </a>
    </li>
  );

  return (
    <div className="toc">
      {concepts.length > 0 && (
        <div className="toc-group">
          <div className="toc-group-head">
            <span className="toc-group-title">Concepts</span>
            {concepts.length > COLLAPSE_THRESHOLD && (
              <button type="button" className="toc-toggle" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Collapse" : "Show all"}
              </button>
            )}
          </div>
          <ol className="toc-list">{visibleConcepts.map(row)}</ol>
        </div>
      )}
      {practice.length > 0 && (
        <div className="toc-group">
          <div className="toc-group-title">Practice</div>
          <ol className="toc-list">{practice.map(row)}</ol>
        </div>
      )}
    </div>
  );
}
