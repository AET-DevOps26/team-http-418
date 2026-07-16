import pytest

from prompt_config import PROMPT_SPECS, get_spec, validate_all_specs


def test_validate_all_specs():
    validate_all_specs()


def test_all_template_files_exist():
    for name, spec in PROMPT_SPECS.items():
        assert spec._template_text, f"spec '{name}' has empty template"


def test_get_spec_known():
    spec = get_spec("advisor")
    assert spec.template_file == "advisor.txt"


def test_get_spec_unknown():
    with pytest.raises(KeyError):
        get_spec("nonexistent")


@pytest.mark.parametrize("name,spec", list(PROMPT_SPECS.items()))
def test_render_with_dummy_values(name, spec):
    kwargs = {p: f"<{p}>" for p in spec.placeholders}
    result = spec.render(**kwargs)
    assert isinstance(result, str)
    assert len(result) > 0
    for p in spec.placeholders:
        assert f"<{p}>" in result


@pytest.mark.parametrize("name,spec", [(n, s) for n, s in PROMPT_SPECS.items() if s.placeholders])
def test_render_missing_kwarg_raises(name, spec):
    with pytest.raises(KeyError):
        spec.render()
