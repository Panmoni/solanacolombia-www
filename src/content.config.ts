import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    draft: z.boolean(),
    title: z.string(),
    snippet: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    publishDate: z.coerce.date(),
    author: z.string().default("YapBay"),
    category: z.string(),
    tags: z.array(z.string()),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/team" }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    xUrl: z.string().url(),
    xUsername: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    order: z.number().default(0),
  }),
});

const gallery = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/gallery" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    order: z.number().default(0),
  }),
});

export const collections = { blog, team, gallery };