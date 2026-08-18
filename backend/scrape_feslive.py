import cloudscraper
from bs4 import BeautifulSoup
import json
import time
import uuid
import re
import os

URL = "https://wikiwiki.jp/llll_wiki/Fes%C3%97LIVE"

# YouTube URLから動画IDを抽出する関数
def get_youtube_video_id(url):
    match = re.search(r'(?:v=|youtu\.be/|/live/)([^&?/\s]{11})', url)
    if match:
        return match.group(1)
    return None

# 日付文字列から YYYY/MM/DD と 期(season) を計算する関数
def parse_date_and_season(raw_str):
    # 2023/4/1 や 2023年04月01日 などをキャッチ
    match = re.search(r'(\d{4})[年/]\s*(\d{1,2})[月/]\s*(\d{1,2})', raw_date)
    if match:
        y, m, d = int(match.group(1)), int(match.group(2)), int(match.group(3))
        date_formatted = f"{y}/{m:02d}/{d:02d}"
        
        # 蓮ノ空のスクールカレンダー（4月始まり）で「期」を計算
        # 2023年4月〜 = 103期, 2024年4月〜 = 104期
        school_year = y - 1920
        if m < 4:
            school_year -= 1
        season_str = str(school_year) # "103" や "104" (フロントのフィルター用)
        
        return date_formatted, season_str
    return None, None

