import json
import os
import re
import urllib.request

JSON_PATH = os.path.join(os.path.dirname(__file__), "../src/data/story_wiki_data.json")

def extract_video_id(url: str) -> str:
    """YouTubeのURLから動画IDを抽出する"""
    if not url:
        return ""
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

def check_image_exists(url: str) -> bool:
    """画像の存在確認（HEADリクエストで高速確認）"""
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req, timeout=3) as res:
            return res.status == 200
    except Exception:
        return False

def get_best_thumbnail(video_id: str) -> str:
    """最高画質(1280x720)を優先し、なければフォールバック"""
    # 1. 最高画質 (1280x720, 16:9, 黒帯なし)
    maxres_url = f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
    if check_image_exists(maxres_url):
        return maxres_url

    # 2. HQ720 (1280x720, 16:9)
    hq720_url = f"https://i.ytimg.com/vi/{video_id}/hq720.jpg"
    if check_image_exists(hq720_url):
        return hq720_url

    # 3. フォールバック: mqdefault (320x180, 16:9)
    mqdefault_url = f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"
    if check_image_exists(mqdefault_url):
        return mqdefault_url

    return ""

def update_thumbnails():
    if not os.path.exists(JSON_PATH):
        print(f"❌ エラー: {JSON_PATH} が見つかりません。")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        story_data = json.load(f)

    updated_count = 0
    skipped_items = []

    for item in story_data:
        title = f"[{item.get('season', '')}] {item.get('title', '不明なタイトル')}"
        youtube_url = item.get("youtubeUrl", "").strip()

        if not youtube_url:
            skipped_items.append({"title": title, "reason": "YouTube URLが未設定"})
            continue

        video_id = extract_video_id(youtube_url)
        if not video_id:
            skipped_items.append({"title": title, "reason": f"動画ID抽出失敗 (URL: {youtube_url})"})
            continue

        thumbnail_url = get_best_thumbnail(video_id)
        if not thumbnail_url:
            skipped_items.append({"title": title, "reason": f"サムネイル取得失敗 (ID: {video_id})"})
            continue

        if item.get("thumbnailUrl") == thumbnail_url:
            skipped_items.append({"title": title, "reason": "既に最新サムネイルが設定済み"})
            continue

        item["thumbnailUrl"] = thumbnail_url
        updated_count += 1
        quality = "maxres" if "maxres" in thumbnail_url else ("hq720" if "hq720" in thumbnail_url else "mqdefault")
        print(f"✅ 設定 ({quality}): {title}")

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(story_data, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 完了: {updated_count} / {len(story_data)} 件のサムネイルを更新しました。")

    if skipped_items:
        print(f"\n⚠️ 更新されなかった項目 ({len(skipped_items)} 件):")
        for skip in skipped_items:
            print(f" - {skip['title']}: {skip['reason']}")

if __name__ == "__main__":
    update_thumbnails()