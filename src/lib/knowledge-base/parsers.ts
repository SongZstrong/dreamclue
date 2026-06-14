import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Parse PDF file
 */
async function parsePDF(filePath: string): Promise<string> {
  try {
    // Use pdf-parse library
    const pdfParse = require('pdf-parse');
    const dataBuffer = await readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error}`);
  }
}

/**
 * Parse TXT file
 */
async function parseTXT(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to parse TXT: ${error}`);
  }
}

/**
 * Parse Markdown file
 */
async function parseMarkdown(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[*_~>-]+/g, ' ')
      .replace(/\|/g, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    throw new Error(`Failed to parse Markdown: ${error}`);
  }
}

/**
 * Parse DOCX file - simple text extraction
 */
async function parseDOCX(filePath: string): Promise<string> {
  try {
    // Read as binary and extract text
    const buffer = await readFile(filePath);

    // DOCX is a ZIP file, try to extract text from XML
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    let text = '';

    // Find document.xml
    for (const entry of zipEntries) {
      if (entry.entryName === 'word/document.xml') {
        const content = entry.getData().toString('utf8');
        // Extract text between <w:t> tags
        const matches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (matches) {
          text = matches
            .map((match: string) => match.replace(/<[^>]*>/g, ''))
            .join(' ');
        }
        break;
      }
    }

    if (!text || text.length < 10) {
      throw new Error('Could not extract text from DOCX');
    }

    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error}`);
  }
}

/**
 * Parse EPUB file
 */
async function parseEPUB(filePath: string): Promise<string> {
  try {
    // EPUB is a ZIP file
    const AdmZip = require('adm-zip');
    const buffer = await readFile(filePath);
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    let text = '';

    // Extract text from HTML/XHTML files
    for (const entry of zipEntries) {
      const name = entry.entryName.toLowerCase();
      if (name.endsWith('.html') || name.endsWith('.xhtml')) {
        const content = entry.getData().toString('utf8');
        // Remove HTML tags
        const cleaned = content
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[^;]+;/g, ' ')
          .replace(/\s+/g, ' ');
        text += cleaned + ' ';
      }
    }

    if (!text || text.length < 10) {
      throw new Error('Could not extract text from EPUB');
    }

    return text.trim();
  } catch (error) {
    throw new Error(`Failed to parse EPUB: ${error}`);
  }
}

/**
 * Parse file based on extension
 */
export async function parseFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  const parsers: Record<string, (path: string) => Promise<string>> = {
    '.pdf': parsePDF,
    '.txt': parseTXT,
    '.md': parseMarkdown,
    '.markdown': parseMarkdown,
    '.docx': parseDOCX,
    '.epub': parseEPUB,
  };

  const parser = parsers[ext];
  if (!parser) {
    throw new Error(`Unsupported file format: ${ext}`);
  }

  const text = await parser(filePath);

  if (!text || text.length < 100) {
    throw new Error('Extracted text is too short (< 100 characters)');
  }

  return text;
}
