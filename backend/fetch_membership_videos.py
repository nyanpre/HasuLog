# backend/fetch_membership_videos.py
import os
import json
import re
import subprocess
from datetime import datetime

CHANNEL_URL = "https://www.youtube.com/@lovelive_hasu/videos"

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

def fetch_membership_videos():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    output_json_path = os.path.join(project_root, "src", "components", "related", "data", "membership.json")

    # 🌟 1. 既存の JSON データを読み込んで既存の video_id を収集
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

    print("🔄 yt-dlp を使用してチャンネルから『メンバーシップ限定動画』をスキャン中...")

    command = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-json",
        "--no-warnings",
        CHANNEL_URL
    ]

    try:
        result = subprocess.run(command, capture_output=True, text=True, encoding='utf-8')
    except Exception as e:
        print(f"❌ 取得エラー: {e}")
        return

    lines = result.stdout.strip().split('\n')
    print(f"📦 スキャン完了: {len(lines)} 件の動画から該当動画を抽出します...")

    new_items = []
    scanned_new_ids = set()

    for line in lines:
        if not line.strip():
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue

        title = item.get("title", "")

        # 🌟 「メンバーシップ限定動画」が含まれる動画のみを抽出
        if "メンバーシップ限定動画" not in title:
            continue

        video_id = item.get("id", "")
        if not video_id:
            continue

        # 🌟 2. 既存データまたは今回のループ内で追加済みの場合はスキップ
        if video_id in existing_video_ids or video_id in scanned_new_ids:
            continue

        youtube_url = f"https://www.youtube.com/watch?v={video_id}"

        # 日付フォーマット
        upload_date = item.get("upload_date", "")
        if not upload_date and item.get("release_date"):
            upload_date = item.get("release_date")

        if upload_date and len(upload_date) == 8:
            formatted_date = f"{upload_date[:4]}/{upload_date[4:6]}/{upload_date[6:]}"
        else:
            timestamp = item.get("timestamp") or item.get("release_timestamp")
            if timestamp:
                formatted_date = datetime.fromtimestamp(timestamp).strftime("%Y/%m/%d")
                upload_date = datetime.fromtimestamp(timestamp).strftime("%Y%m%d")
            else:
                formatted_date = datetime.now().strftime("%Y/%m/%d")
                upload_date = datetime.now().strftime("%Y%m%d")

        season = determine_season(formatted_date)

        thumbnails = item.get("thumbnails", [])
        thumbnail_url = thumbnails[-1].get("url", "") if thumbnails else f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        description = item.get("description", "")

        clean_id = f"membership-{upload_date}-{video_id}"

        new_entry = {
            "id": clean_id,
            "season": season,
            "type": "メンバー限定",
            "date": formatted_date,
            "title": title,
            "youtubeUrl": youtube_url,
            "thumbnailUrl": thumbnail_url,
            "description": description,
            "isMemberOnly": True,
            "raw_title_node": title
        }

        new_items.append(new_entry)
        scanned_new_ids.add(video_id)

    # 🌟 3. 新規差分がない場合はファイル更新をスキップ
    if not new_items:
        print("\n✨ 新規のメンバーシップ動画はありませんでした（すべて既存データに含まれています）。")
        return

    # 🌟 4. 既存データと新規データを合算して最新日付順にソート
    all_items = existing_items + new_items
    all_items.sort(key=lambda x: x.get("date", ""), reverse=True)

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 完了！ 新規 {len(new_items)} 件を追加し、合計 {len(all_items)} 件を保存しました。")
    print(f"📁 保存先: {output_json_path}")

if __name__ == "__main__":
    fetch_membership_videos()