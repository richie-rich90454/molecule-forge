import { defineConfig } from "vitepress";

export default defineConfig({
    title: "Molecule Forge",
    description:
        "A self-contained chemistry sandbox. Spawn real molecules, change conditions, watch reactions.",
    base: "./",
    appearance: "force-dark",
    themeConfig: {
        nav: [
            { text: "Guide", link: "/guide" },
            { text: "Chemistry", link: "/chemistry" },
            { text: "Physics", link: "/physics" },
            { text: "Reactions", link: "/reactions" },
            { text: "Molecules", link: "/molecules" },
        ],
        sidebar: [
            {
                text: "Start here",
                items: [
                    { text: "Molecule Forge", link: "/" },
                    { text: "Playing guide", link: "/guide" },
                    { text: "Troubleshooting", link: "/troubleshooting" },
                ],
            },
            {
                text: "Science",
                items: [
                    { text: "Chemistry layer", link: "/chemistry" },
                    { text: "Physics layer", link: "/physics" },
                    { text: "Reaction rules", link: "/reactions" },
                    { text: "Preset scenarios", link: "/presets" },
                    { text: "Molecule library", link: "/molecules" },
                    { text: "Validation", link: "/validation" },
                ],
            },
            {
                text: "Engineering",
                items: [
                    { text: "Architecture", link: "/architecture" },
                    { text: "Rendering", link: "/rendering" },
                    { text: "Contributing", link: "/contributing" },
                    { text: "Commits", link: "/commits" },
                ],
            },
        ],
        outline: "deep",
    },
});
