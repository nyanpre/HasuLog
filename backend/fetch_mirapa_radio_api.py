import json
import os
import re
from datetime import datetime, timedelta, timezone
from googleapiclient.discovery import build

# 🌟 YouTube Data API v3 キーを設定
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY") or "YOUR_API_KEY_HERE"

PLAYLISTS = [
    {"subCategory": "待機室", "playlistId": "PLu7E7HFun3xAVc6GjOYhAmE6u-ewWDa_8"},
    {"subCategory": "補習室", "playlistId": "PLu7E7HFun3xDUAAKbMFe6PWW_wvmm8bLy"},
    {"subCategory": "視聴覚室", "playlistId": "PLu7E7HFun3xAmjVJyOiViclnZPRY_vcXJ"},
    {"subCategory": "進路相談室(104)", "playlistId": "PLu7E7HFun3xAJxSTd1ErYJrNeYqqraCu8"},
    {"subCategory": "きまっし!!", "playlistId": "PLu7E7HFun3xCnJmVYde_I89F4bSZVd6iM"},
    {"subCategory": "進路相談室(105)", "playlistId": "PLu7E7HFun3xAws4N_54eAKD_JUlU1onTv"},
    {"subCategory": "はすのそラジオ", "playlistId": "PLu7E7HFun3xD1SKkJooADGx7ghO4X6YNO"},
    {"subCategory": "補習室 THE FINAL", "playlistId": "PLe2bQbHjZFvg"}
]

# backendフォルダから見た ../src/components/related/data への絶対パスを自動計算
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "src", "components", "related", "data"))
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "mirapa_radio.json")


def format_iso_date(iso_str):
    """ISO 8601 (UTC) を 日本時間 (JST: UTC+9) の YYYY/MM/DD に変換"""
    if not iso_str:
        return ""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        # 🌟 UTCからJST（日本時間）に変換して日付ズレを解消
        jst = timezone(timedelta(hours=9))
        dt_jst = dt.astimezone(jst)
        return dt_jst.strftime("%Y/%m/%d")
    except Exception:
        return iso_str[:10].replace("-", "/")


def extract_season(date_str):
    """日付から期（シーズン）を判定 (4月始まりの年度で計算)"""
    if not date_str:
        return "103期"
    
    try:
        y, m, d = map(int, date_str.split("/"))
        # 4月〜12月はその年、1月〜3月は前年を年度とする
        nendo = y if m >= 4 else y - 1
        
        # 🌟 指定に基づく期の割り当て
        if nendo <= 2023:
            return "103期"  # 〜2024/03/31 まで
        elif nendo == 2024:
            return "104期"  # 2024/04/01 〜 2025/03/31
        else:
            return "105期"  # 2025/04/01 〜
    except Exception:
        return "103期"


def get_best_thumbnail(thumbnails, video_id):
    """利用可能な最も高画質なサムネイルURLを取得"""
    for quality in ["maxres", "standard", "high", "medium", "default"]:
        if quality in thumbnails:
            return thumbnails[quality]["url"]
    return f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"


def clean_description(text):
    if not text:
        return ""
    pattern = re.compile(r'[=＝]{3,}')
    match = pattern.search(text)
    if match:
        cleaned = text[:match.start()].rstrip()
        return cleaned
    return text.rstrip()


def main():
    if YOUTUBE_API_KEY == "YOUR_API_KEY_HERE":
        print("【エラー】有効な YouTube Data API キーを設定してください。")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    all_items = []
    seen_ids = set()

    print("=== YouTube API を使用したみらぱラジオデータ取得開始 ===")

    for pl in PLAYLISTS:
        sub_category = pl["subCategory"]
        playlist_id = pl["playlistId"]
        print(f"\n▶ 取得中: [{sub_category}] (Playlist ID: {playlist_id})")

        next_page_token = None
        count_in_playlist = 0

        while True:
            try:
                # 1. プレイリスト内の動画IDだけをリストアップする
                request = youtube.playlistItems().list(
                    part="contentDetails",
                    playlistId=playlist_id,
                    maxResults=50,
                    pageToken=next_page_token
                )
                response = request.execute()
                
                video_ids = []
                for item in response.get("items", []):
                    vid = item.get("contentDetails", {}).get("videoId")
                    if vid:
                        video_ids.append(vid)

                if video_ids:
                    # 2. 取得した動画IDを使って、詳細データ（配信日時を含む）をまとめて取得
                    videos_request = youtube.videos().list(
                        part="snippet,liveStreamingDetails",
                        id=",".join(video_ids)
                    )
                    videos_response = videos_request.execute()

                    for video in videos_response.get("items", []):
                        video_id = video["id"]
                        snippet = video.get("snippet", {})
                        title = snippet.get("title", "")

                        if not video_id or title in ["Private video", "Deleted video"]:
                            continue

                        unique_key = f"{video_id}_{sub_category}"
                        if unique_key in seen_ids:
                            continue
                        seen_ids.add(unique_key)

                        # 🌟 日時の決定ロジック (実際の配信開始時間 > 予定日時 > 通常のアップロード日)
                        live_details = video.get("liveStreamingDetails", {})
                        actual_start = live_details.get("actualStartTime")
                        scheduled_start = live_details.get("scheduledStartTime")
                        published_at = snippet.get("publishedAt")
                        
                        target_date_str = actual_start or scheduled_start or published_at
                        
                        # 🌟 JST（日本時間）に変換した正しい日付を取得
                        date_str = format_iso_date(target_date_str)

                        thumbnails = snippet.get("thumbnails", {})
                        thumb_url = get_best_thumbnail(thumbnails, video_id)
                        
                        raw_description = snippet.get("description", "")
                        cleaned_desc = clean_description(raw_description)

                        # 🌟 取得した正しい日付(JST)を元に「期」を判定する
                        season = extract_season(date_str)

                        all_items.append({
                            "id": f"mirapa_{video_id}",
                            "season": season,
                            "title": title,
                            "description": cleaned_desc,
                            "date": date_str,
                            "category": "みらぱラジオ",
                            "subCategory": sub_category,
                            "thumbnailUrl": thumb_url,
                            "youtubeUrl": f"https://www.youtube.com/watch?v={video_id}"
                        })
                        count_in_playlist += 1

                next_page_token = response.get("nextPageToken")
                if not next_page_token:
                    break

            except Exception as e:
                print(f"   [エラー] {sub_category} の取得中にエラーが発生しました: {e}")
                break

        print(f"   => {count_in_playlist} 件取得完了")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 完了! 合計 {len(all_items)} 件を保存しました:")
    print(f"   -> {OUTPUT_FILE}")


if __name__ == "__main__":
    main()