// @ts-check
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  outfile: 'dist/extension.js',
  external: ['vscode'],
  sourcemap: !production,
  minify: production,
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching extension bundle…');
  } else {
    await esbuild.build(buildOptions);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
