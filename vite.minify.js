import { build } from "esbuild";
import { readdirSync } from "fs";

(async () => {
    const files = readdirSync('./dist', {withFileTypes: true}).filter((file) => {
		return file.name.includes('.js');
	});

	for (const file of files) {
		console.log(file);
	}
    	await build({entryPoints: files.map((file) => `./dist/${file.name}`),format:'esm',outdir:'dist',allowOverwrite: true,
						minify: true,
						treeShaking: true,
						minifySyntax: true,
						keepNames: true,
						minifyIdentifiers: true,
						minifyWhitespace: true,
					})
})()