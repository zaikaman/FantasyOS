/**
 * Vite plugin for Tavily API proxy
 */
import { loadEnv } from 'vite';

export function tavilyProxyPlugin() {
  let tavilyApiKey;
  
  return {
    name: 'tavily-proxy',
    configResolved(config) {
      // Load environment variables
      const env = loadEnv(config.mode, process.cwd(), '');
      tavilyApiKey = env.VITE_TAVILY_API_KEY; // Note: using VITE_ prefix
      console.log('[Tavily Plugin] API Key loaded:', !!tavilyApiKey);
    },
    configureServer(server) {
      server.middlewares.use('/api/tavily-proxy', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const { query, search_depth = 'advanced', max_results = 8, include_raw_content = false } = JSON.parse(body);
            
            console.log('[Tavily Proxy] Query:', query);
            console.log('[Tavily Proxy] API Key exists:', !!tavilyApiKey);

            const response = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                api_key: tavilyApiKey,
                query,
                search_depth,
                max_results,
                include_answer: true,
                include_raw_content
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('[Tavily Proxy] API Error:', response.status, errorText);
              throw new Error(`Tavily API returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('[Tavily Proxy] Response:', JSON.stringify(data).substring(0, 200));
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify(data));
          } catch (error) {
            console.error('[Tavily Proxy] Error:', error);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });
    }
  };
}
