# backend/update_story_thumbnails.py
import json
import os
import re

JSON_PATH = os.path.join(os.path.dirname(__file__), "../src/data/story_wiki_data.json")

def extract_video_id(url: str) -> str:
    """YouTubeのURLから動画IDを抽出する"""
    if not url:
        return ""
    # 通常のwatch?v=、短縮url youtu.be/、埋め込みurl embed/ に対応
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'youtu\.be\/([0-9A-Za-z_-]{11})',
        r'embed\/([0-9A-Za-z_-]{11})'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return ""

def update_thumbnails():
    if not os.path.exists(JSON_PATH):
        print(f"❌ エラー: {JSON_PATH} が見つかりません。")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        story_data = json.load(f)

    updated_count = 0

    for item in story_data:
        youtube_url = item.get("youtubeUrl", "").strip()
        if not youtube_url:
            continue

        video_id = extract_video_id(youtube_url)
        if video_id:
            # 16:9比率で黒帯が出ない mqdefault.jpg を設定
            thumbnail_url = f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"
            item["thumbnailUrl"] = thumbnail_url
            updated_count += 1
            print(f"✅ サムネイル設定: [{item.get('season', '')}] {item.get('title', '')} -> {thumbnail_url}")

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(story_data, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 完了: {updated_count} / {len(story_data)} 件のサムネイルURLを更新しました。")

if __name__ == "__main__":
    update_thumbnails()