import sys
from unittest.mock import MagicMock

for _mod in ["fastapi", "langchain_core", "langchain_core.messages", "llm", "llm.provider"]:
    sys.modules.setdefault(_mod, MagicMock())
