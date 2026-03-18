declare module 'pdf-poppler' {
  export function convert(
    pdfPath: string,
    options: {
      format?: string;
      keepLayout?: boolean;
    }
  ): Promise<Buffer>;
}
