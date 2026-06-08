const HUB = `<!doctype html>
<html><head><title>Tools</title></head>
<body>
  <h1>Tools</h1>
  <ul>
    <li><a href="/xsdexplorer">XSD Explorer</a></li>
    <li><a href="/vingen">VIN Generator</a></li>
    <li><a href="/vingen/vin/docs">VIN API</a></li>
  </ul>
</body></html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // /vingen/vin/* → VIN API worker (strip /vingen prefix)
    if (path === '/vingen/vin' || path.startsWith('/vingen/vin/')) {
      const target = new URL(request.url);
      target.hostname = 'vin-generator.georgy-dobrev.workers.dev';
      target.pathname = path.slice('/vingen'.length); // /vingen/vin/WBA → /vin/WBA
      return fetch(new Request(target, request));
    }

    // /vingen/* → VIN Generator frontend
    if (path === '/vingen' || path.startsWith('/vingen/')) {
      const target = new URL(request.url);
      target.hostname = 'vin-gen.pages.dev';
      return fetch(new Request(target, request));
    }

    // /xsdexplorer/* → XSD Explorer
    if (path === '/xsdexplorer' || path.startsWith('/xsdexplorer/')) {
      const target = new URL(request.url);
      target.hostname = 'xsdplore.vercel.app';
      return fetch(new Request(target, request));
    }

    return new Response(HUB, { headers: { 'Content-Type': 'text/html' } });
  }
};
