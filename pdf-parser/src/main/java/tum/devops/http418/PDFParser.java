package tum.devops.http418;

import org.apache.pdfbox.Loader;
import org.jspecify.annotations.NonNull;
import technology.tabula.ObjectExtractor;
import technology.tabula.Page;
import technology.tabula.RectangularTextContainer;
import technology.tabula.Table;
import technology.tabula.extractors.SpreadsheetExtractionAlgorithm;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.cos.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

public class PDFParser {
	private static final Pattern MODULE_ID = Pattern.compile("^[A-Z]{2,4}\\d{4,6}(?:_[A-Z])?$");

	private static final Pattern GRADE = Pattern.compile("^(?:[1-5],[0-9]|BE|NB)$");

	private static final Pattern CREDITS = Pattern.compile("^\\d+$");

	public record Module(String moduleId, String titleDe, String titleEn, float grade, int credits, int page) {
	}

	public static @NonNull List<Module> extractModules(byte[] fileContent) throws Exception {
		List<Module> result = new ArrayList<>();

		try (PDDocument document = Loader.loadPDF(fileContent);
				ObjectExtractor extractor = new ObjectExtractor(document)) {

			SpreadsheetExtractionAlgorithm sea = new SpreadsheetExtractionAlgorithm();

			int pageCount = document.getNumberOfPages();

			for (int pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
				Page page = extractor.extract(pageNumber);
				List<Table> tables = sea.extract(page);

				for (Table table : tables) {
					for (List<RectangularTextContainer> row : table.getRows()) {
						List<String> cells = row.stream().map(cell -> clean(cell.getText())).toList();

						Optional<Module> module = parseRow(cells, pageNumber);
						module.ifPresent(result::add);
					}
				}
			}
		}

		return result;
	}

	private static Optional<Module> parseRow(@NonNull List<String> cells, int pageNumber) {
		if (cells.size() < 4) {
			return Optional.empty();
		}

		String moduleId = cells.get(0);

		if (!MODULE_ID.matcher(moduleId).matches()) {
			return Optional.empty();
		}

		String titleCell = cells.size() > 1 ? cells.get(1) : "";

		String grade = "";
		String credits = "";

		// More robust than hard-coding cell[3] and cell[4]:
		// scan the row for grade + credits next to each other.
		for (int i = 2; i < cells.size() - 1; i++) {
			if (GRADE.matcher(cells.get(i)).matches() && CREDITS.matcher(cells.get(i + 1)).matches()) {
				grade = cells.get(i);
				credits = cells.get(i + 1);
				break;
			}
		}

		if (grade.isBlank() || credits.isBlank()) {
			return Optional.empty();
		}

		String[] titleLines = titleCell.split("\\R+");

		String titleDe = titleLines.length > 0 ? clean(titleLines[0]) : "";
		String titleEn = titleLines.length > 1 ? clean(titleLines[1]) : "";

		return Optional.of(
				new Module(moduleId, titleDe, titleEn, Float.parseFloat(grade.replace(",", ".")), Integer.parseInt(credits), pageNumber));
	}

	private static @NonNull String clean(String value) {
		if (value == null) {
			return "";
		}
		return value.replace("\r", "\n").replaceAll("[ \\t\\x0B\\f]+", " ").replaceAll(" *\\n *", "\n").trim();
	}

	public static @NonNull String parsePDF(byte[] fileContent) {
		try {
			List<Module> modules = extractModules(fileContent);
			for (Module module : modules) {
				System.out.println(module);
			}
			return "OK";
		} catch (Exception e) {
			return "ERROR";
		}
	}
}
