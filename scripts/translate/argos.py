"""Translate one English title to Korean using a locally installed Argos model."""

import os
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")


def main() -> None:
    if len(sys.argv) not in (2, 3):
        raise SystemExit("Usage: argos.py <English title> | --batch <JSON titles>")

    # Title-length inputs do not need Stanza's heavyweight sentence splitter.
    os.environ.setdefault("ARGOS_CHUNK_TYPE", "MINISBD")

    try:
        import argostranslate.translate
    except ImportError as error:
        raise SystemExit(
            "Argos Translate is not installed. Install it locally before enabling Korean translations."
        ) from error

    installed_languages = argostranslate.translate.get_installed_languages()
    from_language = next((language for language in installed_languages if language.code == "en"), None)
    to_language = next((language for language in installed_languages if language.code == "ko"), None)
    if not from_language or not to_language:
        raise SystemExit("The Argos English-to-Korean language package is not installed.")

    translation = from_language.get_translation(to_language)
    if translation is None:
        raise SystemExit("The installed Argos packages do not provide en -> ko translation.")

    if sys.argv[1] == "--check":
        return

    if sys.argv[1] == "--batch":
        if len(sys.argv) != 3:
            raise SystemExit("--batch expects a JSON array of titles.")
        titles = json.loads(sys.argv[2])
        if not isinstance(titles, list) or not all(isinstance(title, str) for title in titles):
            raise SystemExit("--batch expects a JSON array of strings.")
        print(json.dumps([translation.translate(title) for title in titles], ensure_ascii=False))
        return

    print(translation.translate(sys.argv[1]))


if __name__ == "__main__":
    main()
