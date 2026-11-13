# backend/fetch_membership_videos.py
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

def extract_video_id_from_item(entry: dict) -> str:
    """ 既存データの youtubeUrl や id から 11桁の video_id を抽出 """
    url = entry.get("youtubeUrl", "")
    match = re.search(r'(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})', url)
    if match:
        return match.group(1)
    
    custom_id = entry.get("id", "")
    if custom_id.startswith("membership-"):
        parts = custom_id.split("-")
        if len(parts) >= 3:
            return parts[-1]
    return ""

def chunk_list(lst, chunk_size):
    """ リストを指定サイズ（API上限の50件）に分割 """
    for i in range(0, len(lst), chunk_size):
        yield lst[i:i + chunk_size]

def fetch_membership_videos():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    output_json_path = os.path.join(project_root, "src", "components", "related", "data", "membership.json")

    # 1. 既存の JSON データを読み込んで既存の video_id を収集
    existing_items = []
    existing_video_ids = set()

    if os.path.exists(output_json_path):
        try:
            with open(output_json_path, 'r', encoding='utf-8') as f:
                existing_items = json.load(f)
                for item in existing_items:
                    v_id = extract_video_id_from_item(item)
                    if v_id:
                        existing_video_ids.add(v_id)
            print(f"📄 既存ファイルから {len(existing_items)} 件（ID特定: {len(existing_video_ids)}件）を読み込みました。")
        except Exception as e:
            print(f"⚠️ 既存ファイルの読み込みに失敗しました（新規作成扱い）: {e}")
            existing_items = []

    print("🔄 yt_dlp を使用してチャンネルから『メンバーシップ限定動画』をスキャン中...")

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

    print(f"📦 スキャン完了: {len(entries)} 件の動画から新規の対象動画を抽出します...")

    # 2. 新規のメンバーシップ限定動画の video_id のみを先にピックアップ
    new_video_ids = []
    scanned_new_ids = set()

    for item in entries:
        if not item:
            continue

        title = item.get("title", "")
        if "メンバーシップ限定動画" not in title:
            continue

        video_id = item.get("id", "")
        if not video_id or video_id in existing_video_ids or video_id in scanned_new_ids:
            continue

        new_video_ids.append(video_id)
        scanned_new_ids.add(video_id)

    if not new_video_ids:
        print("\n✨ 新規のメンバーシップ動画はありませんでした（すべて既存データに含まれています）。")
        return

    print(f"🔍 新規 {len(new_video_ids)} 件を検出。YouTube Data API で正式な公開日・詳細を取得中...")

    # 3. YouTube Data API v3 で正式な公開日・サムネイル・概要欄を一括取得
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    new_items = []

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
                date_num_str = dt.strftime("%Y%m%d")
            else:
                formatted_date = datetime.now().strftime("%Y/%m/%d")
                date_num_str = datetime.now().strftime("%Y%m%d")

            season = determine_season(formatted_date)

            thumbnails = snippet.get('thumbnails', {})
            if 'maxres' in thumbnails:
                thumbnail_url = thumbnails['maxres']['url']
            elif 'high' in thumbnails:
                thumbnail_url = thumbnails['high']['url']
            else:
                thumbnail_url = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"

            clean_id = f"membership-{date_num_str}-{vid}"

            new_entry = {
                "id": clean_id,
                "season": season,
                "type": "メンバー限定",
                "date": formatted_date,
                "publishedDate": formatted_date,
                "title": title,
                "youtubeUrl": f"https://www.youtube.com/watch?v={vid}",
                "thumbnailUrl": thumbnail_url,
                "description": description,
                "isMemberOnly": True,
                "raw_title_node": title
            }
            new_items.append(new_entry)

    # 4. 既存データと新規データを合算して最新日付順にソート
    all_items = existing_items + new_items
    all_items.sort(key=lambda x: x.get("date", ""), reverse=True)

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 完了！ 新規 {len(new_items)} 件を正式な公開日で追加し、合計 {len(all_items)} 件を保存しました。")
    print(f"📁 保存先: {output_json_path}")

if __name__ == "__main__":
    fetch_membership_videos()