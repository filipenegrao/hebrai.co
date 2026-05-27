import json
import os
import pytest
from unittest.mock import MagicMock, patch

from models import Word
from ai_service import hash_prompt, generate_content, _build_prompt, _GenerateResponse, _Choice, _Message


@pytest.fixture
def sample_word():
    return Word(
        id=14,
        hebrew="אֶרֶץ",
        transliteration="erets",
        gloss_pt="terra / país",
        morphology={"class": "noun", "gender": "f"},
        frequency_rank=14,
        source_reference="Gn 1:1",
    )


def test_hash_prompt_is_deterministic(sample_word):
    h1 = hash_prompt(sample_word.id, "flashcard", "claude")
    h2 = hash_prompt(sample_word.id, "flashcard", "claude")
    assert h1 == h2


def test_hash_prompt_differs_by_format(sample_word):
    h1 = hash_prompt(sample_word.id, "flashcard", "claude")
    h2 = hash_prompt(sample_word.id, "multiple_choice", "claude")
    assert h1 != h2


def test_generate_content_multiple_choice(sample_word):
    mock_response = {
        "question": "O que significa אֶרֶץ?",
        "options": ["terra", "céu", "água", "fogo"],
        "correct_index": 0,
        "explanation": "אֶרֶץ (erets) significa terra ou país",
    }
    mock = MagicMock()
    mock.choices[0].message.content = json.dumps(mock_response)

    with patch("ai_service.provider.generate", return_value=mock):
        result = generate_content(sample_word, "multiple_choice")

    assert result["correct_index"] == 0
    assert len(result["options"]) == 4


def test_generate_content_flashcard(sample_word):
    mock_response = {
        "example_sentence": "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
        "translation": "No princípio Deus criou os céus e a terra",
        "note": "Substantivo feminino, raiz א-ר-ץ",
    }
    mock = MagicMock()
    mock.choices[0].message.content = json.dumps(mock_response)

    with patch("ai_service.provider.generate", return_value=mock):
        result = generate_content(sample_word, "flashcard")

    assert "example_sentence" in result
    assert "translation" in result


def test_generate_content_typing(sample_word):
    mock_response = {
        "prompt": "Como se escreve 'terra' em hebraico?",
        "answer": "אֶרֶץ",
        "hint": "Começa com aleph (א)",
    }
    mock = MagicMock()
    mock.choices[0].message.content = json.dumps(mock_response)

    with patch("ai_service.provider.generate", return_value=mock):
        result = generate_content(sample_word, "typing")

    assert result["answer"] == "אֶרֶץ"


def test_build_prompt_raises_for_unknown_format(sample_word):
    with pytest.raises(ValueError, match="Unsupported exercise_format"):
        _build_prompt(sample_word, "unknown_format")


def test_generate_content_raises_on_malformed_json(sample_word):
    mock = MagicMock()
    mock.choices[0].message.content = "not valid json {"

    with patch("ai_service.provider.generate", return_value=mock):
        with pytest.raises(ValueError, match="non-JSON"):
            generate_content(sample_word, "flashcard")


def test_generate_content_returns_placeholder_when_no_provider(sample_word):
    with patch("ai_service.provider.generate", side_effect=NotImplementedError):
        result = generate_content(sample_word, "flashcard")
    assert "example_sentence" in result
    assert "translation" in result
    assert "note" in result


def test_generate_content_placeholder_multiple_choice(sample_word):
    with patch("ai_service.provider.generate", side_effect=NotImplementedError):
        result = generate_content(sample_word, "multiple_choice")
    assert result["correct_index"] == 0
    assert len(result["options"]) == 4
    assert result["options"][0] == sample_word.gloss_pt


def test_generate_content_placeholder_typing(sample_word):
    with patch("ai_service.provider.generate", side_effect=NotImplementedError):
        result = generate_content(sample_word, "typing")
    assert result["answer"] == sample_word.hebrew


def test_generate_content_passes_provider_name(sample_word):
    mock = MagicMock()
    mock.choices[0].message.content = json.dumps(
        {
            "prompt": "Como se escreve 'terra' em hebraico?",
            "answer": "אֶרֶץ",
            "hint": "Começa com aleph (א)",
        }
    )

    with patch("ai_service.provider.generate", return_value=mock) as generate:
        generate_content(sample_word, "typing", provider_name="gemini")

    assert generate.call_args.kwargs["provider_name"] == "gemini"


def test_generate_content_uses_anthropic_model_env_override(sample_word):
    response = _GenerateResponse(
        choices=[_Choice(message=_Message(content=json.dumps({"answer": "אֶרֶץ", "hint": "x", "prompt": "y"})))]
    )

    with patch.dict(os.environ, {"ANTHROPIC_MODEL": "claude-test-model"}, clear=False):
        with patch("ai_service.provider.generate", return_value=response) as generate:
            generate_content(sample_word, "typing", provider_name="claude")

    assert generate.call_args.kwargs["model"] == "claude-test-model"
