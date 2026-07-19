package tum.devops.http418;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import technology.tabula.Cell;
import technology.tabula.Table;
import technology.tabula.ObjectExtractor;
import technology.tabula.Page;
import technology.tabula.RectangularTextContainer;
import technology.tabula.extractors.SpreadsheetExtractionAlgorithm;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.cos.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PDFParser {

	static final Logger logger = LoggerFactory.getLogger(PDFParser.class);

	public enum GradeType { NUMERIC, PASS, FAIL }

	public record TranscriptMetadata(String studentId, String degreeProgram, String degreeProgramEn,
			int totalCredits, float provisionalGrade) {}

	public record Module(String moduleId, String titleDe, String titleEn, float grade, int credits, int page,
			String category, boolean accredited, GradeType gradeType) {
		@Override
		public boolean equals(Object o) {
			return o instanceof Module other && other.moduleId.equals(moduleId) && other.titleDe.equals(titleDe)
					&& other.titleEn.equals(titleEn) && other.grade == grade && other.credits == credits
					&& other.page == page;
		}
	}

	private static final Pattern CATEGORY_DE = Pattern.compile(
			"^(Pflichtmodul|Wahlmodul|Bachelorprojekt)", Pattern.CASE_INSENSITIVE);
	private static final Pattern CATEGORY_EN = Pattern.compile(
			"(Required Modules?|Elective Modules?|Support Electives?|Bachelor's? Project)",
			Pattern.CASE_INSENSITIVE);
	private static final Pattern ACCREDITATION = Pattern.compile("\\*+\\)");

	private static String detectCategory(List<String> cells) {
		String text = cells.stream().filter(s -> !s.isBlank()).findFirst().orElse("").trim();
		if (text.isBlank()) return null;
		if (!CATEGORY_DE.matcher(text).find() && !CATEGORY_EN.matcher(text).find()) return null;
		// Return the English portion if present (after "/" or on the line containing English keywords)
		for (String line : text.split("\\R+")) {
			if (CATEGORY_EN.matcher(line).find()) return line.trim();
		}
		return text.split("\\R+")[0].trim();
	}

	public static @NonNull List<Module> extractModules(byte[] fileContent) throws Exception {
		final List<Module> result = new ArrayList<>();
		final String[] currentCategory = { null };

		try (PDDocument document = Loader.loadPDF(fileContent);
				ObjectExtractor extractor = new ObjectExtractor(document)) {

			final SpreadsheetExtractionAlgorithm sea = new SpreadsheetExtractionAlgorithm();
			final int pageCount = document.getNumberOfPages();

			for (int pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
				final Page page = extractor.extract(pageNumber);
				final List<Table> tables = sea.extract(page);

				for (Table table : tables) {
					for (var row : table.getRows()) {
						final List<String> cells = row.stream().map(RectangularTextContainer::getText).toList();

						// Check for section header before applying the 5-cell filter
						if (cells.size() < 5 || !row.stream().allMatch(col -> col instanceof Cell)) {
							String detected = detectCategory(cells);
							if (detected != null) currentCategory[0] = detected;
							continue;
						}

						if (cells.subList(0, 4).stream().anyMatch(String::isBlank)) continue;

						final Optional<Module> module = parseRow(cells, pageNumber, currentCategory[0]);
						module.ifPresent(result::add);
					}
				}
			}
		}

		return result;
	}

	private static Optional<Module> parseRow(@NonNull List<String> cells, int pageNumber, String category) {
		try {
			final String moduleId = cells.get(0);
			final String titleCell = cells.get(1);
			String gradeRaw = cells.get(2).trim();
			final String credits = cells.get(3);

			if (moduleId.isBlank() || titleCell.isBlank() || gradeRaw.isBlank() || credits.isBlank()) {
				return Optional.empty();
			}

			final String[] titleLines = titleCell.split("\\R+");
			final String titleDe = titleLines[0];
			final String titleEn = titleLines.length > 1 ? titleLines[1] : "";

			// Strip accreditation markers (e.g. "1,0*)" or "1,0**)")
			final boolean accredited = ACCREDITATION.matcher(gradeRaw).find();
			if (accredited) gradeRaw = ACCREDITATION.matcher(gradeRaw).replaceAll("").trim();

			// Handle pass/fail grades
			final GradeType gradeType;
			final float gradeValue;
			if ("BE".equalsIgnoreCase(gradeRaw)) {
				gradeType = GradeType.PASS;
				gradeValue = 0.0f;
			} else if ("NB".equalsIgnoreCase(gradeRaw)) {
				gradeType = GradeType.FAIL;
				gradeValue = 0.0f;
			} else {
				gradeType = GradeType.NUMERIC;
				gradeValue = Float.parseFloat(gradeRaw.replace(",", "."));
			}

			return Optional.of(new Module(moduleId, titleDe, titleEn, gradeValue,
					Integer.parseInt(credits), pageNumber, category, accredited, gradeType));
		} catch (IndexOutOfBoundsException | NumberFormatException e) {
			logger.error("Error parsing row", e);
			return Optional.empty();
		}
	}

	public static @NonNull TranscriptMetadata extractMetadata(byte[] fileContent) throws Exception {
		try (PDDocument document = Loader.loadPDF(fileContent)) {
			final PDFTextStripper stripper = new PDFTextStripper();
			stripper.setStartPage(1);
			stripper.setEndPage(1);
			final String text = stripper.getText(document);

			final String studentId = extractAfterLabel(text, "Matrikelnummer/ Student ID Number:");
			String degreeProgram = extractAfterLabel(text, "Studiengang/ Degree Program:");
			String degreeProgramEn = null;
			if (degreeProgram != null && degreeProgram.contains("/")) {
				degreeProgramEn = degreeProgram.substring(degreeProgram.indexOf("/") + 1).trim();
				degreeProgram = degreeProgram.substring(0, degreeProgram.indexOf("/")).trim();
			}

			int totalCredits = 0;
			final Matcher creditsMatcher = Pattern.compile("Current Total Credits[^\\d]*(\\d+)").matcher(text);
			if (creditsMatcher.find()) totalCredits = Integer.parseInt(creditsMatcher.group(1));

			float provisionalGrade = 0.0f;
			final Matcher gradeMatcher = Pattern.compile("Provisional Grade[^\\d]*(\\d[,.]\\d)").matcher(text);
			if (gradeMatcher.find()) provisionalGrade = Float.parseFloat(gradeMatcher.group(1).replace(",", "."));

			return new TranscriptMetadata(studentId, degreeProgram, degreeProgramEn, totalCredits, provisionalGrade);
		}
	}

	private static String extractAfterLabel(String text, String label) {
		final int idx = text.indexOf(label);
		if (idx < 0) return null;
		final String after = text.substring(idx + label.length()).trim();
		final int newline = after.indexOf('\n');
		return newline > 0 ? after.substring(0, newline).trim() : after.trim();
	}

	public static @NonNull Optional<List<Module>> parsePDF(byte[] fileContent) {
		try {
			return Optional.of(extractModules(fileContent));
		} catch (Exception e) {
			logger.error("Error parsing file", e);
			return Optional.empty();
		}
	}
}
