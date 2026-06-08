const ROUTES = {
  '/xsdexplorer': 'https://xsdplore.vercel.app',
  '/vingen':     'https://vin-gen.pages.dev',
  '/vin':        'https://vin-generator.georgy-dobrev.workers.dev',
};

const HUB = `<!doctype html>
<html><head><title>Tools</title></head>
<body>
  <h1>Tools</h1>
  <ul>
    <li><a href="/xsdexplorer">XSD Explorer</a></li>
    <li><a href="/vingen">VIN Generator</a></li>
    <li><a href="/vin/docs">VIN API</a></li>
  </ul>
</body></html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const prefix = '/' + url.pathname.split('/')[1];
    const backend = ROUTES[prefix];

    if (!backend) {
      return new Response(HUB, { headers: { 'Content-Type': 'text/html' } });
    }

    const target = new URL(request.url);
    target.hostname = new URL(backend).hostname;

    return fetch(new Request(target, request));
  }
};
