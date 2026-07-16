plugins {
	java
	id("org.springframework.boot") version "4.0.6"
	id("io.spring.dependency-management") version "1.1.7"
	id("com.diffplug.spotless") version "7.0.4"
	id("org.openrewrite.rewrite") version "7.34.0"
}

group = "tum.pdf-parser"
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
	implementation("org.springframework.boot:spring-boot-starter")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-jdbc")
	developmentOnly("org.springframework.boot:spring-boot-devtools")

	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("io.micrometer:micrometer-registry-prometheus")
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.3")
	implementation("org.apache.logging.log4j:log4j-bom:2.26.0")
	implementation("org.postgresql:postgresql")
	testImplementation("com.h2database:h2")

	testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
	add("rewrite", "org.openrewrite.recipe:rewrite-static-analysis:2.36.0")
}

tasks.withType<Test> {
	useJUnitPlatform()
}

spotless {
	java {
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
