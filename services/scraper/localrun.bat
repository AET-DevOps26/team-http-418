for /f "usebackq tokens=1,* delims==" %%A in ("..\.env") do set %%A=%%B
set DB_HOST=localhost
python main.py --clean