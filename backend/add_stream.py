# backend/add_stream_by_url.py
import json
import os
import re
import sys
import uuid
from datetime import datetime, timezone, timedelta
import yt_dlp

# 対象のJSONファイルパス（環境に合わせて調整してください）
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE_PATH = os.path.join(BASE_DIR, "streams.json")

# メンバー名辞書（タイトル・概要欄からの自動抽出用）
MEMBERS = [
    "日野下花帆", "村野さやか", "乙宗梢", "夕霧綴理",
    "大沢瑠璃乃", "藤島慈", "百生吟子", "徒町小鈴", "安養寺姫芽",
    "桂城泉", "セラス 柳田 リリエンフェルト"
]

def extract_video_id(url: str) -> str:
    """あらゆる形式のYouTube URLから11桁のvideo_idを抽出"""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11})(?:[&?#]|$)',
        r'youtu\.be\/([0-9A-Za-z_-]{11})',
        r'youtube\.com\/live\/([0-9A-Za-z_-]{11})',
        r'youtube\.com\/shorts\/([0-9A-Za-z_-]{11})'
    ]
    for pattern in patterns:
        match = re.search(pattern, url.strip())
        if match:
            return match.group(1)
    return ""

def determine_season(dt: datetime) -> str:
    """
    公開日から蓮ノ空の期・季節（例: 103Spring, 106Autumn）を自動判定
    年度: 4月〜翌年3月（2023年度=103, 2024年度=104, 2025年度=105, 2026年度=106...）
    季節: 4-6月=Spring, 7-9月=Summer, 10-12月=Autumn, 1-3月=Winter
    """
    year = dt.year
    month = dt.month

    academic_year = year if month >= 4 else year - 1
    term = 103 + (academic_year - 2023)

    if 4 <= month <= 6:
        season_name = "Spring"
    elif 7 <= month <= 9:
        season_name = "Summer"
    elif 10 <= month <= 12:
        season_name = "Autumn"
    else:
        season_name = "Winter"

    return f"{term}{season_name}"

def detect_participants(title: str, description: str) -> str:
    """タイトルや概要欄から出演メンバーを自動抽出"""
    found = []
    for member in MEMBERS:
        given_name = member.split()[-1] if " " in member else member[-2:]
        if member in title or given_name in title:
            found.append(member)

    if not found:
        for member in MEMBERS:
            if member in description:
                found.append(member)

    return "、".join(found) if found else ""

def clean_stream_title(raw_title: str) -> str:
    """YouTubeの配信タイトルから不要なハッシュタグや日時表記を整形"""
    t = re.sub(r'【[^】]*】', '', raw_title)
    t = re.sub(r'#\S+', '', t)
    t = re.sub(r'\d{4}/\d{1,2}/\d{1,2}', '', t)
    t = re.sub(r'[「」『』]', '', t).strip()
    return t if t else raw_title.strip()

def fetch_video_metadata(video_id: str) -> dict:
    """YouTube Data API v3（優先）または yt_dlp で動画メタデータを取得"""
    api_key = os.getenv("YOUTUBE_API_KEY")
    jst = timezone(timedelta(hours=9))

    if api_key:
        try:
            from googleapiclient.discovery import build
            youtube = build("youtube", "v3", developerKey=api_key)
            res = youtube.videos().list(part="snippet,liveStreamingDetails", id=video_id).execute()
            items = res.get("items", [])
            if items:
                snippet = items[0].get("snippet", {})
                live_details = items[0].get("liveStreamingDetails", {})

                raw_dt_str = live_details.get("actualStartTime") or snippet.get("publishedAt")
                dt = datetime.fromisoformat(raw_dt_str.replace("Z", "+00:00")).astimezone(jst)

                thumbnails = snippet.get("thumbnails", {})
                thumb_url = (
                    thumbnails.get("maxres", {}).get("url")
                    or thumbnails.get("high", {}).get("url")
                    or f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
                )

                return {
                    "dt": dt,
                    "raw_title": snippet.get("title", ""),
                    "description": snippet.get("description", ""),
                    "thumbnailUrl": thumb_url
                }
        except Exception as e:
            print(f"⚠️ YouTube API取得失敗（yt_dlpへフォールバックします）: {e}")

    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {"quiet": True, "no_warnings": True, "skip_download": True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        timestamp = info.get("release_timestamp") or info.get("timestamp")
        if timestamp:
            dt = datetime.fromtimestamp(timestamp, tz=jst)
        elif info.get("upload_date"):
            dt = datetime.strptime(info["upload_date"], "%Y%m%d").replace(tzinfo=jst)
        else:
            dt = datetime.now(jst)

        return {
            "dt": dt,
            "raw_title": info.get("title", ""),
            "description": info.get("description", ""),
            "thumbnailUrl": f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
        }

def build_entry_from_url(url: str) -> dict:
    """URLからWith×MEETS用の辞書データを構築"""
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError(f"有効なYouTube URLではありません: {url}")

    meta = fetch_video_metadata(video_id)
    dt = meta["dt"]
    formatted_date = dt.strftime("%Y/%m/%d")
    raw_title = meta["raw_title"]
    clean_title = clean_stream_title(raw_title)
    description = meta["description"]

    return {
        "id": str(uuid.uuid4()),
        "season": determine_season(dt),
        "type": "with_meets",
        "date": formatted_date,
        "title": clean_title,
        "participants": detect_participants(raw_title, description),
        "youtubeUrl": f"https://youtu.be/{video_id}",
        "thumbnailUrl": meta["thumbnailUrl"],
        "description": description,
        "raw_title_node": f"{formatted_date} 「{clean_title}」",
        "is_official": True
    }

def add_stream_entry(file_path: str, entry: dict):
    if not os.path.exists(file_path):
        data = []
    else:
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = []

    new_vid = extract_video_id(entry["youtubeUrl"])
    existing_vids = {extract_video_id(item.get("youtubeUrl", "")) for item in data}
    if new_vid in existing_vids:
        print(f"⏭️ スキップ: 既に登録済みの動画です ({entry['youtubeUrl']})")
        return

    data.append(entry)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print("\n✅ 追加完了:")
    print(json.dumps(entry, ensure_ascii=False, indent=2))
    print(f"\n📁 保存先: {file_path}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_urls = sys.argv[1:]
    else:
        raw_input = input("With×MEETSのYouTube URLを入力してください（複数ある場合はスペース区切り）: ").strip()
        target_urls = raw_input.split()

    if not target_urls:
        print("URLが指定されませんでした。")
        sys.exit(1)

    for url in target_urls:
        try:
            entry = build_entry_from_url(url)
            add_stream_entry(JSON_FILE_PATH, entry)
        except Exception as e:
            print(f"❌ エラー ({url}): {e}")