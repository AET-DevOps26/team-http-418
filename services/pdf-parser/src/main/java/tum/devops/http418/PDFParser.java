package tum.devops.http418;

import org.apache.pdfbox.Loader;
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

public class PDFParser {

	static final Logger logger = LoggerFactory.getLogger(PDFParser.class);

	public record Module(String moduleId, String titleDe, String titleEn, float grade, int credits, int page) {
		@Override
		public boolean equals(Object o) {
			return o instanceof Module other && other.moduleId.equals(moduleId) && other.titleDe.equals(titleDe)
					&& other.titleEn.equals(titleEn) && other.grade == grade && other.credits == credits
					&& other.page == page;
		}
	}

	public static @NonNull List<Module> extractModules(byte[] fileContent) throws Exception {
		final List<Module> result = new ArrayList<>();

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
						if (cells.size() != 5 || cells.subList(0, 4).stream().anyMatch(String::isBlank)
								|| !row.stream().allMatch(column -> column instanceof Cell))
							continue;
						// only process rows with 5 cells where the first 4 are not empty and all
						// columns are Cells
						final Optional<Module> module = parseRow(cells, pageNumber);
						module.ifPresent(result::add);
					}
				}
			}
		}

		return result;
	}

	private static Optional<Module> parseRow(@NonNull List<String> cells, int pageNumber) {
		try {
			final String moduleId = cells.get(0);
			final String titleCell = cells.get(1);
			final String grade = cells.get(2);
			final String credits = cells.get(3);

			if (moduleId.isBlank() || titleCell.isBlank() || grade.isBlank() || credits.isBlank()) {
				return Optional.empty();
			}

			final String[] titleLines = titleCell.split("\\R+");

			final String titleDe = titleLines[0];
			final String titleEn = titleLines.length > 1 ? titleLines[1] : "";

			return Optional.of(new Module(moduleId, titleDe, titleEn, Float.parseFloat(grade.replace(",", ".")),
					Integer.parseInt(credits), pageNumber));
		} catch (IndexOutOfBoundsException | NumberFormatException e) {
			logger.error("Error parsing row", e);
			return Optional.empty();
		}
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
