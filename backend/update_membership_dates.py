# backend/update_membership_dates.py
import os
import json
import re
from datetime import datetime
from googleapiclient.discovery import build

YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
if not YOUTUBE_API_KEY:
    raise ValueError("APIキーが設定されていません。環境変数 'YOUTUBE_API_KEY' を設定してください。")

def determine_season(date_str: str) -> str:
    """
    2024/03/31までを103, 2025/03/31までを104, それ以降を105とする
    """
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

def extract_video_id(url_or_id: str) -> str:
    """ URLまたは文字列から11桁のYouTube動画IDを抽出 """
    match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', url_or_id)
    return match.group(1) if match else url_or_id

def chunk_list(lst, chunk_size):
    """ リストを指定サイズ（API上限の50件）に分割するジェネレータ """
    for i in range(0, len(lst), chunk_size):
        yield lst[i:i + chunk_size]

def update_membership_dates():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    json_path = os.path.join(project_root, "src", "components", "related", "data", "membership.json")

    if not os.path.exists(json_path):
        print(f"❌ ファイルが存在しません: {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        items = json.load(f)

    if not items:
        print("⚠️ 更新対象のデータがありません。")
        return

    print(f"📂 {len(items)} 件のデータを読み込みました。動画IDを抽出中...")

    # 各アイテムと video_id のマッピングを作成
    item_map = {}
    video_ids = []
    for item in items:
        target = item.get("youtubeUrl") or item.get("id", "")
        vid = extract_video_id(target)
        if vid and len(vid) == 11:
            item_map[vid] = item
            video_ids.append(vid)

    print(f"🔍 YouTube Data API を呼び出し、正式な公開日を取得します...")
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

    updated_count = 0

    # 50件ずつバッチリクエストを実行
    for chunk in chunk_list(video_ids, 50):
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
            published_at = snippet.get('publishedAt', '')

            if vid in item_map and published_at:
                # ISO 8601 形式 ("2024-05-10T12:00:00Z") のパース
                dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                formatted_date = dt.strftime("%Y/%m/%d")
                date_num_str = dt.strftime("%Y%m%d")

                item_map[vid]["date"] = formatted_date
                item_map[vid]["publishedDate"] = formatted_date
                item_map[vid]["season"] = determine_season(formatted_date)
                
                # IDも正確な日付プレフィックスに更新
                item_map[vid]["id"] = f"membership-{date_num_str}-{vid}"
                
                # サムネイルが高解像度で再取得できる場合は更新
                thumbnails = snippet.get('thumbnails', {})
                if 'maxres' in thumbnails:
                    item_map[vid]["thumbnailUrl"] = thumbnails['maxres']['url']
                elif 'high' in thumbnails:
                    item_map[vid]["thumbnailUrl"] = thumbnails['high']['url']

                updated_count += 1

    # 日付の新しい順にソートし直す
    items.sort(key=lambda x: x.get("date", ""), reverse=True)

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 完了！ 全 {len(items)} 件中 {updated_count} 件の公開日・期（season）を正式な日付に更新しました。")
    print(f"📁 保存先: {json_path}")

if __name__ == "__main__":
    update_membership_dates()