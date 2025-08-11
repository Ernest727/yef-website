# YEF Chat Integration (Branded + Debug)
- Adds in-site chat panel (no WhatsApp) that streams from `/.netlify/functions/chat`.
- Branded header and favicon using `assets/images/yef-logo.png`.
- Frontend: `assets/js/chat.js` (vanilla JS, streaming, typing indicator, Enter-to-send).
- Backend: `netlify/functions/chat.js` (logs: key presence, payload, stream size).

## Deploy
1. Netlify → Site configuration → Environment variables → add `OPENAI_API_KEY`.
2. Deploy this zip (Deploys → Manual deploys).
3. Test chat; if issues, open Functions → chat → Logs. You should see:
   - `API Key Loaded? true`
   - `payload length ok? true messages: N`
