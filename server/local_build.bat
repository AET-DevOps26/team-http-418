for /f "usebackq tokens=1,* delims==" %%A in ("..\.env") do set %%A=%%B

gradlew build --build-cache --parallel && java -jar .\build\libs\http418-0.0.1-SNAPSHOT.jar
::todo fix db source