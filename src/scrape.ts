import axios from "axios";
import * as Cheerio from "cheerio";
import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from "node-html-markdown";
import puppeteer, { Browser } from 'puppeteer';

export const getContent = createContentGetterWithCache();

export async function getLinksToScrape(startingUrl: string): Promise<{
  links: string[];
}> {
  const startingUrlOrigin = new URL(startingUrl).origin;
  const links: Set<string> = new Set([startingUrl]);
  const { data } = await axios.get(startingUrl);
  const $ = Cheerio.load(data);
  $("a").each((_, element) => {
    const href = $(element).attr("href");
    if (href) {
      const url = new URL(href, startingUrl);
      if (isFile(url)) {
        return;
      }
      if (url.origin === startingUrlOrigin) {
        links.add(cleanUrl(url.href));
      }
    }
  });
  return {
    links: Array.from(links),
  };
}

function cleanUrl(url: string) {
  const urlObject = new URL(url);
  urlObject.hash = "";
  return urlObject.href;
}

function isFile(url: URL): boolean {
  const pathname = url.pathname;
  const lastSegment = pathname.split("/").pop();
  if (!lastSegment) {
    return false;
  }
  const lastSegmentParts = lastSegment.split(".");
  if (lastSegmentParts.length < 2) {
    return false;
  }
  const extension = lastSegmentParts.pop();
  if (!extension) {
    return false;
  }
  return true;
}

function createContentGetterWithCache() {
  const cache = new Map<
    string,
    {
      title: string;
      content: string;
      markdownContent: string;
    }
  >();
  return async function getContent(
    url: string,
    contentSelector?: string
  ): Promise<{
    title: string;
    content: string;
    markdownContent: string;
  }> {
    const selector = contentSelector || "body";
    const key = `${url}::${selector}`;
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    try {
      // Primero intentamos con axios
      const result = await scrapeUrl(url, selector);
      
      // Detectar si es una página que requiere JavaScript
      const needsJavaScript = 
        result.content.length === 0 || 
        result.content.includes('You need to enable JavaScript') ||
        result.content.includes('noscript') ||
        (result.markdownContent.length < 200 && result.markdownContent.includes('id="root"'));
      
      if (!needsJavaScript) {
        console.log('[Scraping] Successfully scraped with axios');
        cache.set(key, result);
        return result;
      }
      
      // Si necesita JavaScript, usamos Puppeteer
      console.log(`[Scraping] Page requires JavaScript, trying with Puppeteer for: ${url}`);
      const puppeteerResult = await scrapeUrlWithPuppeteer(url, selector);
      cache.set(key, puppeteerResult);
      return puppeteerResult;
    } catch (error) {
      console.error(`[Scraping] Error scraping ${url}:`, error);
      throw error;
    }
  };
}

async function scrapeUrl(
  url: string,
  contentSelector: string = "body"
): Promise<{
  title: string;
  content: string;
  markdownContent: string;
}> {
  console.log(`[Scraping Debug] Attempting to fetch URL: ${url}`);
  console.log(`[Scraping Debug] Using selector: ${contentSelector}`);
  
  const { data } = await axios.get(url);
  console.log(`[Scraping Debug] Successfully fetched page HTML. Length: ${data.length} chars`);
  
  const $ = Cheerio.load(data);
  const title = $("title").text();
  const selectedContent = $(contentSelector);
  
  console.log(`[Scraping Debug] Selected content found: ${selectedContent.length > 0}`);
  console.log(`[Scraping Debug] Selected content HTML length: ${selectedContent.html()?.length || 0}`);
  
  const content = selectedContent.text();
  const htmlContent = selectedContent.html();
  
  console.log(`[Scraping Debug] Final content length: ${content.length}`);
  console.log(`[Scraping Debug] HTML content preview: ${htmlContent?.substring(0, 200)}...`);

  return {
    title,
    content: content,
    markdownContent: htmlToMarkdown(htmlContent),
  };
}

async function scrapeUrlWithPuppeteer(
  url: string,
  contentSelector: string = "body"
): Promise<{
  title: string;
  content: string;
  markdownContent: string;
}> {
  console.log(`[Scraping Debug] Starting Puppeteer for URL: ${url}`);
  let browser: Browser | undefined;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1920x1080'
      ]
    });

    const page = await browser.newPage();
    
    // Solo ignoramos recursos no esenciales, mantenemos imágenes
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Esperar a que el contenido de React se cargue
    try {
      // Primero intentamos esperar el contenido de React
      await page.waitForSelector('#root > *', { timeout: 5000 });
      console.log('[Scraping Debug] React content loaded');
    } catch (e) {
      // Si no es una app React, esperamos el selector proporcionado
      try {
        await page.waitForSelector(contentSelector, { timeout: 5000 });
        console.log('[Scraping Debug] Content selector found');
      } catch (e) {
        console.log('[Scraping Debug] No specific content found, proceeding with current page state');
      }
    }

    // Intentar obtener el contenido con el selector proporcionado
    const result = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return { title: document.title, content: '', html: '' };

      // Asegurarnos de que las imágenes tengan atributos completos
      const images = element.getElementsByTagName('img');
      Array.from(images).forEach((img: HTMLImageElement) => {
        if (img.src) {
          img.setAttribute('src', img.src); // Esto convierte URLs relativas en absolutas
        }
        if (!img.alt) img.alt = ''; // Asegurarnos de que alt siempre exista
      });

      return {
        title: document.title,
        content: element.textContent || '',
        html: element.innerHTML
      };
    }, contentSelector);

    console.log(`[Scraping Debug] Puppeteer content length: ${result.content.length}`);

    if (result.content.length === 0) {
      console.log('[Scraping Debug] No content found with provided selector, trying body');
      // Si no encontramos contenido con el selector proporcionado, intentamos con body
      const bodyResult = await page.evaluate(() => {
        const body = document.body;
        return {
          title: document.title,
          content: body.textContent || '',
          html: body.innerHTML
        };
      });
      
      return {
        title: bodyResult.title,
        content: bodyResult.content,
        markdownContent: htmlToMarkdown(bodyResult.html)
      };
    }

    return {
      title: result.title,
      content: result.content,
      markdownContent: htmlToMarkdown(result.html)
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

const nhm = new NodeHtmlMarkdown({
  maxConsecutiveNewlines: 2,
});

function htmlToMarkdown(html: string | null): string {
  if (!html) {
    return "";
  }
  return nhm.translate(html);
}
