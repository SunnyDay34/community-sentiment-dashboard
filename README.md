# Community Sentiment Dashboard

A ready-to-deploy React dashboard with a retro phosphor terminal look. It connects to the supplied Railway sentiment, keyword-spikes, and chat webhooks by default.

## Simplest way to preview

1. Install [Node.js](https://nodejs.org/) if it is not already on your computer.
2. Open Terminal (Mac) or Command Prompt (Windows).
3. Move into this folder. If you downloaded the project to Downloads, type `cd ` (include the space), drag the project folder into the Terminal window, then press Enter.
4. Run `npm install` and wait for it to finish.
5. Run `npm run dev`.
6. Open the local address printed in Terminal, usually `http://localhost:5173`.

## Connect your webhook endpoints

The three Railway webhook URLs are already configured in the app. If you need to replace them, create a `.env` file using `.env.example` as a guide, edit the URLs, and restart `npm run dev`.

For a local preview, copy `.env.example` to a new file named `.env` and replace each placeholder URL. Restart `npm run dev` after saving.

For Vercel, you can connect this folder as a new project from the Vercel dashboard:

1. Put this project in a GitHub repository (Vercel can import a repository). The dashboard can also deploy from a local folder using the Vercel CLI.
2. Choose **Add New → Project**, import the repository, and leave the detected Vite build settings as they are. The build command is `npm run build`; the output directory is `dist`.
3. The configured endpoint defaults are included in the app. If you want to override them in Vercel, open **Environment Variables** and add:
   - `VITE_CORE_WEBHOOK`
   - `VITE_CHAT_WEBHOOK`
   - `VITE_SPIKES_WEBHOOK`
4. Save, then redeploy so the new values are included in the site.

The webhooks must accept browser requests from your deployed site and return the `Access-Control-Allow-Origin` CORS header for its domain. If you see `Failed to fetch`, ask your workflow owner to enable CORS for your Vercel domain. The endpoint URLs are included in browser code, so use public read-only dashboard endpoints; do not put private API keys in `VITE_` variables.

## What is included

- Sentiment gauge and positive / neutral / negative breakdown
- Previous-week and last-week keyword chart
- Natural-language chat with conversation history
- Individual refresh controls, loading feedback, and readable connection errors
- Mobile-friendly layout

The three live endpoints use POST with JSON and a 10-minute request timeout. The sentiment panel displays the score, label, and raw positive, neutral, negative, and total comment counts. The spikes chart displays every keyword row returned by the webhook. The webhook must allow your deployed Vercel domain through CORS; localhost is already permitted by the current endpoint configuration.
