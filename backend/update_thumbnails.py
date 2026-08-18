import json
import re
import os

JSON_FILE_PATH = '../src/data/feslive_wiki_data.json'

def get_youtube_video_id(url):
    if not url:
        return None
    match = re.search(r'(?:v=|youtu\.be/|/live/|/embed/)([^&?/\s]{11})', url)
    if match:
        return match.group(1)
    return None

def main():
    if not os.path.exists(JSON_FILE_PATH):
        print(f"❌ ファイルが見つかりません: {JSON_FILE_PATH}")
        return

    print(f"📂 {JSON_FILE_PATH} を読み込んでいます...")
    
    with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
        videos = json.load(f)

    updated_count = 0

    for video in videos:
        youtube_url = video.get("youtubeUrl", "")
        
        if youtube_url:
            video_id = get_youtube_video_id(youtube_url)
            if video_id:
                # 🌟 最初から黒帯のない完全な16:9規格（mqdefault.jpg）を使用
                new_thumb = f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg"
                
                if video.get("thumbnailUrl") != new_thumb:
                    video["thumbnailUrl"] = new_thumb
                    updated_count += 1

    with open(JSON_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(videos, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 完了！ {updated_count} 件のサムネイルを 'mqdefault.jpg'（黒帯なし）に更新しました。")

if __name__ == '__main__':
    main()