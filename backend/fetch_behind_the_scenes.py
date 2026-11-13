# backend/fetch_behind_the_scenes.py
import os
import json
import re
from datetime import datetime
import yt_dlp
from googleapiclient.discovery import build

CHANNEL_URL = "https://www.youtube.com/@lovelive_hasu/videos"

YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
if not YOUTUBE_API_KEY:
    raise ValueError("APIキーが設定されていません。環境変数 'YOUTUBE_API_KEY' を設定してください。")

def determine_season(date_str: str) -> str:
    """ 2024/03/31までを103, 2025/03/31までを104, それ以降を105とする """
    try:
        if "/" in date_str:
            dt = datetime.strptime(date_str, "%Y/%m/%d")
        else:
            dt = datetime.strptime(date_str, "%Y%m%d")
        
        limit_103 = datetime(2024, 3, 31)
        limit_104 = datetime(2025, 3, 31)

        if dt <= limit_103:
            return "103"
        elif dt <= limit_104:
            return "104"
        else:
            return "105"
    except Exception:
        return "105"

def extract_video_id(url: str) -> str:
    """ URLから11桁のYouTube動画IDを抽出 """
    match = re.search(r'(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})', url)
    return match.group(1) if match else ""

def chunk_list(lst, chunk_size):
    """ リストを指定サイズ（API上限の50件）に分割 """
    for i in range(0, len(lst), chunk_size):
        yield lst[i:i + chunk_size]

def fetch_behind_the_scenes():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    output_json_path = os.path.join(project_root, "src", "components", "related", "data", "behind_the_scenes.json")

    # 1. 既存データを読み込み（すでに登録済みの video_id を把握）
    existing_items = []
    existing_video_ids = set()

    if os.path.exists(output_json_path):
        try:
            with open(output_json_path, 'r', encoding='utf-8') as f:
                existing_items = json.load(f)
                for item in existing_items:
                    v_id = extract_video_id(item.get("youtubeUrl", ""))
                    if v_id:
                        existing_video_ids.add(v_id)
            print(f"📄 既存ファイルから {len(existing_items)} 件を読み込みました。")
        except Exception as e:
            print(f"⚠️ 既存ファイルの読み込みに失敗しました（新規作成扱い）: {e}")
            existing_items = []

    print("🔄 yt_dlp を使用してチャンネルから『Behind the Scenes』動画をスキャン中...")

    ydl_opts = {
        "extract_flat": True,
        "quiet": True,
        "no_warnings": True,
        "skip_download": True
    }

    entries = []
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(CHANNEL_URL, download=False)
            entries = info.get("entries", []) if info else []
    except Exception as e:
        print(f"❌ 取得エラー: {e}")
        return

    # 対象となる新規動画IDをリストアップ
    new_video_ids = []
    seen_ids = set()

    for item in entries:
        if not item:
            continue
        title = item.get("title", "")
        if "behind the scenes" not in title.lower():
            continue

        video_id = item.get("id", "")
        if not video_id or video_id in existing_video_ids or video_id in seen_ids:
            continue

        new_video_ids.append(video_id)
        seen_ids.add(video_id)

    if not new_video_ids:
        print("\n✨ 新規の Behind the Scenes 動画はありませんでした。")
        return

    print(f"🔍 新規 {len(new_video_ids)} 件の動画を検出。YouTube Data API で正式な公開日を取得中...")

    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    new_items = []

    # 2. YouTube Data API で正式な公開日 (publishedAt) を取得
    for chunk in chunk_list(new_video_ids, 50):
        try:
            req = youtube.videos().list(
                part='snippet',
                id=','.join(chunk)
            )
            res = req.execute()
        except Exception as e:
            print(f"❌ APIエラーが発生しました: {e}")
            continue

        for v_item in res.get('items', []):
            vid = v_item.get('id')
            snippet = v_item.get('snippet', {})
            title = snippet.get('title', '')
            description = snippet.get('description', '')
            published_at = snippet.get('publishedAt', '')

            if published_at:
                dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                formatted_date = dt.strftime("%Y/%m/%d")
                published_iso = published_at
            else:
                formatted_date = datetime.now().strftime("%Y/%m/%d")
                published_iso = ""

            season = determine_season(formatted_date)

            thumbnails = snippet.get('thumbnails', {})
            if 'maxres' in thumbnails:
                thumbnail_url = thumbnails['maxres']['url']
            elif 'high' in thumbnails:
                thumbnail_url = thumbnails['high']['url']
            else:
                thumbnail_url = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"

            new_items.append({
                "id": "",  # あとで公開日順に連番付与
                "season": season,
                "type": "Behind the Scenes",
                "date": formatted_date,
                "publishedAt": published_iso, # 正確な時刻ソート用
                "title": title,
                "youtubeUrl": f"https://www.youtube.com/watch?v={vid}",
                "thumbnailUrl": thumbnail_url,
                "description": description
            })

    # 3. 既存と新規を統合し、公開日の古い順に並べて連番 ID を付与
    all_items = existing_items + new_items
    all_items.sort(key=lambda x: x.get("publishedAt") or x.get("date", ""))

    for idx, item in enumerate(all_items, start=1):
        item["id"] = f"behind_the_scenes_{idx}"

    # 4. JSON保存（画面一覧で見やすいように新しい順にして保存する場合もIDは古い順1〜Nを維持）
    all_items.sort(key=lambda x: x.get("publishedAt") or x.get("date", ""), reverse=True)

    # 一時ソート用キーの削除（不要な場合）
    for item in all_items:
        item.pop("publishedAt", None)

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 完了！ 新規 {len(new_items)} 件を追加し、合計 {len(all_items)} 件を保存しました。")
    print(f"📁 保存先: {output_json_path}")

if __name__ == "__main__":
    fetch_behind_the_scenes()