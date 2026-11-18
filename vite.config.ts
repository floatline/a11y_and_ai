import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// dist/index.html must also open straight from disk (file://). Chrome blocks module scripts and
// crossorigin stylesheets there (origin "null"), so the built JS and CSS are inlined into the page.
// shortcut: assumes a single JS chunk and CSS without url() to files; split chunks would need a real bundler plugin.
const inlineAssets = (): Plugin => ({
  name: 'inline-assets',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const page = bundle['index.html']
    if (page?.type !== 'asset') return
    const take = (path: string) => {
      const fileName = path.replace(/^\.?\//, '')
      const file = bundle[fileName]
      delete bundle[fileName]
      return file?.type === 'chunk' ? file.code : String(file?.source ?? '')
    }
    page.source = String(page.source)
      // replacer functions: the code contains `$` sequences that a replacement string would expand
      .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/, (_tag, src: string) =>
        `<script type="module">${take(src).replace(/<\/script/gi, '<\\/script')}</script>`)
      .replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/, (_tag, href: string) => `<style>${take(href)}</style>`)
  },
})

// https://vite.dev/config/
export default defineConfig({
  // relative paths, so the build works from file:// and from any subfolder on a host
  base: './',
  plugins: [react(), inlineAssets()],
})
