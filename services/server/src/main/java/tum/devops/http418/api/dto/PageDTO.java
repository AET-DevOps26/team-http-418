package tum.devops.http418.api.dto;

import java.util.List;

public record PageDTO<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
	public static <T> PageDTO<T> of(List<T> content, int page, int size, long totalElements) {
		final int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
		return new PageDTO<>(content, page, size, totalElements, totalPages);
	}
}
