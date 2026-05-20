import hashlib
import json
import os
from models import Word

_DEFAULT_MODEL = "claude-haiku-4-5-20251001"


class _Provider:
    """Placeholder provider interface. Real SDK wrappers are added in the AI provider task.
    Expected response shape: response.choices[0].message.content -> JSON string."""

    def generate(self, model: str, messages: list[dict], temperature: float = 0.3):
        raise NotImplementedError("No AI provider configured")


provider = _Provider()


def hash_prompt(word_id: int, exercise_format: str, provider_name: str) -> str:
    key = f"{word_id}:{exercise_format}:{provider_name}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def _build_prompt(word: Word, exercise_format: str) -> str:
    # Word fields are DB-sourced and treated as trusted content at this layer.
    word_json = json.dumps(
        {
            "hebrew": word.hebrew,
            "transliteration": word.transliteration,
            "gloss_pt": word.gloss_pt,
            "morphology": word.morphology,
            "source_reference": word.source_reference,
        },
        ensure_ascii=False,
    )
    if exercise_format == "multiple_choice":
        return f"""Gere um exercício de múltipla escolha para esta palavra do hebraico bíblico:
{word_json}

Retorne um objeto JSON com estes campos exatos:
- question: string (em português, ex: "O que significa X?")
- options: array de 4 strings (traduções em português; resposta correta SEMPRE na posição 0)
- correct_index: 0
- explanation: string (breve nota etimológica ou dica mnemônica em português)

Retorne apenas o objeto JSON, sem markdown."""

    if exercise_format == "flashcard":
        return f"""Gere contexto de flashcard para esta palavra do hebraico bíblico:
{word_json}

Retorne um objeto JSON com estes campos exatos:
- example_sentence: string (frase bíblica curta em hebraico usando esta palavra, com niqqud)
- translation: string (tradução portuguesa da frase)
- note: string (nota morfológica breve em português, ex: "Substantivo masculino, raiz ד-ב-ר")

Retorne apenas o objeto JSON, sem markdown."""

    if exercise_format == "typing":
        return f"""Gere um exercício de digitação para esta palavra do hebraico bíblico:
{word_json}

Retorne um objeto JSON com estes campos exatos:
- prompt: string (em português, ex: "Como se escreve 'terra' em hebraico?")
- answer: string (a palavra hebraica com niqqud)
- hint: string (nome da primeira letra, ex: "Começa com aleph (א)")

Retorne apenas o objeto JSON, sem markdown."""

    raise ValueError(f"Unsupported exercise_format: {exercise_format!r}")


def generate_content(word: Word, exercise_format: str, model: str | None = None) -> dict:
    prompt = _build_prompt(word, exercise_format)
    response = provider.generate(
        model=model or os.environ.get("DEFAULT_AI_MODEL", _DEFAULT_MODEL),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    text = response.choices[0].message.content.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Provider returned non-JSON content for format {exercise_format!r}: {exc}") from exc
