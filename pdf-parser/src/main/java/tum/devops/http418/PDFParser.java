package tum.devops.http418;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.jspecify.annotations.Nullable;
import java.io.IOException;

public class PDFParser {
	static @Nullable String parsePDF(byte[] fileContent) throws IOException {
		try (PDDocument document = Loader.loadPDF(fileContent)) {
			PDFTextStripper stripper = new PDFTextStripper();
			stripper.setSortByPosition(true);

			for (int page = 1; page <= document.getNumberOfPages(); page++) {
				stripper.setStartPage(page);
				stripper.setEndPage(page);

				String pageText = stripper.getText(document);

				System.out.println("Page " + page);
				System.out.println("--------");

				for (String line : pageText.split("\\R")) {
					if (!line.isBlank()) {
						System.out.println(line);
					}
				}

				System.out.println();
			}
		}
		return null;
	}
}
