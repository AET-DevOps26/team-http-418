plugins {
	java
	id("org.springframework.boot") version "4.0.6"
	id("io.spring.dependency-management") version "1.1.7"
	id("com.diffplug.spotless") version "7.0.4"
	id("org.openrewrite.rewrite") version "7.34.0"
}

group = "tum.devops"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(25)
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springframework.boot:spring-boot-starter-jdbc")
	implementation("org.springframework.boot:spring-boot-starter-actuator")

	compileOnly("org.projectlombok:lombok:1.18.46")
	annotationProcessor("org.projectlombok:lombok:1.18.46")
	testCompileOnly("org.projectlombok:lombok:1.18.46")
	testAnnotationProcessor("org.projectlombok:lombok:1.18.46")

	implementation("org.apache.logging.log4j:log4j-bom:2.26.0")
	implementation("org.postgresql:postgresql")
	implementation("io.jsonwebtoken:jjwt-api:0.12.6")
	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

	testImplementation("com.h2database:h2")
	testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
	testImplementation("org.springframework.security:spring-security-test")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
	add("rewrite", "org.openrewrite.recipe:rewrite-static-analysis:2.36.0")
}

data class RootCauseFailure(
	val className: String,
	val testName: String,
	val exceptionName: String,
	val message: String?
)
val rootCauseFailures = mutableListOf<RootCauseFailure>()

tasks.withType<Test> {
	useJUnitPlatform()
	testLogging {
		events("passed", "skipped", "failed")
	}
	afterTest(KotlinClosure2<TestDescriptor, TestResult, Unit>({ descriptor, result ->
		if (result.resultType == TestResult.ResultType.FAILURE) {
			result.exceptions.forEach { exception ->
				val root = generateSequence(exception) { it.cause }.last()

				rootCauseFailures += RootCauseFailure(
					className = descriptor.className ?: "Unknown class",
					testName = descriptor.name,
					exceptionName = root::class.qualifiedName ?: root::class.simpleName ?: "Unknown exception",
					message = root.message
				)
			}
		}
	}))

	afterSuite(KotlinClosure2<TestDescriptor, TestResult, Unit>({ descriptor, _ ->
		if (descriptor.parent == null && rootCauseFailures.isNotEmpty()) {
			val red = "\u001B[31m"
			val yellow = "\u001B[33m"
			val cyan = "\u001B[36m"
			val bold = "\u001B[1m"
			val reset = "\u001B[0m"

			println()
			println("${bold}${red}Root Cause Summary${reset}")
			println("${red}=====================================================================================${reset}")

			rootCauseFailures.forEachIndexed { index, failure ->
				println()
				println("${bold}${yellow}${index + 1}) ${failure.className} > ${failure.testName}${reset}")
				println("${cyan}Exception:${reset} ${failure.exceptionName}")
				println("${cyan}Message:  ${reset} ${failure.message ?: "(no message)"}")
			}

			println()
			println("${red}=====================================================================================${reset}")
		}
	}))
}

spotless {
	java {
		eclipse().configProperties("""
			org.eclipse.jdt.core.formatter.join_wrapped_lines=false
			org.eclipse.jdt.core.formatter.comment.format_javadoc_comments=false
			org.eclipse.jdt.core.formatter.comment.format_block_comments=false
			org.eclipse.jdt.core.formatter.comment.format_line_comments=false
		""".trimIndent())
		removeUnusedImports()
		trimTrailingWhitespace()
		endWithNewline()
	}
}

rewrite {
	activeRecipe("org.openrewrite.staticanalysis.FinalizeLocalVariables")
}

tasks.named("check") {
	dependsOn("spotlessCheck")
}
