import os
import json
from googleapiclient.discovery import build
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()

# os.getenv() を使ってAPIキーを安全に取得
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')

if not YOUTUBE_API_KEY:
    raise ValueError("APIキーが設定されていません。.envファイルを確認してください。")

# 複数のプレイリストIDをリスト形式で持たせておきます
PLAYLIST_IDS = [
    'PLu7E7HFun3xB33SP01_NZzJpV-TiRyx0K',
    # 今後、他のプレイリストID（活動記録まとめ等）をここに追加していく想定です
]

def fetch_playlist_items(youtube, playlist_id):
    """
    指定されたプレイリストIDから動画アイテムを全件取得する（ページネーション対応）
    """
    items = []
    next_page_token = None
    
    while True:
        request = youtube.playlistItems().list(
            part='snippet',
            playlistId=playlist_id,
            maxResults=50,  # 1回の最大取得件数
            pageToken=next_page_token
        )
        response = request.execute()
        items.extend(response.get('items', []))
        
        next_page_token = response.get('nextPageToken')
        if not next_page_token:
            break
            
    return items

def main():
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    
    # 重複排除のためのディクショナリ。videoIdをキーにして管理します。
    unique_videos = {}

    for pid in PLAYLIST_IDS:
        print(f"プレイリストを取得中: {pid}")
        raw_items = fetch_playlist_items(youtube, pid)
        
        for item in raw_items:
            snippet = item.get('snippet', {})
            video_id = snippet.get('resourceId', {}).get('videoId')
            
            if not video_id:
                continue
                
            # ディクショナリのキーとしてvideoIdを使うことで、
            # 別のプレイリストで既に取得済みの動画だった場合はスキップ（または上書き）されます。
            if video_id not in unique_videos:
                # Firestoreのデータ構造を後で決めやすいように、一旦使いそうな情報を抽出
                unique_videos[video_id] = {
                    'videoId': video_id,
                    'title': snippet.get('title', ''),
                    'description': snippet.get('description', ''),
                    'publishedAt': snippet.get('publishedAt', ''),
                    # 可能な限り高解像度のサムネイルを取得
                    'thumbnailUrl': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                    'sourcePlaylistId': pid
                }

    # 扱いやすいようにリスト形式に変換
    videos_list = list(unique_videos.values())
    
    # 日付の古い順などにソートしておくとデータが見やすくなります（ここではAPI取得順）
    # videos_list.sort(key=lambda x: x['publishedAt'])

    # JSONファイルとして出力
    output_filename = 'youtube_raw_data.json'
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(videos_list, f, ensure_ascii=False, indent=2)
        
    print(f"取得完了: 重複排除後の総動画数は {len(videos_list)} 件です。")
    print(f"データを '{output_filename}' に保存しました。")

if __name__ == '__main__':
    main()