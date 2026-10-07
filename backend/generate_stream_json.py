import json
import os
import re
import uuid
from datetime import datetime
from googleapiclient.discovery import build

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ==========================================
# 設定
# ==========================================
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")

# 🌟 保存先を story_wiki_data.json に変更
OUTPUT_FILE = "/workspaces/HasuLog/src/data/story_wiki_data.json"

MEMBERS = [
    "日野下花帆", "村野さやか", "乙宗梢", "夕霧綴理", "大沢瑠璃乃", "藤島慈",
    "百生吟子", "徒町小鈴", "安養寺姫芽"
]

def extract_video_id(url: str) -> str | None:
    """YouTubeのURLからvideo_id（11桁）を抽出"""
    match = re.search(r'(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})', url)
    return match.group(1) if match else None

def calculate_season(dt: datetime) -> str:
    """日付から期と季節を推定"""
    year = dt.year
    month = dt.month

    era = year - 2023 + 103 if month >= 4 else (year - 1) - 2023 + 103

    if month in [4, 5]:
        season = "Spring"
    elif month in [6, 7, 8]:
        season = "Summer"
    elif month in [9, 10, 11]:
        season = "Autumn"
    else:
        season = "Winter"

    return f"{era}{season}"

def infer_type(title: str) -> str:
    if "活動記録" in title:
        return "活動記録"
    elif "Fes×LIVE" in title:
        return "Fes×LIVE"
    elif "With×MEETS" in title or "With" in title:
        return "With×MEETS"
    elif "おためし" in title:
        return "おためし蓮ノ空"
    return "配信"

def infer_participants(text: str) -> str:
    found = [m for m in MEMBERS if m in text]
    # 活動記録などで全員登場扱いにしたい場合はここで補完可能
    return "、".join(found) if found else "、".join(MEMBERS)

def fetch_and_build_entry(url: str, api_key: str) -> dict:
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError("有効なYouTube URLではありません。")

    youtube = build("youtube", "v3", developerKey=api_key)
    res = youtube.videos().list(part="snippet", id=video_id).execute()

    items = res.get("items", [])
    if not items:
        raise ValueError(f"動画情報が見つかりませんでした (ID: {video_id})")

    snippet = items[0]["snippet"]
    title = snippet.get("title", "")
    description = snippet.get("description", "")
    published_at_str = snippet.get("publishedAt", "")

    dt = datetime.fromisoformat(published_at_str.replace("Z", "+00:00"))
    date_str = dt.strftime("%Y/%m/%d")

    thumbnails = snippet.get("thumbnails", {})
    thumbnail_url = (
        thumbnails.get("maxres", {}).get("url")
        or f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
    )

    # 概要欄の候補を表示して、任意で入力できるように調整
    print(f"\n[取得タイトル]: {title}")
    custom_desc = input("要約・descriptionを入力（空欄なら概要欄1行目を使用）: ").strip()
    if not custom_desc:
        custom_desc = description.split("\n")[0] if description else ""

    entry = {
        "id": str(uuid.uuid4()),
        "season": calculate_season(dt),
        "type": infer_type(title),
        "date": date_str,
        "title": title,
        "participants": infer_participants(f"{title} {description}"),
        "youtubeUrl": f"https://youtu.be/{video_id}",
        "thumbnailUrl": thumbnail_url,
        "description": custom_desc,
        "raw_title_node": f"{date_str} {title}",
        "is_official": True
    }
    return entry

def main():
    if not YOUTUBE_API_KEY:
        print("エラー: 環境変数 'YOUTUBE_API_KEY' が設定されていません。")
        return

    url = input("YouTube URLを入力してください: ").strip()
    if not url:
        return

    try:
        new_entry = fetch_and_build_entry(url, YOUTUBE_API_KEY)

        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

        data_list = []
        if os.path.exists(OUTPUT_FILE):
            try:
                with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                    data_list = json.load(f)
            except json.JSONDecodeError:
                data_list = []

        data_list.append(new_entry)

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data_list, f, ensure_ascii=False, indent=4)

        print("\n--- 保存完了 ---")
        print(json.dumps(new_entry, ensure_ascii=False, indent=4))
        print(f"\n{OUTPUT_FILE} に追加しました。")

    except Exception as e:
        print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    main()