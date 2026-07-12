import { Injectable } from '@nestjs/common';

export interface TextChunk {
  content: string;
  tokenCount: number;
  chunkIndex: number;
}

@Injectable()
export class TextChunkerService {
  // ~4 chars per token (rough but dependency-free)
  private readonly CHARS_PER_TOKEN = 4;
  private readonly TARGET_TOKENS = 500;
  private readonly OVERLAP_TOKENS = 50;

  chunk(text: string): TextChunk[] {
    if (!text?.trim()) return [];

    const targetChars = this.TARGET_TOKENS * this.CHARS_PER_TOKEN;
    const overlapChars = this.OVERLAP_TOKENS * this.CHARS_PER_TOKEN;

    // Split into paragraphs first, then reassemble into target-sized chunks
    const paragraphs = this.splitIntoParagraphs(text);
    const chunks: TextChunk[] = [];
    let buffer = '';
    let bufferStart = 0; // char position in `text` where buffer starts

    const flush = (overlap: string) => {
      const trimmed = buffer.trim();
      if (trimmed.length < 50) return; // skip tiny fragments
      chunks.push({
        content: trimmed,
        tokenCount: Math.ceil(trimmed.length / this.CHARS_PER_TOKEN),
        chunkIndex: chunks.length,
      });
      buffer = overlap;
    };

    for (const para of paragraphs) {
      const candidate = buffer ? `${buffer}\n\n${para}` : para;

      if (candidate.length > targetChars && buffer.length > 0) {
        // Current buffer is big enough — flush it and start new with overlap
        const overlap = this.buildOverlap(buffer, overlapChars);
        flush(overlap);
        buffer = para;
      } else {
        buffer = candidate;
      }

      // If a single paragraph is already too long, hard-split it
      if (buffer.length > targetChars * 1.5) {
        const subs = this.hardSplit(buffer, targetChars, overlapChars);
        for (let i = 0; i < subs.length - 1; i++) {
          chunks.push({
            content: subs[i].trim(),
            tokenCount: Math.ceil(subs[i].length / this.CHARS_PER_TOKEN),
            chunkIndex: chunks.length,
          });
        }
        buffer = subs[subs.length - 1];
      }
    }

    if (buffer.trim().length > 50) flush('');

    // Re-index
    return chunks.map((c, i) => ({ ...c, chunkIndex: i }));
  }

  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  private buildOverlap(text: string, overlapChars: number): string {
    if (text.length <= overlapChars) return text;
    // Try to cut at a sentence boundary within the overlap window
    const tail = text.slice(text.length - overlapChars);
    const sentenceBreak = tail.search(/[.!?]\s/);
    return sentenceBreak !== -1 ? tail.slice(sentenceBreak + 2) : tail;
  }

  private hardSplit(text: string, targetChars: number, overlapChars: number): string[] {
    const parts: string[] = [];
    let start = 0;
    while (start < text.length) {
      let end = start + targetChars;
      if (end < text.length) {
        // prefer breaking at a word boundary
        const spaceIdx = text.lastIndexOf(' ', end);
        if (spaceIdx > start) end = spaceIdx;
      }
      parts.push(text.slice(start, end));
      start = end - overlapChars;
      if (start < 0) start = 0;
    }
    return parts;
  }
}
