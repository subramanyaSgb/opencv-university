import createMDX from "@next/mdx";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Repo root: chapters live in ../../content, outside the app folder.
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const withMDX = createMDX({
  extension: /\.mdx$/,
  options: { remarkPlugins: ["remark-gfm"] },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx"],
  reactStrictMode: true,
  turbopack: { root },
  outputFileTracingRoot: root,
};

export default withMDX(nextConfig);
