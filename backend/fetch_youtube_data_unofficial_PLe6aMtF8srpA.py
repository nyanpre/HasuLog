# backend/fetch_youtube_data_unofficial_PLe6aMtF8srpA.py
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

# ==========================================
# 設定部分
# ==========================================
# 更新対象のJSONファイルパス
JSON_FILE_PATH = 'data/withmeets_wiki_data.json'

# 今回取得する非公式再生リストのID
TARGET_PLAYLIST_ID = 'PLe6aMtF8srpA'

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
    # 1. YouTube APIのクライアント構築
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    
    # 2. 既存のJSONデータを読み込む
    with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
        wiki_data = json.load(f)

    # 3. 再生リストから動画を取得する
    print(f"再生リスト({TARGET_PLAYLIST_ID})から動画を取得中...")
    raw_items = fetch_playlist_items(youtube, TARGET_PLAYLIST_ID)
    print(f"再生リストから {len(raw_items)} 件の動画を取得しました。\n")

    update_count = 0
    unmatched_videos = [] # 🌟追加: マッチしなかった動画を保存するリスト

    # 4. 取得した動画とWikiデータを照らし合わせる
    for item in raw_items:
        snippet = item.get('snippet', {})
        video_id = snippet.get('resourceId', {}).get('videoId')
        yt_title = snippet.get('title', '')
        
        if not video_id:
            continue
            
        yt_url = f"https://www.youtube.com/watch?v={video_id}"
        
        matched = False # 🌟追加: このYouTube動画がマッチしたかどうかのフラグ

        # JSONデータの中から該当する動画を探す
        for wiki_item in wiki_data:
            # 条件1: 公式(is_official: true)のものは絶対に更新・上書きしない
            if wiki_item.get('is_official') is True:
                continue
            
            wiki_title = wiki_item.get('title', '')
            
            # YouTubeのタイトルにWikiのタイトルが含まれているか判定
            if wiki_title and (wiki_title in yt_title):
                # 条件2: youtubeUrlのみ更新し、is_official は元の false のまま維持する
                wiki_item['youtubeUrl'] = yt_url
                update_count += 1
                matched = True # 🌟追加: マッチしたことを記録
                
                print(f"✅ 更新(非公式): {wiki_title}")
                print(f"   -> {yt_url}")
                
                # 1つの動画が見つかったら、このYouTube動画のマッチングは終了して次へ
                break 
        
        # 🌟追加: JSON内のどのデータともマッチしなかった場合
        if not matched:
            # 「削除された動画」や「非公開動画」などはタイトルが取れない場合があるので除外
            if yt_title != "Deleted video" and yt_title != "Private video":
                unmatched_videos.append(yt_title)

    # 5. 更新した内容をJSONに上書き保存
    with open(JSON_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(wiki_data, f, ensure_ascii=False, indent=4)
        
    print("\n==========================================")
    print(f"処理完了: 計 {update_count} 件の非公式リンクを更新しました！")
    print(f"データは '{JSON_FILE_PATH}' に保存されました。")
    
    # 🌟追加: マッチしなかった動画の一覧を出力
    if unmatched_videos:
        print("\n⚠️ 以下の再生リストの動画は、Wikiデータと一致せず更新されませんでした:")
        for title in unmatched_videos:
            print(f"  - {title}")
    else:
        print("\n✨ 再生リストのすべての動画がWikiデータとマッチし、更新されました！")

if __name__ == '__main__':
    main()