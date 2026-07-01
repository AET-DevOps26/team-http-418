package tum.devops.http418;

import org.junit.jupiter.api.Test;
import tum.devops.http418.api.APIController;
import tum.devops.http418.api.dto.PrerequisiteTree;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PrerequisiteRecursiveEligibilityTest {

	private PrerequisiteTree.PrerequisiteNode node(long id, String type,
			List<PrerequisiteTree.PrerequisiteNode> children) {
		return new PrerequisiteTree.PrerequisiteNode(id, String.valueOf(id), "Course " + id, type, children);
	}

	@Test
	void flattenEmptyReturnsEmpty() {
		assertThat(APIController.flattenPrerequisiteNodes(List.of())).isEmpty();
	}

	@Test
	void flattenTopLevelOnly() {
		final var a = node(1, "REQUIRED", List.of());
		final var b = node(2, "RECOMMENDED", List.of());
		final var result = APIController.flattenPrerequisiteNodes(List.of(a, b));
		assertThat(result).containsExactly(a, b);
	}

	@Test
	void flattenNestedIncludesChildren() {
		final var child = node(2, "REQUIRED", List.of());
		final var parent = node(1, "RECOMMENDED", List.of(child));
		final var result = APIController.flattenPrerequisiteNodes(List.of(parent));
		assertThat(result).containsExactly(parent, child);
	}

	@Test
	void flattenDeeplyNested() {
		final var grandchild = node(3, "REQUIRED", List.of());
		final var child = node(2, "RECOMMENDED", List.of(grandchild));
		final var parent = node(1, "REQUIRED", List.of(child));
		final var result = APIController.flattenPrerequisiteNodes(List.of(parent));
		assertThat(result).containsExactly(parent, child, grandchild);
	}

	@Test
	void nestedRequiredNotCompletedBlocksEligibility() {
		final var nested = node(2, "REQUIRED", List.of());
		final var top = node(1, "RECOMMENDED", List.of(nested));
		final var flattened = APIController.flattenPrerequisiteNodes(List.of(top));
		final var unmet = flattened.stream().filter(n -> n.courseId() == 2).toList();
		assertThat(unmet.stream().anyMatch(r -> "REQUIRED".equals(r.type()))).isTrue();
	}

	@Test
	void nestedRecommendedNotCompletedDoesNotBlockEligibility() {
		final var nested = node(2, "RECOMMENDED", List.of());
		final var top = node(1, "REQUIRED", List.of(nested));
		final var flattened = APIController.flattenPrerequisiteNodes(List.of(top));
		final var unmetRequired = flattened.stream()
				.filter(n -> "REQUIRED".equals(n.type()) && n.courseId() != 1)
				.toList();
		assertThat(unmetRequired).isEmpty();
	}
}
