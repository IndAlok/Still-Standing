import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

class ResumeParserService {
  async extractTextFromPdf(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const textParts = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        textParts.push(pageText);
      }
      
      const extractedText = textParts.join('\n\n').trim();
      
      if (extractedText.length > 50) {
        return extractedText;
      }
      
      return this.extractTextFallback(file);
    } catch (error) {
      return this.extractTextFallback(file);
    }
  }

  async extractTextFromDocx(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const str = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      
      if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
        const textRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
        const matches = [];
        let match;
        while ((match = textRegex.exec(str)) !== null) {
          matches.push(match[1]);
        }
        if (matches.length > 0) {
          return matches.join(' ').replace(/\s+/g, ' ').trim();
        }
      }
      
      return this.extractPrintableText(bytes);
    } catch (error) {
      return this.extractTextFallback(file);
    }
  }

  extractPrintableText(bytes) {
    let text = '';
    let buffer = '';
    
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 32 && bytes[i] <= 126) {
        buffer += String.fromCharCode(bytes[i]);
      } else if (bytes[i] === 10 || bytes[i] === 13) {
        if (buffer.length >= 3) text += buffer + ' ';
        buffer = '';
      } else {
        if (buffer.length >= 3) text += buffer + ' ';
        buffer = '';
      }
    }
    
    return text.replace(/\s+/g, ' ').trim();
  }

  async extractTextFallback(file) {
    try {
      const text = await file.text();
      return text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
    } catch {
      return '';
    }
  }

  async extractText(file) {
    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await file.text();
    }
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await this.extractTextFromPdf(file);
    }
    
    if (fileType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return await this.extractTextFromDocx(file);
    }
    
    return await this.extractTextFallback(file);
  }
}

export const resumeParserService = new ResumeParserService();
export default resumeParserService;
