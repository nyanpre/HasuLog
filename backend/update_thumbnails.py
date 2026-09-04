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
    return f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"

def main():
    if not os.path.exists(JSON_FILE_PATH):
        print(f"❌ ファイルが見つかりません: {JSON_FILE_PATH}")
        return

    print(f"📂 {JSON_FILE_PATH} を読み込んでいます...")

    with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
        videos = json.load(f)

    updated_count = 0

    for video in videos:
        youtube_url = video.get("youtubeUrl", "")
        if not youtube_url:
            continue

        video_id = get_youtube_video_id(youtube_url)
        if not video_id:
            continue

        new_thumb = get_best_thumbnail(video_id)

        if video.get("thumbnailUrl") != new_thumb:
            video["thumbnailUrl"] = new_thumb
            updated_count += 1
            quality = "maxres" if "maxres" in new_thumb else ("hq720" if "hq720" in new_thumb else "mqdefault")
            print(f"✅ 更新 ({quality}): {video.get('title', '')[:30]}...")

    with open(JSON_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(videos, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 完了！ {updated_count} 件のサムネイルを高画質版に更新しました。")

if __name__ == '__main__':
    main()