package tum.devops.http418;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;

class PDFParserSkipsUnparseableRowsTest {

	private static final float[] COLUMN_X = { 50, 150, 350, 420, 480, 540 };
	private static final float ROW_HEIGHT = 20;
	private static final float TABLE_TOP = 700;

	/**
	 * Rows that pass the cell-count filter but fail number parsing (e.g. a
	 * non-numeric grade on pass/fail courses) must be skipped, not abort the
	 * whole extraction.
	 */
	@Test
	void unparseableRowIsSkippedInsteadOfFailingWholeDocument() throws Exception {
		final byte[] pdf = tablePdf(new String[][] {
				{ "IN0001", "Introduction to Informatics", "1,0", "6", "" },
				{ "IN0002", "Seminar Course", "B", "5", "" },
		});

		final List<PDFParser.Module> modules = assertDoesNotThrow(() -> PDFParser.extractModules(pdf));

		assertEquals(1, modules.size());
		assertEquals("IN0001", modules.get(0).moduleId().trim());
		assertEquals(1.0f, modules.get(0).grade());
		assertEquals(6, modules.get(0).credits());
	}

	private static byte[] tablePdf(String[][] rows) throws Exception {
		try (PDDocument document = new PDDocument()) {
			final PDPage page = new PDPage(PDRectangle.LETTER);
			document.addPage(page);

			try (PDPageContentStream content = new PDPageContentStream(document, page)) {
				content.setLineWidth(1);

				final float tableBottom = TABLE_TOP - rows.length * ROW_HEIGHT;
				for (int r = 0; r <= rows.length; r++) {
					final float y = TABLE_TOP - r * ROW_HEIGHT;
					content.moveTo(COLUMN_X[0], y);
					content.lineTo(COLUMN_X[COLUMN_X.length - 1], y);
				}
				for (final float x : COLUMN_X) {
					content.moveTo(x, TABLE_TOP);
					content.lineTo(x, tableBottom);
				}
				content.stroke();

				final PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
				for (int r = 0; r < rows.length; r++) {
					final float baseline = TABLE_TOP - r * ROW_HEIGHT - 14;
					for (int c = 0; c < rows[r].length; c++) {
						if (rows[r][c].isEmpty())
							continue;
						content.beginText();
						content.setFont(font, 9);
						content.newLineAtOffset(COLUMN_X[c] + 4, baseline);
						content.showText(rows[r][c]);
						content.endText();
					}
				}
			}

			final ByteArrayOutputStream out = new ByteArrayOutputStream();
			document.save(out);
			return out.toByteArray();
		}
	}
}
