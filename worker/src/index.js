const VALID_CHARS = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ';

const TRANSLIT = {
  '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
  'A':1,'B':2,'C':3,'D':4,'E':5,'F':6,'G':7,'H':8,
  'J':1,'K':2,'L':3,'M':4,'N':5,
  'P':7,'R':9,
  'S':2,'T':3,'U':4,'V':5,'W':6,'X':7,'Y':8,'Z':9,
};

const WEIGHTS = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];

function randomChar() {
  return VALID_CHARS[Math.floor(Math.random() * VALID_CHARS.length)];
}

function computeCheckDigit(vin17) {
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += (TRANSLIT[vin17[i]] ?? 0) * WEIGHTS[i];
  const r = sum % 11;
  return r === 10 ? 'X' : String(r);
}

function generateVin(prefix = '') {
  const wmiPrefix = prefix.toUpperCase().replace(/[^0-9A-HJ-NPR-Z]/g, '').slice(0, 3);
  let wmi = wmiPrefix;
  while (wmi.length < 3) wmi += randomChar();

  let vds = '';
  for (let i = 0; i < 5; i++) vds += randomChar();

  const modelYears = 'ABCDEFGHJKLMNPRSTVWXY123456789';
  const my = modelYears[Math.floor(Math.random() * modelYears.length)];

  let vis = '';
  for (let i = 0; i < 6; i++) vis += randomChar();

  const draft = wmi + vds + '0' + my + vis;
  const checkDigit = computeCheckDigit(draft);
  const vin = wmi + vds + checkDigit + my + vis;

  return { vin, wmi, check_digit: checkDigit };
}

// ── OpenAPI spec ──────────────────────────────────────────────────────────────

function getSpec(baseUrl) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'VIN Generator API',
      description:
        'Generates NHTSA/ISO 3779-compliant 17-digit Vehicle Identification Numbers ' +
        'with a valid check digit (position 9).\n\n' +
        'Valid VIN characters are `0–9` and `A–Z` excluding `I`, `O`, `Q`.',
      version: '1.0.0',
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/vin': {
        get: {
          summary: 'Generate a random VIN',
          description: 'Returns a fully random, check-digit-valid 17-character VIN.',
          operationId: 'getVin',
          tags: ['VIN'],
          responses: {
            '200': {
              description: 'Generated VIN',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/VinResponse' } } },
            },
          },
        },
      },
      '/vin/{prefix}': {
        get: {
          summary: 'Generate a VIN with a WMI prefix',
          description:
            'Returns a check-digit-valid VIN whose first 1–3 characters match the given prefix. ' +
            'Remaining WMI characters are filled randomly. ' +
            'Characters not valid in a VIN (`I`, `O`, `Q`, symbols) are ignored.',
          operationId: 'getVinWithPrefix',
          tags: ['VIN'],
          parameters: [
            {
              name: 'prefix',
              in: 'path',
              required: true,
              description: '1–3 character WMI prefix (valid VIN chars: `0–9`, `A–H`, `J–N`, `P–R`, `S–Z`)',
              schema: { type: 'string', pattern: '^[0-9A-HJ-NPR-Z]{1,3}$', minLength: 1, maxLength: 3 },
              examples: {
                bmw:     { summary: 'BMW (Germany)',    value: 'WBA' },
                tesla:   { summary: 'Tesla (US)',       value: '5YJ' },
                toyota:  { summary: 'Toyota (Japan)',   value: 'JT2' },
                partial: { summary: '2-char prefix',   value: 'WB'  },
                single:  { summary: '1-char prefix',   value: 'W'   },
              },
            },
          ],
          responses: {
            '200': {
              description: 'Generated VIN with the requested prefix',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/VinResponse' } } },
            },
            '404': {
              description: 'Path does not match `/vin/<1–3 chars>`',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { error: 'Not found. Use /vin or /vin/<1-3 chars>' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        VinResponse: {
          type: 'object',
          required: ['vin', 'wmi', 'check_digit'],
          properties: {
            vin:         { type: 'string', description: 'Full 17-character VIN',          example: 'WBA3A9C54FF800001' },
            wmi:         { type: 'string', description: 'World Manufacturer Identifier (positions 1–3)', example: 'WBA' },
            check_digit: { type: 'string', description: 'Check digit (position 9, 0–9 or X)',           example: '4'   },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['error'],
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  };
}

// ── Swagger UI HTML ───────────────────────────────────────────────────────────

function swaggerHtml(specUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>VIN Generator API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
  <style>
    body { margin: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '${specUrl}',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      tryItOutEnabled: true,
      deepLinking: true,
    });
  </script>
</body>
</html>`;
}

// ── Router ────────────────────────────────────────────────────────────────────

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const baseUrl = url.origin;

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const path = url.pathname.replace(/\/$/, '') || '/';

    if (path === '/' || path === '/docs') {
      return new Response(swaggerHtml(`${baseUrl}/openapi.json`), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }

    if (path === '/openapi.json') {
      return new Response(JSON.stringify(getSpec(baseUrl), null, 2), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (path === '/vin') {
      return new Response(JSON.stringify(generateVin()), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const match = path.match(/^\/vin\/([0-9A-HJ-NPRa-hj-npr-z]{1,3})$/i);
    if (match) {
      return new Response(JSON.stringify(generateVin(match[1])), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Not found. Use /vin or /vin/<1-3 chars>' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  },
};
