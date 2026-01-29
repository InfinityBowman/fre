Simple demo of hot reload/Hot Module Replacement. What this allows you to do is modify components that are hot reloaded in the browser so your changes are seen instantly while preserving the state of the application. For example if you run this, try increasing the count, then edit something in the counter like the 'Counter" text or any other component and see that that update while preserving the count. If you commented out the "plugins: [freRefresh()]," line in the vite config, it would simply update the UI without preserving state.

To run

```bash
npm i
npm run dev
```

Open http://localhost:3000/
