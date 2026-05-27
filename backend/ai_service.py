import hashlib
import json
import os
from dataclasses import dataclass

from models import Word

_PROMPT_VERSION = "v2"
_DEFAULT_PROVIDER_MODELS = {
    "claude": "claude-sonnet-4-20250514",
}


@dataclass
class _Message:
    content: str


@dataclass
class _Choice:
    message: _Message


@dataclass
class _GenerateResponse:
    choices: list[_Choice]


class _Provider:
    """Placeholder provider interface. Real SDK wrappers are added in the AI provider task.
    Expected response shape: response.choices[0].message.content -> JSON string."""

    def generate(
        self,
        provider_name: str,
        model: str,
        messages: list[dict],
        temperature: float = 0.3,
    ) -> _GenerateResponse:
        if provider_name == "claude":
            return self._generate_anthropic(model=model, messages=messages, temperature=temperature)
        raise NotImplementedError(f"No AI provider configured for {provider_name!r}")

    def _generate_anthropic(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.3,
    ) -> _GenerateResponse:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise NotImplementedError("ANTHROPIC_API_KEY is not configured")

        from anthropic import Anthropic

        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model=model,
            max_tokens=1024,
            temperature=temperature,
            messages=messages,
        )
        text = "".join(block.text for block in response.content if getattr(block, "type", None) == "text").strip()
        if not text:
            raise ValueError("Anthropic returned no text content")
        return _GenerateResponse(choices=[_Choice(message=_Message(content=text))])


provider = _Provider()


def hash_prompt(word_id: int, exercise_format: str, provider_name: str) -> str:
    key = f"{_PROMPT_VERSION}:{word_id}:{exercise_format}:{provider_name}"
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


def _placeholder_content(exercise_format: str, word: Word) -> dict:
    """Deterministic fallback used when no AI provider is configured (NotImplementedError).
    Returns semantically valid but clearly marked stub content so the smoke path works
    without a real API key. Replaced automatically once a real provider is wired."""
    if exercise_format == "multiple_choice":
        return {
            "question": f"O que significa '{word.hebrew}'?",
            "options": [word.gloss_pt, "(opção B)", "(opção C)", "(opção D)"],
            "correct_index": 0,
            "explanation": "[Provedor de IA não configurado — adicione uma chave de API]",
        }
    if exercise_format == "flashcard":
        return {
            "example_sentence": word.hebrew,
            "translation": word.gloss_pt,
            "note": "[Provedor de IA não configurado — adicione uma chave de API]",
        }
    return {
        "prompt": f"Como se escreve '{word.gloss_pt}' em hebraico?",
        "answer": word.hebrew,
        "hint": "[Provedor de IA não configurado — adicione uma chave de API]",
    }


def generate_content(
    word: Word,
    exercise_format: str,
    provider_name: str = "claude",
    model: str | None = None,
) -> dict:
    prompt = _build_prompt(word, exercise_format)
    resolved_model = (
        model
        or os.environ.get("DEFAULT_AI_MODEL")
        or os.environ.get("ANTHROPIC_MODEL")
        or _DEFAULT_PROVIDER_MODELS.get(provider_name)
    )
    try:
        response = provider.generate(
            provider_name=provider_name,
            model=resolved_model or "",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
    except NotImplementedError:
        return _placeholder_content(exercise_format, word)
    text = response.choices[0].message.content.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Provider returned non-JSON content for format {exercise_format!r}: {exc}") from exc
