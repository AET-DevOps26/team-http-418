for /f "usebackq tokens=1,* delims==" %%A in ("..\.env") do set %%A=%%B
set SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432
gradlew build --build-cache --parallel -x spotlessCheck && java -jar .\build\libs\http418-0.0.1-SNAPSHOT.jar
