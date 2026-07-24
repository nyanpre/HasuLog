import cloudscraper
from bs4 import BeautifulSoup
import json
import time
import uuid
import re
import os

URLS = [
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/103Spring",
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/103Summer",
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/103Autumn",
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/103Winter",
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/104Spring",
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/104Summer",
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/104Autumn",
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/104Winter",
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/105Spring",
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/105Summer",
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/105Autumn",
    "https://wikiwiki.jp/llll_wiki/With%C3%97MEETS/105Winter"
]

def main():
    all_videos = []
    
    scraper = cloudscraper.create_scraper(browser={
        'browser': 'chrome',
        'platform': 'windows',
        'desktop': True
    })

    for url in URLS:
        season_name = url.split('/')[-1]
        print(f"\n[{season_name}] のデータを取得中...")

        # 429エラー時の再試行（リトライ）設定
        max_retries = 3
        retry_count = 0
        success = False

        while retry_count < max_retries and not success:
            try:
                response = scraper.get(url)
                
                # 429エラーの場合は長めに待機して再試行
                if response.status_code == 429:
                    wait_time = 15 * (retry_count + 1)
                    print(f"  ⚠️ 429エラー: アクセス制限を検知しました。{wait_time}秒待機して再試行します... ({retry_count + 1}/{max_retries})")
                    time.sleep(wait_time)
                    retry_count += 1
                    continue
                
                if response.status_code != 200:
                    print(f"❌ エラー発生: HTTPステータスコード {response.status_code}")
                    break # 429以外のエラーはループを抜けて次のURLへ
                
                soup = BeautifulSoup(response.content, 'html.parser')
                ul_elements = soup.find_all('ul', class_='list1')
                extracted_count = 0
                
                for ul in ul_elements:
                    li_elements = ul.find_all('li', recursive=False)
                    
                    for li in li_elements:
                        li_text_node = li.find(string=True, recursive=False)
                        title_full = li_text_node.strip() if li_text_node else ""
                        
                        date_str = ""
                        title_str = title_full
                        match = re.match(r"(\d{4}/\d{2}/\d{2})\s*「?(.*?)」?$", title_full)
                        if match:
                            date_str = match.group(1)
                            title_str = match.group(2)
                        
                        img_tag = li.find('img')
                        thumb_url = img_tag.get('src', '') if img_tag else ""
                        
                        participants = ""
                        youtube_url = ""
                        description = ""
                        
                        tables = li.find_all('table')
                        for table in tables:
                            rows = table.find_all('tr')
                            for i in range(len(rows) - 1):
                                th = rows[i].find('th')
                                if th:
                                    header_text = th.get_text(strip=True)
                                    td = rows[i+1].find('td')
                                    if td:
                                        if "参加メンバー" in header_text:
                                            participants = td.get_text(strip=True)
                                        elif "アーカイブ" in header_text:
                                            a_tag = td.find('a')
                                            if a_tag:
                                                youtube_url = a_tag.get('href', '')
                                        elif "配信概要" in header_text:
                                            for br in td.find_all('br'):
                                                br.replace_with('\n')
                                            description = td.get_text(strip=True)

                        if title_full and (youtube_url or participants or date_str):
                            video_data = {
                                "id": str(uuid.uuid4()),
                                "season": season_name,
                                "type": "with_meets",
                                "date": date_str,
                                "title": title_str,
                                "participants": participants,
                                "youtubeUrl": youtube_url,
                                "thumbnailUrl": thumb_url,
                                "description": description,
                                "raw_title_node": title_full 
                            }
                            all_videos.append(video_data)
                            extracted_count += 1

                print(f"  ✅ {extracted_count} 件のデータを抽出しました。")
                success = True # 成功したのでリトライループを抜ける
                
                # 通常時の待機時間を5秒に延長し、制限に引っかかりにくくする
                time.sleep(5)

            except Exception as e:
                print(f"❌ リクエスト例外が発生しました ({url}): {e}\n")
                break

    output_dir = 'data'
    os.makedirs(output_dir, exist_ok=True)
    output_filename = os.path.join(output_dir, 'withmeets_wiki_data.json')
    
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(all_videos, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 取得完了！ 合計 {len(all_videos)} 件のデータを '{output_filename}' に保存しました。")

if __name__ == '__main__':
    main()