import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const svgPath = path.resolve('public/images/bss-logo.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

async function generate() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });

  const page = await browser.newPage();

  // Create an HTML template that renders the logo crisply on the riso warm background
  const createHtml = (padding = '12%') => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f3ea;
            overflow: hidden;
          }
          .icon-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: ${padding};
            background: #ffffff;
            border-radius: 22%;
            box-shadow: inset 0 0 0 2px #dcd7c5;
          }
          svg {
            width: 100%;
            height: 100%;
            fill: #bf5029;
          }
        </style>
      </head>
      <body>
        <div class="icon-container">
          ${svgContent}
        </div>
      </body>
    </html>
  `;

  const sizes = [
    { name: 'app-icon-192.png', size: 192, padding: '14%' },
    { name: 'app-icon-512.png', size: 512, padding: '14%' },
    { name: 'app-icon-maskable.png', size: 512, padding: '20%' },
    { name: 'apple-touch-icon.png', size: 180, padding: '14%' },
  ];

  for (const item of sizes) {
    await page.setViewportSize({ width: item.size, height: item.size });
    await page.setContent(createHtml(item.padding));
    const outPath = path.resolve(`public/images/${item.name}`);
    await page.screenshot({ path: outPath, omitBackground: false });
    console.log(`Generated: ${outPath} (${item.size}x${item.size})`);
  }

  await browser.close();
}

generate().catch(console.error);
