#!/usr/bin/env python3
"""Crawl TOEIC vocabulary from https://www.dokjongban.com/voca-book/"""

import requests
from bs4 import BeautifulSoup
import csv
import time
import random
import re

def crawl_vocabulary(limit=100):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    base_url = 'https://www.dokjongban.com/voca-book/'
    
    print('Fetching main page...')
    response = requests.get(base_url, headers=headers, timeout=10)
    
    if response.status_code != 200:
        print(f'Failed to fetch main page: {response.status_code}')
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    word_links = []
    for link in soup.find_all('a', href=True):
        href = link.get('href')
        if '/voca/' in href and href.count('/') >= 2:
            word = href.split('/voca/')[-1].rstrip('/')
            if word and not word.startswith('voca-') and not word[0].isdigit():
                if word not in word_links:
                    word_links.append(word)
    
    print(f'Found {len(word_links)} words')
    
    if limit and len(word_links) > limit:
        word_links = word_links[:limit]
        print(f'Limiting to {limit} words')
    
    results = []
    
    for i, word in enumerate(word_links):
        try:
            word_url = f'https://www.dokjongban.com/voca/{word}/'
            response = requests.get(word_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                meanings = extract_meanings(soup)
                
                if meanings:
                    results.append({'en': word, 'ko': meanings})
                    print(f'[{i+1}/{len(word_links)}] {word}: {meanings}')
                else:
                    print(f'[{i+1}/{len(word_links)}] {word}: No meanings found')
            else:
                print(f'[{i+1}/{len(word_links)}] {word}: HTTP {response.status_code}')
                
        except Exception as e:
            print(f'[{i+1}/{len(word_links)}] {word}: Error - {e}')
        
        time.sleep(random.uniform(0.5, 1.5))
    
    return results

def extract_meanings(soup):
    meanings = []
    
    title = soup.find('title')
    if title:
        title_text = title.get_text()
        match = re.search(r' - ([^:]+?) ::', title_text)
        if match:
            ko_part = match.group(1).strip()
            parts = [p.strip() for p in ko_part.split(',')]
            parts = [p for p in parts if re.search(r'[가-힣]', p) and len(p) < 15]
            if parts:
                return parts
    
    for text in soup.get_text().split('\n'):
        text = text.strip()
        if not text:
            continue
        
        if re.search(r'^[가-힣, ]+$', text):
            if len(text) < 50:
                parts = [p.strip() for p in text.split(',')]
                parts = [p for p in parts if p and len(p) < 15]
                if len(parts) >= 2:
                    return parts
    
    for elem in soup.find_all(['div', 'span', 'p']):
        text = elem.get_text().strip()
        if re.search(r'^[가-힣, ]+$', text) and len(text) < 40:
            parts = [p.strip() for p in text.split(',')]
            parts = [p for p in parts if p and len(p) < 15]
            if len(parts) >= 2:
                return parts
    
    return meanings

def save_to_csv(results, output_file):
    with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['English', 'Korean'])
        for item in results:
            ko_str = ', '.join(item['ko'])
            writer.writerow([item['en'], ko_str])
    print(f'Saved {len(results)} items to {output_file}')

def save_to_js(results, output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('const toeicVocabulary = [\n')
        for item in results:
            meanings = ', '.join(f'"{m}"' for m in item['ko'])
            f.write(f'    {{ en: "{item["en"]}", ko: [{meanings}] }},\n')
        f.write('];\n')
    print(f'Saved {len(results)} items to {output_file}')

if __name__ == '__main__':
    import os
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_csv = os.path.join(base_dir, 'toeic_vocab.csv')
    output_js = os.path.join(base_dir, 'assets', 'js', 'vocabulary.js')
    
    results = crawl_vocabulary(limit=100)
    
    if results:
        save_to_csv(results, output_csv)
        os.makedirs(os.path.dirname(output_js), exist_ok=True)
        save_to_js(results, output_js)
        print('Done!')
    else:
        print('No results found')
