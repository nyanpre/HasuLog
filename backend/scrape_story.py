# backend/scrape_story.py
import re
import json
import uuid
import requests
from bs4 import BeautifulSoup
import os
from datetime import datetime

URL = "https://wikiwiki.jp/llll_wiki/%E6%B4%BB%E5%8B%95%E8%A8%98%E9%8C%B2"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "../src/data/story_wiki_data.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# 🌟 102期として固定判定するタイトル一覧
SEASON_102_TITLES = [
    "a falling star",
    "Sparkly Spot",
    "Reflection in the mirror",
    "Love with the world",
    "On your mark",
    "EP",
]

def parse_date(date_str):
    """年月日文字列から最初のYYYY/MM/DDを抽出する"""
    m = re.search(r'(\d{4})[年/.-](\d{1,2})[月/.-](\d{1,2})', date_str)
    if m:
        year, month, day = m.groups()
        return f"{year}/{int(month):02d}/{int(day):02d}"
    return ""

def determine_season(title: str, date_str: str, current_wiki_season: str) -> str:
    """タイトルおよび配信日に基づいて正確なシーズン（期）を判定する"""
    # 1. 102期のタイトル判定
    for t in SEASON_102_TITLES:
        if t.lower() in title.lower():
            return "102期"

    # 2. 配信日に基づく期分け判定
    if date_str:
        try:
            dt = datetime.strptime(date_str, "%Y/%m/%d")
            d104_start = datetime(2024, 4, 1)
            d104_end = datetime(2025, 4, 1)
            
            if dt >= datetime(2025, 4, 2):
                return "105期"
            elif d104_start <= dt <= d104_end:
                return "104期"
            elif dt < d104_start:
                return "103期"
        except ValueError:
            pass

    return current_wiki_season or "103期"

def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'\*\d+', '', text)
    return text.strip()

def scrape_activity_records():
    print(f"Fetching: {URL}")
    res = requests.get(URL, headers=HEADERS)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, 'html.parser')
    body = soup.find('div', id='body') or soup

    stories = []
    current_season = "103期"
    elements = body.find_all(['h2', 'h3', 'h4', 'table'])
    start_parsing = False

    for elem in elements:
        if elem.name in ['h2', 'h3']:
            elem_id = elem.get('id', '')
            if 'h2_content_1_1' in elem_id or '第一章' in elem.text or '102期' in elem.text or '103期' in elem.text:
                start_parsing = True

            text = elem.text.strip()
            season_match = re.search(r'(\d{3}期)', text)
            if season_match:
                current_season = season_match.group(1)

        if not start_parsing:
            continue

        if elem.name == 'table':
            rows = elem.find_all('tr')
            if not rows:
                continue

            headers = [th.text.strip() for th in rows[0].find_all(['th', 'td'])]
            if not any('タイトル' in h for h in headers) or not any('配信日' in h for h in headers):
                continue

            title_idx = -1
            desc_idx = -1
            date_idx = -1

            for idx, h in enumerate(headers):
                if 'タイトル' in h:
                    title_idx = idx
                elif 'あらすじ' in h:
                    desc_idx = idx
                elif '配信日' in h:
                    date_idx = idx

            for row in rows[1:]:
                cols = row.find_all(['td', 'th'])
                if len(cols) <= max(title_idx, date_idx):
                    continue

                raw_title = clean_text(cols[title_idx].text)
                raw_desc = clean_text(cols[desc_idx].text) if desc_idx != -1 and len(cols) > desc_idx else ""
                raw_date = clean_text(cols[date_idx].text)

                if not raw_title or ('～' in raw_title and not ('第' in raw_title or '話' in raw_title or '幕間' in raw_title or 'EP' in raw_title)):
                    season_inline = re.search(r'(\d{3}期)', raw_title)
                    if season_inline:
                        current_season = season_inline.group(1)
                    continue

                first_date = parse_date(raw_date)
                
                # 🌟 シーズン判定の適用
                assigned_season = determine_season(raw_title, first_date, current_season)

                description = raw_desc if raw_desc and "(あらすじ無し)" not in raw_desc else ""
                if raw_date:
                    formatted_schedule = raw_date.replace('\n', ' / ')
                    if description:
                        description += f"\n\n【配信日程】\n{formatted_schedule}"
                    else:
                        description = f"【配信日程】\n{formatted_schedule}"

                item = {
                    "id": str(uuid.uuid4()),
                    "season": assigned_season,
                    "type": "story",
                    "date": first_date,
                    "title": raw_title,
                    "participants": "",
                    "youtubeUrl": "",
                    "thumbnailUrl": "",
                    "description": description.strip(),
                    "raw_title_node": raw_title,
                    "is_official": True
                }

                stories.append(item)

    unique_stories = []
    seen = set()
    for s in stories:
        key = (s['season'], s['title'])
        if key not in seen and s['title']:
            seen.add(key)
            unique_stories.append(s)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(unique_stories, f, ensure_ascii=False, indent=2)

    print(f"✅ 抽出完了: {len(unique_stories)} 件の活動記録データを保存しました -> {OUTPUT_PATH}")

if __name__ == "__main__":
    scrape_activity_records()