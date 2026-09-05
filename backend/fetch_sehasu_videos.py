# backend/fetch_sehasu_videos.py
import os
import json
from datetime import datetime
from googleapiclient.discovery import build

YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
if not YOUTUBE_API_KEY:
    raise ValueError("APIキーが設定されていません。環境変数 'YOUTUBE_API_KEY' を設定してください。")

CHANNEL_HANDLE = 'lovelive_hasu'  # @lovelive_hasu

def determine_season(date_str: str) -> str:
    """
    2023/03/31までを103, 2024/03/31までを104, それ以降を105とする
    """
    try:
        if "/" in date_str:
            dt = datetime.strptime(date_str, "%Y/%m/%d")
        else:
            dt = datetime.strptime(date_str, "%Y%m%d")
        
        limit_103 = datetime(2023, 3, 31)
        limit_104 = datetime(2024, 3, 31)

        if dt <= limit_103:
            return "103"
        elif dt <= limit_104:
            return "104"
        else:
            return "105"
    except Exception:
        return "105"

def get_channel_uploads_playlist_id(youtube, handle: str) -> str:
    """ ハンドル名からチャンネルの全アップロード動画用プレイリストIDを自動取得 """
    print(f"🔍 チャンネル情報（@{handle}）を取得中...")
    req = youtube.channels().list(
        part='contentDetails',
        forHandle=handle
    )
    res = req.execute()
    items = res.get('items', [])
    if not items:
        raise ValueError(f"チャンネル @{handle} が見つかりませんでした。")
    
    uploads_id = items[0]['contentDetails']['relatedPlaylists']['uploads']
    return uploads_id

def fetch_sehasu_videos():
    print("🚀 YouTube Data APIを使用して全アップロード動画から『せーはす』を取得中...")
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    
    uploads_playlist_id = get_channel_uploads_playlist_id(youtube, CHANNEL_HANDLE)
    print(f"✅ アップロードプレイリストIDを特定しました: {uploads_playlist_id}")

    unique_videos = {}
    next_page_token = None
    total_scanned = 0

    while True:
        try:
            request = youtube.playlistItems().list(
                part='snippet',
                playlistId=uploads_playlist_id,
                maxResults=50,
                pageToken=next_page_token
            )
            response = request.execute()
        except Exception as e:
            print(f"❌ APIリクエストエラー: {e}")
            break

        items = response.get('items', [])
        total_scanned += len(items)
        print(f"🔍 スキャン中... {total_scanned} 件走査済み (せーはす抽出: {len(unique_videos)} 件)")

        for item in items:
            snippet = item.get('snippet', {})
            video_id = snippet.get('resourceId', {}).get('videoId')
            if not video_id:
                continue

            title = snippet.get('title', '')
            if "せーので！はすのそら！" not in title:
                continue

            if title in ["Private video", "Deleted video"]:
                continue

            description = snippet.get('description', '')
            if "#shorts" in title.lower() or "#shorts" in description.lower():
                continue

            if video_id not in unique_videos:
                published_at = snippet.get('publishedAt', '')
                if published_at:
                    dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    formatted_date = dt.strftime("%Y/%m/%d")
                    upload_date_str = dt.strftime("%Y%m%d")
                else:
                    formatted_date = datetime.now().strftime("%Y/%m/%d")
                    upload_date_str = datetime.now().strftime("%Y%m%d")

                season = determine_season(formatted_date)

                thumbnails = snippet.get('thumbnails', {})
                if 'maxres' in thumbnails:
                    thumbnail_url = thumbnails['maxres']['url']
                elif 'high' in thumbnails:
                    thumbnail_url = thumbnails['high']['url']
                elif 'medium' in thumbnails:
                    thumbnail_url = thumbnails['medium']['url']
                elif 'default' in thumbnails:
                    thumbnail_url = thumbnails['default']['url']
                else:
                    thumbnail_url = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

                clean_id = f"sehasu-{upload_date_str}-{video_id}"
                youtube_url = f"https://www.youtube.com/watch?v={video_id}"

                unique_videos[video_id] = {
                    "id": clean_id,
                    "season": season,
                    "type": "せーはす",
                    "date": formatted_date,
                    "title": title,
                    "youtubeUrl": youtube_url,
                    "thumbnailUrl": thumbnail_url,
                    "description": description,
                    "raw_title_node": title
                }

        next_page_token = response.get('nextPageToken')
        if not next_page_token:
            break

    formatted_items = list(unique_videos.values())
    formatted_items.sort(key=lambda x: x["date"], reverse=True)

    if len(formatted_items) == 0:
        print("⚠️ 抽出件数が0件だったため、JSONファイルの更新を中断しました。")
        return

    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    output_json_path = os.path.join(project_root, "src", "components", "related", "data", "sehasu_videos.json")

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(formatted_items, f, ensure_ascii=False, indent=2)
        
    print(f"\n🎉 抽出完了！ 正確な公開日を含めた {len(formatted_items)} 件の動画データを保存しました。")
    print(f"📁 保存先: {output_json_path}")

if __name__ == "__main__":
    fetch_sehasu_videos()