export interface ParsedFile {
  text: string
  pages: number
}

export async function extractText(file: File): Promise<ParsedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'txt' || ext === 'md') {
    const text = await file.text()
    return { text, pages: Math.max(1, Math.ceil(text.length / 3000)) }
  }

  if (ext === 'pdf') {
    return extractPdf(file)
  }

  if (ext === 'docx') {
    return extractDocx(file)
  }

  // Fallback: try reading as plain text
  const text = await file.text()
  return { text, pages: 1 }
}

async function extractPdf(file: File): Promise<ParsedFile> {
  const pdfjsLib = await import('pdfjs-dist')
  // Use CDN worker matching the installed version
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const parts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .filter((item) => 'str' in item)
      .map((item) => (item as { str: string }).str)
      .join(' ')
    parts.push(pageText)
  }

  return { text: parts.join('\n\n'), pages: pdf.numPages }
}

async function extractDocx(file: File): Promise<ParsedFile> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = result.value
  return { text, pages: Math.max(1, Math.ceil(text.length / 3000)) }
}
