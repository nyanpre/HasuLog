import json
import os
import re
import urllib.request

JSON_FILE_PATH = os.path.join(os.path.dirname(__file__), "../src/data/feslive_wiki_data.json")

def get_youtube_video_id(url):
    if not url:
        return None
    match = re.search(r'(?:v=|youtu\.be/|/live/|/embed/)([^&?/\s]{11})', url)
    if match:
        return match.group(1)
    return None

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

def main():
    if not os.path.exists(JSON_FILE_PATH):
        print(f"❌ ファイルが見つかりません: {JSON_FILE_PATH}")
        return

    print(f"📂 {JSON_FILE_PATH} を読み込んでいます...")

    with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
        videos = json.load(f)

    updated_count = 0
    skipped_items = []

    for video in videos:
        title = video.get('title', '不明なタイトル')[:30]
        youtube_url = video.get("youtubeUrl", "").strip()

        if not youtube_url:
            skipped_items.append({"title": title, "reason": "YouTube URLが未設定"})
            continue

        video_id = get_youtube_video_id(youtube_url)
        if not video_id:
            skipped_items.append({"title": title, "reason": f"動画ID抽出失敗 (URL: {youtube_url})"})
            continue

        new_thumb = get_best_thumbnail(video_id)
        if not new_thumb:
            skipped_items.append({"title": title, "reason": f"サムネイル取得失敗 (ID: {video_id})"})
            continue

        if video.get("thumbnailUrl") == new_thumb:
            skipped_items.append({"title": title, "reason": "既に最新サムネイルが設定済み"})
            continue

        video["thumbnailUrl"] = new_thumb
        updated_count += 1
        quality = "maxres" if "maxres" in new_thumb else ("hq720" if "hq720" in new_thumb else "mqdefault")
        print(f"✅ 更新 ({quality}): {title}...")

    with open(JSON_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(videos, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 完了！ {updated_count} 件のサムネイルを高画質版に更新しました。")

    if skipped_items:
        print(f"\n⚠️ 更新されなかった項目 ({len(skipped_items)} 件):")
        for skip in skipped_items:
            print(f" - {skip['title']}: {skip['reason']}")

if __name__ == '__main__':
    main()