def main():
    all_videos = []
    
    scraper = cloudscraper.create_scraper(browser={
        'browser': 'chrome',
        'platform': 'windows',
        'desktop': True
    })

    print(f"\n[Fes×LIVE] のデータを取得中... ({URL})")

    max_retries = 3
    retry_count = 0
    success = False

    while retry_count < max_retries and not success:
        try:
            response = scraper.get(URL)
            
            if response.status_code == 429:
                wait_time = 15 * (retry_count + 1)
                print(f"  ⚠️ 429エラー: アクセス制限を検知しました。{wait_time}秒待機して再試行します... ({retry_count + 1}/{max_retries})")
                time.sleep(wait_time)
                retry_count += 1
                continue
            
            if response.status_code != 200:
                print(f"❌ エラー発生: HTTPステータスコード {response.status_code}")
                break
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 「h2_content_1_4」のアンカータグを探す
            start_anchor = soup.find(id="h2_content_1_4")
            if not start_anchor:
                print("❌ 'h2_content_1_4' が見つかりませんでした。")
                break
                
            start_node = start_anchor if start_anchor.name in ['h2', 'h3', 'h4'] else start_anchor.find_parent(['h2', 'h3', 'h4', 'div'])
            if not start_node:
                start_node = start_anchor
                
            current_video = None
            extracted_count = 0
            
            for elem in start_node.find_next_siblings():
                
                # 次の大見出し（h2）が来たら対象エリア終了
                if elem.name == 'h2':
                    break
                
                # h3タグが来たら、新しいFes×LIVEの開始
                if elem.name == 'h3':
                    # 1つ前の動画データを保存する
                    if current_video and current_video["raw_title_node"]:
                        current_video["is_official"] = bool(current_video["youtubeUrl"].strip())
                        if current_video["youtubeUrl"]:
                            video_id = get_youtube_video_id(current_video["youtubeUrl"])
                            if video_id:
                                current_video["thumbnailUrl"] = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"

                        all_videos.append(current_video)
                        extracted_count += 1

                    h3_text = elem.get_text(strip=True)
                    date_str = ""
                    title_str = h3_text
                    season_str = "Fes×LIVE"

                    # 見出しから日付とタイトルを分離抽出
                    match = re.match(r"(\d{4})[年/]\s*(\d{1,2})[月/]\s*(\d{1,2})(.*)", h3_text)
                    if match:
                        y, m, d = int(match.group(1)), int(match.group(2)), int(match.group(3))
                        date_str = f"{y}/{m:02d}/{d:02d}"
                        title_str = match.group(4).strip()
                        # もしタイトルが「」で囲まれていたら外す
                        title_str = re.sub(r'^「(.*?)」$', r'\1', title_str)
                        
                        school_year = y - 1920
                        if m < 4: school_year -= 1
                        season_str = str(school_year)
                        
                    current_video = {
                        "id": str(uuid.uuid4()),
                        "season": season_str,
                        "type": "fes_live",
                        "date": date_str,
                        "title": title_str,
                        "participants": "",
                        "youtubeUrl": "",
                        "thumbnailUrl": "",
                        "description": "",
                        "raw_title_node": h3_text,
                        "is_official": False
                    }

                # テーブルの解析
                if current_video:
                    tables = elem.find_all('table') if hasattr(elem, 'find_all') else []
                    if elem.name == 'table':
                        tables = [elem]
                        
                    for table in tables:
                        rows = table.find_all('tr')
                        for i in range(len(rows)):
                            th = rows[i].find('th')
                            td = rows[i].find('td')
                            
                            # 縦並びパターンへの対応
                            if th and not td and i + 1 < len(rows):
                                next_td = rows[i+1].find('td')
                                if next_td and not rows[i+1].find('th'):
                                    td = next_td

                            if th and td:
                                header_text = th.get_text(strip=True)
                                
                                # 参加メンバー
                                if "参加メンバー" in header_text or "出演" in header_text:
                                    # <br>を「・」に変換して取得
                                    for br in td.find_all('br'):
                                        br.replace_with('・')
                                    parts = [p.strip() for p in td.get_text().split('・')]
                                    current_video["participants"] = '・'.join(filter(None, parts))
                                
                                # 配信日（h3よりこちらを優先して正確な日付にする）
                                elif "配信日" in header_text:
                                    raw_date = td.get_text(strip=True)
                                    date_match = re.search(r'(\d{4})[年/]\s*(\d{1,2})[月/]\s*(\d{1,2})', raw_date)
                                    if date_match:
                                        y, m, d = int(date_match.group(1)), int(date_match.group(2)), int(date_match.group(3))
                                        current_video["date"] = f"{y}/{m:02d}/{d:02d}"
                                        
                                        school_year = y - 1920
                                        if m < 4: school_year -= 1
                                        current_video["season"] = str(school_year)
                                    else:
                                        # 正規表現にマッチしなかった場合の保険
                                        if not current_video["date"]:
                                            current_video["date"] = raw_date
                                            
                                # YouTube URL
                                elif "動画URL" in header_text:
                                    a_tag = td.find('a')
                                    if a_tag:
                                        current_video["youtubeUrl"] = a_tag.get('href', '')
                                        
                                # セットリスト（descriptionとして扱う）
                                elif "セットリスト" in header_text:
                                    # <br class="spacer"> 等を含むすべての <br> を改行に置換
                                    for br in td.find_all('br'):
                                        br.replace_with('\n')
                                    # 改行区切りでテキストを取得し、余分な空白行を消す
                                    desc_text = td.get_text(separator='\n')
                                    lines = [line.strip() for line in desc_text.split('\n')]
                                    current_video["description"] = '\n'.join([line for line in lines if line])

            # 最後の1件を保存する
            if current_video and current_video["raw_title_node"]:
                current_video["is_official"] = bool(current_video["youtubeUrl"].strip())
                if current_video["youtubeUrl"]:
                    video_id = get_youtube_video_id(current_video["youtubeUrl"])
                    if video_id:
                        current_video["thumbnailUrl"] = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
                
                all_videos.append(current_video)
                extracted_count += 1

            print(f"  ✅ {extracted_count} 件のFes×LIVEデータを抽出しました。")
            success = True
            
        except Exception as e:
            print(f"❌ リクエスト例外が発生しました: {e}\n")
            break

    output_dir = 'data'
    os.makedirs(output_dir, exist_ok=True)
    output_filename = os.path.join(output_dir, 'feslive_wiki_data.json')
    
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(all_videos, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 取得完了！ 合計 {len(all_videos)} 件のデータを '{output_filename}' に保存しました。")

if __name__ == '__main__':
    main()