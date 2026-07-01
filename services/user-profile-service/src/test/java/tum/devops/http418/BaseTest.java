package tum.devops.http418;

import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@Import(TestConfig.class)
@TestPropertySource(properties = {"SPRING_DATASOURCE_URL=jdbc:h2:mem:testdb", "SPRING_DATASOURCE_USERNAME=sa",
		"SPRING_DATASOURCE_PASSWORD=", "app.jwt.secret=change-me-change-me-change-me-change-me",
		"app.jwt.access-token-ttl-seconds=3600", "app.refresh-token.ttl-seconds=604800", "API_VERSION=v1"})
@ActiveProfiles("test")
public class BaseTest {
}
