import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";
import { Callout, Definition, GoDeeper, Solution } from "@/components/chapter/Blocks";
import { CodeBlock } from "@/components/chapter/CodeBlock";
import { H2, H3 } from "@/components/chapter/Headings";
import { ImageCompare, PixelGrid, Quiz } from "@/components/figures";
import * as Visuals from "@/components/visuals";

// Every chapter can use these without importing them.
const components: MDXComponents = {
  h2: H2,
  h3: H3,
  pre: CodeBlock,
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),
  Definition,
  GoDeeper,
  Solution,
  Callout,
  PixelGrid,
  ImageCompare,
  Quiz,
  ...Visuals,
};

export function useMDXComponents(inherited: MDXComponents = {}): MDXComponents {
  return { ...inherited, ...components };
}
