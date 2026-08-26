# backend/fetch_youtube_story.py
import json
import os
import re
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup

PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLu7E7HFun3xCX6AvSplb_5pF0_wxTR6sO"
JSON_PATH = os.path.join(os.path.dirname(__file__), "../src/data/story_wiki_data.json")

def normalize_text(text: str) -> str:
    """タイトルの正規化（全角半角、記号、スペースを統一・除去してマッチングしやすくする）"""
    if not text:
        return ""
    # カギ括弧や記号を統一
    text = text.replace('「', '『').replace('」', '』')
    text = text.replace('【', '').replace('】', '')
    text = text.replace(' ', '').replace(' ', '')
    text = text.lower()
    return text

def extract_bracket_content(text: str) -> str:
    """『〜』の中身（サブタイトル）を抽出"""
    m = re.search(r'『([^』]+)』', text)
    if m:
        return m.group(1).strip().lower()
    return ""

def extract_episode_num(text: str) -> str:
    """第〇話を抽出"""
    m = re.search(r'第(\d+)話', text)
    if m:
        return f"第{m.group(1)}話"
    return ""

def fetch_playlist_videos(playlist_url: str):
    """YouTube再生リストから動画IDとタイトル一覧を抽出"""
    print(f"Fetching YouTube playlist: {playlist_url}")
    
    # yt-dlp が利用可能な場合は yt-dlp を使用
    try:
        import yt_dlp
        ydl_opts = {
            'extract_flat': True,
            'quiet': True,
            'skip_download': True
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(playlist_url, download=False)
            if 'entries' in result:
                videos = []
                for entry in result['entries']:
                    if entry and entry.get('id'):
                        videos.append({
                            'id': entry.get('id'),
                            'title': entry.get('title', ''),
                            'url': f"https://www.youtube.com/watch?v={entry.get('id')}"
                        })
                return videos
    except ImportError:
        pass

    # yt-dlp がない場合のフォールバック（HTML解析）
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,ja-JP;q=0.9,en;q=0.8'
    }
    req = urllib.request.Request(playlist_url, headers=headers)
    html = urllib.request.urlopen(req).read().decode('utf-8')
    
    # ytInitialData から動画一覧を抽出
    videos = []
    match = re.search(r'var ytInitialData = ({.*?});</script>', html)
    if match:
        data = json.loads(match.group(1))
        try:
            tabs = data['contents']['twoColumnBrowseResultsRenderer']['tabs']
            contents = tabs[0]['tabRenderer']['content']['sectionListRenderer']['contents']
            items = contents[0]['itemSectionRenderer']['contents'][0]['playlistVideoListRenderer']['contents']
            for item in items:
                if 'playlistVideoRenderer' in item:
                    v_info = item['playlistVideoRenderer']
                    vid = v_info.get('videoId')
                    v_title = v_info.get('title', {}).get('runs', [{}])[0].get('text', '')
                    if vid:
                        videos.append({
                            'id': vid,
                            'title': v_title,
                            'url': f"https://www.youtube.com/watch?v={vid}"
                        })
        except Exception as e:
            print(f"JSONパースエラー: {e}")
            
    return videos

def main():
    if not os.path.exists(JSON_PATH):
        print(f"Error: {JSON_PATH} が見つかりません。")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        story_data = json.load(f)

    yt_videos = fetch_playlist_videos(PLAYLIST_URL)
    print(f"再生リストから {len(yt_videos)} 件の動画を取得しました。\n")

    matched_count = 0

    for item in story_data:
        story_title = item.get('title', '')
        story_season = item.get('season', '')
        story_sub = extract_bracket_content(story_title)
        story_ep = extract_episode_num(story_title)
        
        matched_video = None

        for v in yt_videos:
            yt_title = v['title']
            yt_title_norm = normalize_text(yt_title)
            
            # 1. 『サブタイトル』の完全一致・部分一致判定
            if story_sub and story_sub in yt_title.lower():
                # 期の整合性チェック（102期 / 103期 / 104期 / 105期 が入っている場合）
                if "102" in story_season and "102" not in yt_title_norm and "103" in yt_title_norm:
                    continue
                if "103" in story_season and "103" not in yt_title_norm and "104" in yt_title_norm:
                    continue
                matched_video = v
                break
                
            # 2. 第〇話 ＋ 期判定
            if story_ep and story_ep in yt_title:
                if story_season in yt_title:
                    matched_video = v
                    break

        if matched_video:
            item['youtubeUrl'] = matched_video['url']
            # 黒帯が出ない mqdefault を採用
            item['thumbnailUrl'] = f"https://i.ytimg.com/vi/{matched_video['id']}/mqdefault.jpg"
            matched_count += 1
            print(f"✅ マッチ: [{item['season']}] {item['title']} -> {matched_video['title']}")
        else:
            print(f"⚠️ 未マッチ: [{item['season']}] {item['title']}")

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(story_data, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 完了: {matched_count} / {len(story_data)} 件の動画URL・サムネイルを更新しました。")

if __name__ == "__main__":
    main()