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
		var a = node(1, "REQUIRED", List.of());
		var b = node(2, "RECOMMENDED", List.of());
		var result = APIController.flattenPrerequisiteNodes(List.of(a, b));
		assertThat(result).containsExactly(a, b);
	}

	@Test
	void flattenNestedIncludesChildren() {
		var child = node(2, "REQUIRED", List.of());
		var parent = node(1, "RECOMMENDED", List.of(child));
		var result = APIController.flattenPrerequisiteNodes(List.of(parent));
		assertThat(result).containsExactly(parent, child);
	}

	@Test
	void flattenDeeplyNested() {
		var grandchild = node(3, "REQUIRED", List.of());
		var child = node(2, "RECOMMENDED", List.of(grandchild));
		var parent = node(1, "REQUIRED", List.of(child));
		var result = APIController.flattenPrerequisiteNodes(List.of(parent));
		assertThat(result).containsExactly(parent, child, grandchild);
	}

	@Test
	void nestedRequiredNotCompletedBlocksEligibility() {
		var nested = node(2, "REQUIRED", List.of());
		var top = node(1, "RECOMMENDED", List.of(nested));
		var flattened = APIController.flattenPrerequisiteNodes(List.of(top));
		var unmet = flattened.stream().filter(n -> n.courseId() == 2).toList();
		assertThat(unmet.stream().anyMatch(r -> "REQUIRED".equals(r.type()))).isTrue();
	}

	@Test
	void nestedRecommendedNotCompletedDoesNotBlockEligibility() {
		var nested = node(2, "RECOMMENDED", List.of());
		var top = node(1, "REQUIRED", List.of(nested));
		var flattened = APIController.flattenPrerequisiteNodes(List.of(top));
		var unmetRequired = flattened.stream()
				.filter(n -> "REQUIRED".equals(n.type()) && n.courseId() != 1)
				.toList();
		assertThat(unmetRequired).isEmpty();
	}
}
