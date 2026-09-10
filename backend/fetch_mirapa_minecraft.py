# backend/fetch_mirapa_minecraft.py
import os
import json
from datetime import datetime
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
if not YOUTUBE_API_KEY:
    raise ValueError("APIキーが設定されていません。.envファイルまたは環境変数 'YOUTUBE_API_KEY' を設定してください。")

# みらぱマイクラのプレイリストID
PLAYLIST_ID = 'PLu7E7HFun3xBb1_ECU-XFeXp-Crv8uwCf'

def determine_season(date_str: str) -> str:
    """
    2024/03/31までを103, 2025/03/31までを104, それ以降を105とする
    """
    try:
        if "/" in date_str:
            dt = datetime.strptime(date_str, "%Y/%m/%d")
        elif "-" in date_str:
            dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
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

def fetch_playlist_items(youtube, playlist_id):
    items = []
    next_page_token = None
    
    while True:
        request = youtube.playlistItems().list(
            part='snippet',
            playlistId=playlist_id,
            maxResults=50,
            pageToken=next_page_token
        )
        response = request.execute()
        items.extend(response.get('items', []))
        
        next_page_token = response.get('nextPageToken')
        if not next_page_token:
            break
            
    return items

def main():
    print(f"🚀 プレイリスト（{PLAYLIST_ID}）から『みらぱマイクラ』を取得中...")
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    
    raw_items = fetch_playlist_items(youtube, PLAYLIST_ID)
    unique_videos = {}

    for item in raw_items:
        snippet = item.get('snippet', {})
        video_id = snippet.get('resourceId', {}).get('videoId')
        
        if not video_id:
            continue

        title = snippet.get('title', '')
        if title in ["Private video", "Deleted video"]:
            continue

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

        clean_id = f"mirapa-mc-{upload_date_str}-{video_id}"
        youtube_url = f"https://www.youtube.com/watch?v={video_id}"

        if video_id not in unique_videos:
            unique_videos[video_id] = {
                "id": clean_id,
                "videoId": video_id,
                "season": season,
                "category": "みらぱマイクラ",
                "type": "みらぱマイクラ",
                "title": title,
                "description": snippet.get('description', ''),
                "publishedDate": formatted_date,
                "date": formatted_date,
                "thumbnailUrl": thumbnail_url,
                "youtubeUrl": youtube_url,
                "is_official": True,  # 🌟 すべて公式フラグを付与
                "source": "YouTube",
                "sourcePlaylistId": PLAYLIST_ID
            }

    videos_list = list(unique_videos.values())
    # 投稿日の新しい順（降順）にソート
    videos_list.sort(key=lambda x: x['date'], reverse=True)

    # 出力先パスの設定
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    output_path = os.path.join(project_root, "src", "components", "related", "data", "mirapa_minecraft.json")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(videos_list, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 取得完了！ 全 {len(videos_list)} 件の動画データを保存しました。")
    print(f"📁 保存先: {output_path}")

if __name__ == '__main__':
    main()