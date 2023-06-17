import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, type PluginOption } from "vite";
import { transform } from "esbuild";


export default defineConfig({
	plugins: [sveltekit()],
	esbuild: {
		minifyWhitespace: true,
		minifyIdentifiers: true,
		minifySyntax: true,
		keepNames: true,
	},
	build: {
		minify: true,


		rollupOptions: { output: { compact: true }, treeshake: "smallest" },
	},
});
