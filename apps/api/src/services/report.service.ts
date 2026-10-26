// src/services/report.service.ts
// Generates the versioned Site Visit & Design Brief report as DOCX + PDF.
//
// SAFETY RULES ENFORCED IN THE DOCUMENT:
//   - sun path is labelled "computed / informational"
//   - wind is labelled "observed"
//   - terrain / soil / drainage are labelled "preliminary"
//   - sketches are labelled "Preliminary field sketch - not a cadastral survey"
//   - officerRecommendations and internal officer notes are NEVER included
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import PDFDocument from 'pdfkit';

export interface ReportSource {
  projectReference: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  siteCounty: string;
  siteSubCounty?: string | null;
  siteArea: string;
  siteDirections?: string | null;
  projectType?: string | null;
  visitDate: Date;
  officerName: string;
  surveyVersion: number;
  reportVersion: number;
  generatedAt: Date;
  sections: {
    a: unknown;
    b: unknown;
    c: unknown;
    d: unknown;
    e: unknown;
    f: unknown;
    g: unknown;
  };
  media: Array<{
    caption?: string | null;
    category: string;
    kind: string;
    checksum: string;
  }>;
}

interface Line {
  label: string;
  value: string;
}

const NOT_AVAILABLE = 'Not available';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describe(value: unknown): string {
  if (value === null || value === undefined || value === '') return NOT_AVAILABLE;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.length === 0 ? NOT_AVAILABLE : value.map((item) => describe(item)).join('; ');
  }
  if (isRecord(value)) {
    if (value['notAvailable'] === true) {
      return `Not available — ${describe(value['reason'])}`;
    }
    return Object.entries(value)
      .filter(([key]) => key !== 'schemaVersion' && key !== 'label')
      .map(([key, item]) => `${humanize(key)}: ${describe(item)}`)
      .join('; ');
  }
  return String(value);
}

function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function readSection(record: unknown, key: string): unknown {
  return isRecord(record) ? record[key] : undefined;
}

export function buildReportLines(source: ReportSource): Array<{ heading: string; lines: Line[] }> {
  const { sections } = source;
  const b = sections.b;
  const c = sections.c;
  const f = sections.f;

  return [
    {
      heading: '1. Visit and project identity',
      lines: [
        { label: 'Project reference', value: source.projectReference },
        { label: 'Client', value: source.clientName },
        { label: 'Telephone', value: source.clientPhone },
        { label: 'Email', value: source.clientEmail ?? NOT_AVAILABLE },
        { label: 'County', value: source.siteCounty },
        { label: 'Sub-county', value: source.siteSubCounty ?? NOT_AVAILABLE },
        { label: 'Area / locality', value: source.siteArea },
        { label: 'Directions', value: source.siteDirections ?? NOT_AVAILABLE },
        {
          label: 'Visit date',
          value: source.visitDate.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }),
        },
        { label: 'Visiting officer', value: source.officerName },
        { label: 'Development type', value: source.projectType ?? NOT_AVAILABLE },
      ],
    },
    {
      heading: '2. Site geometry (preliminary field measurements)',
      lines: [
        { label: 'GPS pin', value: describe(readSection(b, 'gpsPin')) },
        { label: 'Plot shape', value: describe(readSection(b, 'plotShape')) },
        { label: 'Dimensions', value: describe(readSection(b, 'dimensions')) },
        { label: 'Total area (sq m)', value: describe(readSection(b, 'totalAreaSqM')) },
        { label: 'Road frontage (m)', value: describe(readSection(b, 'roadFrontageM')) },
        { label: 'Access', value: describe(readSection(b, 'accessType')) },
        {
          label: 'Adjacent developments',
          value: describe(readSection(b, 'adjacentDevelopments')),
        },
        { label: 'Existing structures', value: describe(readSection(b, 'existingStructures')) },
        {
          label: 'Trees and obstacles',
          value: describe(readSection(b, 'treesAndObstacles')),
        },
      ],
    },
    {
      heading: '3. Orientation, environment and terrain',
      lines: [
        {
          label: 'Compass north',
          value: `${describe(readSection(c, 'compassNorthDeg'))} (degrees)`,
        },
        {
          label: 'Sun path (computed / informational)',
          value: describe(readSection(c, 'sunPath')),
        },
        {
          label: 'Wind direction (observed)',
          value: describe(readSection(c, 'windDirection')),
        },
        {
          label: 'Topography (preliminary)',
          value: describe(readSection(c, 'topography')),
        },
        {
          label: 'Ground conditions (preliminary)',
          value: describe(readSection(c, 'groundConditions')),
        },
        {
          label: 'Drainage (preliminary)',
          value: describe(readSection(c, 'drainageNotes')),
        },
        {
          label: 'Water flow direction',
          value: describe(readSection(c, 'waterFlowDirection')),
        },
      ],
    },
    {
      heading: '4. Client requirements and design brief',
      lines: [
        { label: 'Project description', value: describe(readSection(f, 'projectDescription')) },
        { label: 'Building type', value: describe(readSection(f, 'buildingType')) },
        { label: 'Storeys', value: describe(readSection(f, 'storeys')) },
        { label: 'Rooms', value: describe(readSection(f, 'rooms')) },
        { label: 'Style preferences', value: describe(readSection(f, 'stylePreferences')) },
        { label: 'Special needs', value: describe(readSection(f, 'specialNeeds')) },
        {
          label: 'Budget range (KES)',
          value: `${describe(readSection(f, 'budgetRangeKesMin'))} – ${describe(
            readSection(f, 'budgetRangeKesMax'),
          )}`,
        },
        { label: 'Timeline', value: describe(readSection(f, 'timeline')) },
      ],
    },
    {
      heading: '5. Media and sketch register',
      lines: [
        {
          label: 'Site sketch',
          value: 'Preliminary field sketch - not a cadastral survey',
        },
        {
          label: 'Media files',
          value:
            source.media.length === 0
              ? NOT_AVAILABLE
              : `${source.media.length} file(s): ${source.media
                  .map(
                    (m) =>
                      `${m.category}/${m.kind}${m.caption ? ` — ${m.caption}` : ''} [SHA-256 ${m.checksum.slice(0, 12)}…]`,
                  )
                  .join('; ')}`,
        },
      ],
    },
    {
      heading: '6. Limitations',
      lines: [
        {
          label: 'Limitations',
          value:
            'Field measurements, soil observations and sketches are preliminary. They are not a certified geotechnical, boundary or structural survey unless separately commissioned and verified.',
        },
      ],
    },
  ];
}

