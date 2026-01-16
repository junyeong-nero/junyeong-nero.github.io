#!/usr/bin/env python3
"""Convert toeic_vocab.csv to vocabulary.js format with multiple meanings as arrays."""

import csv
import re

def contains_korean(text: str) -> bool:
    return bool(re.search(r'[가-힣]', text))

def split_meanings(ko: str) -> list:
    ko = ko.replace('\n', ' ').replace('\r', '')
    ko = ' '.join(ko.split())
    parts = [p.strip() for p in ko.split(';')]
    return [p for p in parts if p]

def escape_js_string(text: str) -> str:
    text = text.replace('\\', '\\\\')
    text = text.replace('"', '\\"')
    text = text.replace("'", "\\'")
    text = text.replace('\n', '\\n')
    text = text.replace('\r', '')
    text = text.replace('\t', '\\t')
    return text

def convert_csv_to_js(csv_path: str, js_path: str):
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    filtered = [row for row in rows if contains_korean(row['Korean'])]

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write('const toeicVocabulary = [\n')
        for row in filtered:
            en = escape_js_string(row['English'])
            meanings = split_meanings(row['Korean'])
            meanings_json = ', '.join(f'"{escape_js_string(m)}"' for m in meanings)
            f.write(f'    {{ en: "{en}", ko: [{meanings_json}] }},\n')
        f.write('];\n')

    print(f'Converted {len(filtered)}/{len(rows)} items to {js_path}')

if __name__ == '__main__':
    csv_path = 'toeic_vocab.csv'
    js_path = 'assets/js/vocabulary.js'
    convert_csv_to_js(csv_path, js_path)
