import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only plugin: runs the Vercel serverless handler in-process so that
// `npm run dev` serves /api/generate-case on the same port as the frontend.
// In production, Vercel runs api/generate-case.js directly and this is ignored.
function devApi() {
  return {
    name: 'dev-api',
    async configureServer(server) {
      // Vite doesn't put non-VITE_ vars in process.env — load them so the
      // handler can read OPENROUTER_API_KEY / OPENROUTER_MODEL. Set them before
      // importing the handler (its module-level MODEL reads process.env).
      const env = loadEnv(server.config.mode, process.cwd(), '')
      process.env.OPENROUTER_API_KEY ??= env.OPENROUTER_API_KEY
      process.env.OPENROUTER_MODEL ??= env.OPENROUTER_MODEL

      const { default: handler } = await import('./api/generate-case.js')

      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0]
        if (pathname !== '/api/generate-case') return next()

        // Collect the raw body — the handler parses it (string branch).
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        req.body = Buffer.concat(chunks).toString('utf8')

        // Shim the Express-style helpers the handler uses on `res`.
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(obj))
          return res
        }

        try {
          await handler(req, res)
        } catch (err) {
          console.error('dev /api/generate-case failed', err)
          res.status(500).json({ error: 'Dev handler crashed' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApi()],
})
