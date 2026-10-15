import react from '@vitejs/plugin-react'
import { defineConfig, type Connect, type Plugin } from 'vite'
import redirects from './src/data/redirects.json' with { type: 'json' }

function seoRedirects(): Plugin {
  const map = redirects as Record<string, string>
  const apply: Connect.NextHandleFunction = (req, res, next) => {
    const [path, query] = (req.url ?? '').split('?')
    const bare = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
    const dest = map[bare] ?? (bare.startsWith('/c/') ? '/occasions' : undefined)
    if (bare.startsWith('/template/') && query) {
      const params = new URLSearchParams(query)
      if (params.has('event')) {
        params.delete('event')
        const rest = params.toString()
        res.writeHead(301, { Location: rest ? `${bare}?${rest}` : bare })
        res.end()
        return
      }
    }
    if (!dest || dest === bare) {
      next()
      return
    }
    const location = query ? `${dest}?${query}` : dest
    res.writeHead(301, { Location: location })
    res.end()
  }
  return {
    name: 'seo-redirects',
    configureServer(server) {
      server.middlewares.use(apply)
    },
    configurePreviewServer(server) {
      server.middlewares.use(apply)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [seoRedirects(), react()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:4010",
      "/media": "http://127.0.0.1:4010",
    },
  },
})
