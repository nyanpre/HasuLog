# backend/fetch_membership_videos.py
import os
import json
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

def fetch_membership_videos():
    print("🔄 yt-dlp を使用してチャンネルから『メンバーシップ限定動画』をスキャン中...")

    # --flat-playlist で高速に全件取得
    # ※ ローカル環境でブラウザから取得する場合は '--cookies-from-browser', 'chrome' などを追加可能
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

    formatted_items = []
    lines = result.stdout.strip().split('\n')
    print(f"📦 スキャン完了: {len(lines)} 件の動画から該当動画を抽出します...")

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

        formatted_items.append({
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
        })

    # 日付の新しい順にソート
    formatted_items.sort(key=lambda x: x["date"], reverse=True)

    if not formatted_items:
        print("⚠️ 該当する動画が見つかりませんでした。")
        return

    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    output_json_path = os.path.join(project_root, "src", "components", "related", "data", "membership.json")

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(formatted_items, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 抽出完了！ タイトルに「メンバーシップ限定動画」を含む {len(formatted_items)} 件を保存しました。")
    print(f"📁 保存先: {output_json_path}")

if __name__ == "__main__":
    fetch_membership_videos()