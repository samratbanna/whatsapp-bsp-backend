import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class KnowledgeExtractorService {
  private readonly logger = new Logger(KnowledgeExtractorService.name);

  // ── Text ────────────────────────────────────────────────────────────
  extractText(text: string): string {
    return this.cleanText(text);
  }

  // ── PDF ─────────────────────────────────────────────────────────────
  async extractPdf(buffer: Buffer): Promise<string> {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return this.cleanText(data.text);
  }

  // ── DOCX ─────────────────────────────────────────────────────────────
  async extractDocx(buffer: Buffer): Promise<string> {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return this.cleanText(result.value);
  }

  // ── Excel / CSV ───────────────────────────────────────────────────────
  extractExcel(buffer: Buffer): string {
    const XLSX = require('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const lines: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      lines.push(`--- Sheet: ${sheetName} ---`);
      for (const row of rows) {
        const cells = row.map((c) => String(c ?? '').trim()).filter(Boolean);
        if (cells.length) lines.push(cells.join(' | '));
      }
    }
    return this.cleanText(lines.join('\n'));
  }

  extractCsv(buffer: Buffer): string {
    const XLSX = require('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const lines = rows.map((row) =>
      row.map((c) => String(c ?? '').trim()).join(' | '),
    );
    return this.cleanText(lines.join('\n'));
  }

  // ── PPTX ──────────────────────────────────────────────────────────────
  async extractPptx(buffer: Buffer, filePath: string): Promise<string> {
    const officeParser = require('officeparser');
    return new Promise((resolve, reject) => {
      officeParser.parseOffice(filePath, (data: string, err: any) => {
        if (err) return reject(err);
        resolve(this.cleanText(data));
      });
    });
  }

  // ── Website (single page) ─────────────────────────────────────────────
  async extractWebsite(url: string): Promise<string> {
    const cheerio = require('cheerio');
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)' },
    });
    const $ = cheerio.load(response.data);

    // Remove noise elements
    $('script, style, nav, footer, header, aside, iframe, noscript').remove();

    // Extract meaningful text
    const title = $('title').text().trim();
    const headings = $('h1, h2, h3, h4').map((_: any, el: any) => $(el).text().trim()).get();
    const paragraphs = $('p, li, td, th, article, section').map((_: any, el: any) => $(el).text().trim()).get();

    const parts = [
      title ? `Title: ${title}` : '',
      ...headings.filter(Boolean).map((h: string) => `## ${h}`),
      ...paragraphs.filter((p: string) => p.length > 20),
    ];
    return this.cleanText(parts.join('\n'));
  }

  // ── Website Crawler ───────────────────────────────────────────────────
  async crawlWebsite(
    startUrl: string,
    config: {
      maxPages?: number;
      maxDepth?: number;
      includePaths?: string[];
      excludePaths?: string[];
    },
  ): Promise<{ text: string; crawledUrls: string[]; pageCount: number }> {
    const cheerio = require('cheerio');
    const maxPages = config.maxPages ?? 50;
    const maxDepth = config.maxDepth ?? 3;
    const baseUrl = new URL(startUrl).origin;

    const visited = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
    const allTexts: string[] = [];
    const crawledUrls: string[] = [];

    while (queue.length > 0 && crawledUrls.length < maxPages) {
      const { url, depth } = queue.shift()!;
      if (visited.has(url) || depth > maxDepth) continue;
      visited.add(url);

      // Path filter
      const urlPath = new URL(url).pathname;
      if (config.excludePaths?.some((p) => urlPath.startsWith(p))) continue;
      if (config.includePaths?.length && !config.includePaths.some((p) => urlPath.startsWith(p))) continue;

      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)' },
        });
        const $ = cheerio.load(response.data);
        $('script, style, nav, footer, header, aside, iframe').remove();

        const pageText = this.cleanText($('body').text());
        if (pageText.length > 100) {
          allTexts.push(`--- Page: ${url} ---\n${pageText}`);
          crawledUrls.push(url);
        }

        // Queue same-domain links
        if (depth < maxDepth) {
          $('a[href]').each((_: any, el: any) => {
            try {
              const href = $(el).attr('href') as string;
              const absolute = new URL(href, baseUrl).toString();
              if (absolute.startsWith(baseUrl) && !visited.has(absolute)) {
                queue.push({ url: absolute, depth: depth + 1 });
              }
            } catch {}
          });
        }
      } catch (err: any) {
        this.logger.warn(`Crawler: failed to fetch ${url} — ${err?.message}`);
      }
    }

    return {
      text: allTexts.join('\n\n'),
      crawledUrls,
      pageCount: crawledUrls.length,
    };
  }

  // ── YouTube Transcript ────────────────────────────────────────────────
  async extractYoutube(url: string): Promise<string> {
    const { YoutubeTranscript } = require('youtube-transcript');
    const videoId = this.extractYoutubeId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const text = transcript.map((t: any) => t.text).join(' ');
    return this.cleanText(text);
  }

  // ── Q&A Pairs ─────────────────────────────────────────────────────────
  extractQaPairs(pairs: { question: string; answer: string }[]): string {
    return pairs
      .map((p) => `Q: ${p.question.trim()}\nA: ${p.answer.trim()}`)
      .join('\n\n');
  }

  // ── Rules ─────────────────────────────────────────────────────────────
  extractRules(rules: string[]): string {
    return rules.map((r, i) => `Rule ${i + 1}: ${r.trim()}`).join('\n');
  }

  // ── Product Catalog ───────────────────────────────────────────────────
  extractProductCatalog(
    products: { name: string; price?: string; description?: string; [key: string]: any }[],
  ): string {
    return products
      .map((p) => {
        const fields = Object.entries(p)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => `  ${k}: ${v}`);
        return `Product:\n${fields.join('\n')}`;
      })
      .join('\n\n');
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  getStats(text: string): { wordCount: number; charCount: number } {
    const words = text.split(/\s+/).filter(Boolean);
    return { wordCount: words.length, charCount: text.length };
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ \t]{3,}/g, '  ')    // collapse long spaces
      .replace(/\n{4,}/g, '\n\n\n')   // max 3 consecutive newlines
      .trim();
  }

  private extractYoutubeId(url: string): string | null {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/embed\/([^?]+)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  // Save file to disk, return path
  saveFileToDisk(buffer: Buffer, originalName: string): string {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'knowledge');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const ext = path.extname(originalName);
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
  }
}