function safeText(value: string): string {
  // Remove control characters that corrupt PDF text streams.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
}

export async function generateDocx(source: ReportSource): Promise<Buffer> {
  const blocks = buildReportLines(source);
  const children: Array<Paragraph | Table> = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'MATHMAG BUILDERS LIMITED', bold: true, size: 32 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Site Visit & Design Brief Report',
          bold: true,
          size: 26,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${source.projectReference} · Report v${source.reportVersion} · Survey v${source.surveyVersion}`,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Generated ${source.generatedAt.toLocaleString('en-KE', {
            timeZone: 'Africa/Nairobi',
          })} (Africa/Nairobi)`,
          size: 18,
          color: '666666',
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  ];

  for (const block of blocks) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: block.heading, bold: true })],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: block.lines.map(
          (line) =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 28, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: line.label, bold: true })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 72, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun(safeText(line.value))] })],
                }),
              ],
            }),
        ),
      }),
    );
  }

  children.push(
    new Paragraph({
      spacing: { before: 360 },
      children: [
        new TextRun({
          text: 'Internal document — not a certified survey. Client publication is a separate authorized action.',
          italics: true,
          size: 18,
          color: '666666',
        }),
      ],
    }),
  );

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export function generatePdf(source: ReportSource): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 56, bottom: 56, left: 56, right: 56 },
      info: {
        Title: `Site Visit & Design Brief Report — ${source.projectReference}`,
        Author: 'Mathmag Builders Limited',
        Subject: 'Module 1 site visit report',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(16).text('MATHMAG BUILDERS LIMITED', { align: 'center' });
    doc.moveDown(0.25);
    doc.fontSize(13).text('Site Visit & Design Brief Report', { align: 'center' });
    doc.moveDown(0.25);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555555')
      .text(
        `${source.projectReference} · Report v${source.reportVersion} · Survey v${source.surveyVersion}`,
        { align: 'center' },
      )
      .text(
        `Generated ${source.generatedAt.toLocaleString('en-KE', {
          timeZone: 'Africa/Nairobi',
        })} (Africa/Nairobi)`,
        { align: 'center' },
      );
    doc.fillColor('#000000').moveDown(1);

    for (const block of buildReportLines(source)) {
      if (doc.y > 690) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(11).text(block.heading);
      doc.moveDown(0.3);
      for (const line of block.lines) {
        if (doc.y > 720) doc.addPage();
        doc.font('Helvetica-Bold').fontSize(8.5).text(`${line.label}: `, { continued: true });
        doc.font('Helvetica').fontSize(8.5).text(safeText(line.value));
        doc.moveDown(0.25);
      }
      doc.moveDown(0.6);
    }

    if (doc.y > 700) doc.addPage();
    doc
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor('#666666')
      .text(
        'Internal document — not a certified survey. Client publication is a separate authorized action.',
      );

    doc.end();
  });
}

export async function generateReportFiles(
  source: ReportSource,
): Promise<{ docx: Buffer; pdf: Buffer }> {
  const [docx, pdf] = await Promise.all([generateDocx(source), generatePdf(source)]);
  return { docx, pdf };
}
