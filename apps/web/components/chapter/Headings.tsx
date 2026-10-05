import type { ComponentPropsWithoutRef } from "react";
import { slugify, textOf } from "@/lib/slug";

export function H2(props: ComponentPropsWithoutRef<"h2">) {
  const id = slugify(textOf(props.children));
  return (
    <h2 id={id} {...props}>
      <a href={`#${id}`} className="anchor">
        {props.children}
      </a>
    </h2>
  );
}

export function H3(props: ComponentPropsWithoutRef<"h3">) {
  return <h3 id={slugify(textOf(props.children))} {...props} />;
}
