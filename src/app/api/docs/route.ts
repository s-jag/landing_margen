import { NextResponse } from 'next/server';

/**
 * GET /api/docs
 *
 * Serves Swagger UI for interactive API documentation.
 */
export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Margen API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
  <style>
    html {
      box-sizing: border-box;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      display: none;
    }
    .swagger-ui .info .title {
      font-size: 2rem;
    }
    .header {
      background: #1a1a2e;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header svg {
      width: 28px;
      height: 28px;
    }
    .header h1 {
      margin: 0;
      color: white;
      font-size: 18px;
      font-weight: 500;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .header span {
      color: #888;
      font-size: 14px;
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body>
  <div class="header">
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M2 4h3l5 8 5-8h3v12h-3V8l-5 8-5-8v8H2V4z" fill="white"/>
    </svg>
    <h1>Margen</h1>
    <span>API Documentation</span>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
  `.trim();

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
