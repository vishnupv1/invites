# Vellum

React app for one-time invite templates and shareable invite links. The API is in [invites-be](https://github.com/vishnupv1/invites-be).

```bash
npm install
npm run dev
```

The dev server proxies `/api` and `/media` to `http://127.0.0.1:4010`. Start the API first. Card numbers stay in the browser; the API only records that a template was bought.
