import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const DIR = '/tmp/verify-shots';
mkdirSync(DIR, { recursive: true });

const BASE = 'http://localhost:3000';

async function shot(page, name, url, waitFor) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout: 15000 });
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 8000 }).catch(() => {});
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  console.log(`✓ ${name}`);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

await shot(page, '1-annotate', '/annotate', null);
await shot(page, '2-admin', '/admin', 'table');
await shot(page, '3-dashboard', '/dashboard', null);
await shot(page, '6-admin-new', '/admin/new', 'form');

// Get task IDs
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
const hrefs = await page.$$eval('a[href*="/admin/"]', els =>
  els.map(e => e.getAttribute('href')).filter(h => h && !h.includes('/new'))
);
const taskId = hrefs[0]?.split('/admin/')[1]?.split('?')[0];
console.log('taskId:', taskId);

if (taskId) {
  await shot(page, '4-annotate-task', `/annotate/${taskId}`, null);
  await shot(page, '5-dashboard-task', `/dashboard/${taskId}`, null);
}

// Mobile
const mob = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mob.newPage();
await shot(mp, '7-mobile-annotate', '/annotate', null);
await mob.close();

// Nav close-up
const navEl = await page.goto(`${BASE}/annotate`, { waitUntil: 'networkidle' });
const nav = await page.$('header');
if (nav) { await nav.screenshot({ path: `${DIR}/8-nav.png` }); console.log('✓ 8-nav'); }

await browser.close();
console.log('Done. Shots:', DIR);
