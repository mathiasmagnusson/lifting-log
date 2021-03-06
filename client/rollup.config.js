import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
// import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";
import typescript from "@rollup/plugin-typescript";

const dev = !process.env.PRODUCTION;

export default {
	input: "src/main.ts",
	output: {
		sourcemap: true,
		format: "iife",
		name: "app",
		file: "public/build/bundle.js"
	},
	plugins: [
		svelte({
			// enable run-time checks when not in production
			dev,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			css: css => {
				css.write("public/build/bundle.css");
			},
			preprocess: sveltePreprocess(),
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ["svelte"]
		}),
		commonjs(),
		typescript({ sourceMap: dev }),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		// dev && livereload("public"),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		!dev && terser()
	],
	watch: {
		clearScreen: false
	}
};
