plugins {
	java
	id("org.springframework.boot") version "4.0.6"
	id("io.spring.dependency-management") version "1.1.7"
	id("com.diffplug.spotless") version "7.0.4"
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

	implementation("technology.tabula:tabula:1.0.5"){
		exclude(group = "org.slf4j", module = "slf4j-simple")
	}
	implementation("org.apache.pdfbox:pdfbox:3.0.7")
	implementation("org.apache.logging.log4j:log4j-bom:2.26.0")

	testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
	useJUnitPlatform()
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

tasks.named("check") {
	dependsOn("spotlessCheck")
}
