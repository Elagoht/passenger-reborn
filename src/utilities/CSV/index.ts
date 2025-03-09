import { BadRequestException } from '@nestjs/common';

class CSV {
  private readonly delimiter: string;
  private readonly quote: string;
  private readonly escape: string;
  private readonly lineBreak: string;
  private content: object[] = [];

  public constructor(
    content: string | object[],
    options: Partial<CSVOptions> = {},
  ) {
    this.delimiter = options.delimiter ?? ',';
    this.quote = options.quote ?? '"';
    this.escape = options.escape ?? '\\';

    if (typeof content === 'string') {
      this.lineBreak = options.lineBreak ?? this.detectLineBreak(content);
      this.parseContent(content);
    } else {
      this.lineBreak = options.lineBreak ?? '\n';
      this.content = content;
    }
  }

  public toString(): string {
    if (this.content.length === 0) {
      return '';
    }

    const headers = this.getHeaders();
    const headerLine = this.formatLine(headers);

    const dataLines = this.content.map((row) => {
      const values = headers.map(
        (header) => (row as Record<string, string>)[header] || '',
      );
      return this.formatLine(values);
    });

    return [headerLine, ...dataLines].join(this.lineBreak);
  }

  public getContent(): object[] {
    return this.content;
  }

  public getHeaders(): string[] {
    return this.content.length > 0 ? Object.keys(this.content[0]) : [];
  }

  private detectLineBreak(content: string): string {
    if (content.includes('\r\n')) return '\r\n';
    if (content.includes('\r')) return '\r';
    return '\n';
  }

  private parseContent(content: string) {
    const lines = content.split(this.lineBreak);
    if (lines.length === 0) {
      throw new BadRequestException('Empty CSV file');
    }
    if (lines.length <= 1) {
      throw new BadRequestException('CSV file has no data rows');
    }

    const headers = this.parseLine(lines[0]);
    const data: object[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;

      const values = this.parseLine(line);
      if (values.length > headers.length) {
        throw new BadRequestException(`Too many fields in CSV row ${i + 1}`);
      }

      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = j < values.length ? values[j] : '';
      }
      data.push(row);
    }
    this.content = data;
  }

  private parseLine(line: string): string[] {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = i < line.length - 1 ? line[i + 1] : '';

      if (char === this.escape) {
        if (
          nextChar === this.delimiter ||
          nextChar === this.quote ||
          nextChar === this.escape
        ) {
          currentField += nextChar;
          i++;
          continue;
        }
      }

      if (char === this.quote) {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === this.delimiter && !inQuotes) {
        fields.push(currentField);
        currentField = '';
        continue;
      }

      if (i === line.length - 1 && inQuotes) {
        throw new BadRequestException('Unclosed quote in CSV line');
      }

      currentField += char;
    }

    fields.push(currentField);
    return fields;
  }

  private formatLine(values: string[]): string {
    return values.map((value) => this.formatValue(value)).join(this.delimiter);
  }

  private formatValue(value: string): string {
    // Check if value needs quoting
    const needsQuoting =
      value.includes(this.delimiter) ||
      value.includes(this.quote) ||
      value.includes(this.lineBreak);

    if (!needsQuoting) {
      return value;
    }

    // Escape quotes in the value by doubling them
    const escapedValue = value.replace(
      new RegExp(this.quote, 'g'),
      this.quote + this.quote,
    );

    // Wrap the value in quotes
    return `${this.quote}${escapedValue}${this.quote}`;
  }
}

export default CSV;

type CSVOptions = {
  delimiter?: string;
  quote?: string;
  escape?: string;
  lineBreak?: string;
};
