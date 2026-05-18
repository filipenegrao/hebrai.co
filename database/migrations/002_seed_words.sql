INSERT INTO words (hebrew, transliteration, gloss_pt, morphology, frequency_rank, source_reference)
VALUES
  ('וְ', 've', 'e (conjunção)', '{"class": "conjunction"}', 1, 'Gn 1:1'),
  ('הַ', 'ha', 'o/a (artigo definido)', '{"class": "article"}', 2, 'Gn 1:1'),
  ('אֵת', 'et', '(marcador de objeto direto)', '{"class": "particle"}', 3, 'Gn 1:1'),
  ('אֲשֶׁר', 'asher', 'que / o qual', '{"class": "relative_pronoun"}', 4, 'Gn 1:2'),
  ('כֹּל', 'kol', 'todo / tudo', '{"class": "noun", "gender": "m"}', 5, 'Gn 1:31'),
  ('לֹא', 'lo', 'não', '{"class": "adverb"}', 6, 'Gn 1:4'),
  ('כִּי', 'ki', 'porque / que', '{"class": "conjunction"}', 7, 'Gn 1:4'),
  ('אֵל', 'el', 'Deus', '{"class": "noun", "gender": "m"}', 8, 'Gn 1:1'),
  ('יְהוָה', 'YHWH', 'SENHOR', '{"class": "proper_noun"}', 9, 'Gn 2:4'),
  ('עַל', 'al', 'sobre / em cima de', '{"class": "preposition"}', 10, 'Gn 1:2'),
  ('אֶל', 'el', 'para / a', '{"class": "preposition"}', 11, 'Gn 1:9'),
  ('בֵּן', 'ben', 'filho', '{"class": "noun", "gender": "m"}', 12, 'Gn 4:17'),
  ('מֶלֶךְ', 'melekh', 'rei', '{"class": "noun", "gender": "m"}', 13, 'Gn 14:1'),
  ('אֶרֶץ', 'erets', 'terra / país', '{"class": "noun", "gender": "f"}', 14, 'Gn 1:1'),
  ('יוֹם', 'yom', 'dia', '{"class": "noun", "gender": "m"}', 15, 'Gn 1:5'),
  ('אִישׁ', 'ish', 'homem', '{"class": "noun", "gender": "m"}', 16, 'Gn 2:23'),
  ('עַם', 'am', 'povo', '{"class": "noun", "gender": "m"}', 17, 'Gn 14:16'),
  ('בַּיִת', 'bayit', 'casa', '{"class": "noun", "gender": "m"}', 18, 'Gn 12:1'),
  ('תּוֹרָה', 'torah', 'lei / instrução', '{"class": "noun", "gender": "f", "root": "י-ר-ה"}', 19, 'Ex 12:49'),
  ('דָּבָר', 'davar', 'palavra / coisa', '{"class": "noun", "gender": "m", "root": "ד-ב-ר"}', 20, 'Gn 11:1')
ON CONFLICT (hebrew) DO NOTHING;
