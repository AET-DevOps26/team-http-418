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

import static org.junit.jupiter.api.Assertions.*;

class PDFParserGradeHandlingTest {

	private static final float[] COLUMN_X = { 50, 150, 350, 420, 480, 540 };
	private static final float ROW_HEIGHT = 20;
	private static final float TABLE_TOP = 700;

	@Test
	void beGradeEmittedAsPassModule() throws Exception {
		final byte[] pdf = tablePdf(new String[][] {
				{ "WI0001", "Economics Seminar\nWirtschaftsseminär", "BE", "5", "" },
		});

		final List<PDFParser.Module> modules = PDFParser.extractModules(pdf);

		assertEquals(1, modules.size());
		assertEquals(PDFParser.GradeType.PASS, modules.get(0).gradeType());
		assertEquals(0.0f, modules.get(0).grade());
		assertEquals(5, modules.get(0).credits());
	}

	@Test
	void nbGradeEmittedAsFailModule() throws Exception {
		final byte[] pdf = tablePdf(new String[][] {
				{ "WI0002", "Failed Seminar\nGescheitertesSeminär", "NB", "3", "" },
		});

		final List<PDFParser.Module> modules = PDFParser.extractModules(pdf);

		assertEquals(1, modules.size());
		assertEquals(PDFParser.GradeType.FAIL, modules.get(0).gradeType());
		assertEquals(0.0f, modules.get(0).grade());
	}

	@Test
	void accreditationMarkerStrippedAndFlagged() throws Exception {
		final byte[] pdf = tablePdf(new String[][] {
				{ "IN0001", "Transfer Course\nAnerkannt", "1,7*)", "6", "" },
		});

		final List<PDFParser.Module> modules = PDFParser.extractModules(pdf);

		assertEquals(1, modules.size());
		assertTrue(modules.get(0).accredited());
		assertEquals(1.7f, modules.get(0).grade(), 0.01f);
		assertEquals(PDFParser.GradeType.NUMERIC, modules.get(0).gradeType());
	}

	@Test
	void normalNumericGradeHasCorrectType() throws Exception {
		final byte[] pdf = tablePdf(new String[][] {
				{ "IN0003", "Normal Course\nNormale Veranstaltung", "2,3", "8", "" },
		});

		final List<PDFParser.Module> modules = PDFParser.extractModules(pdf);

		assertEquals(1, modules.size());
		assertEquals(PDFParser.GradeType.NUMERIC, modules.get(0).gradeType());
		assertFalse(modules.get(0).accredited());
		assertEquals(2.3f, modules.get(0).grade(), 0.01f);
	}

	@Test
	void mixedGradeRowsAllExtracted() throws Exception {
		final byte[] pdf = tablePdf(new String[][] {
				{ "IN0010", "Course A\nKurs A", "1,0", "6", "" },
				{ "IN0011", "Course B\nKurs B", "BE", "4", "" },
				{ "IN0012", "Course C\nKurs C", "NB", "3", "" },
				{ "IN0013", "Course D\nKurs D", "2,7*)", "5", "" },
		});

		final List<PDFParser.Module> modules = PDFParser.extractModules(pdf);

		assertEquals(4, modules.size());
		assertEquals(PDFParser.GradeType.NUMERIC, modules.get(0).gradeType());
		assertEquals(PDFParser.GradeType.PASS, modules.get(1).gradeType());
		assertEquals(PDFParser.GradeType.FAIL, modules.get(2).gradeType());
		assertTrue(modules.get(3).accredited());
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
						if (rows[r][c].isEmpty()) continue;
						// Only render first line for each cell to keep the table simple
						final String line = rows[r][c].split("\\n")[0];
						content.beginText();
						content.setFont(font, 9);
						content.newLineAtOffset(COLUMN_X[c] + 4, baseline);
						content.showText(line);
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
