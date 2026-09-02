# backend/archive_series.py
import os
import sys
import glob
import subprocess
import re
import json
from datetime import datetime

def get_chromium_path():
    pattern = os.path.expanduser("~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome")
    matches = glob.glob(pattern)
    if matches:
        return sorted(matches)[-1]
    return None

def extract_meta(output_path):
    title = "タイトルを取得できませんでした"
    description = "ここに説明を入力"
    try:
        with open(output_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # <title>の抽出
            t_match = re.search(r'<title[^>]*>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
            if t_match:
                title = t_match.group(1).strip()
            
            # <meta name="description"> または og:description の抽出（属性の順序違いにも対応）
            d_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', content, re.IGNORECASE)
            if not d_match:
                d_match = re.search(r'<meta[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']', content, re.IGNORECASE)
            if not d_match:
                d_match = re.search(r'<meta[^>]*property=["\']og:description["\'][^>]*content=["\'](.*?)["\']', content, re.IGNORECASE)
            if not d_match:
                d_match = re.search(r'<meta[^>]*content=["\'](.*?)["\'][^>]*property=["\']og:description["\']', content, re.IGNORECASE)
                
            if d_match:
                description = d_match.group(1).strip()
                
    except Exception:
        pass
    return title, description

def archive_series(series_id: str, urls: list):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    target_dir = os.path.join(project_root, "public", "archives")
    
    os.makedirs(target_dir, exist_ok=True)

    browser_path = get_chromium_path()
    if not browser_path:
        print("❌ Playwright 版 Chromium が見つかりません。")
        sys.exit(1)
    
    print(f"🔄 連載記事のアーカイブを開始します (ID: {series_id})")
    print(f"対象URL数: {len(urls)}件")
    
    parts = []
    series_title = ""
    series_desc = ""

    for i, url in enumerate(urls):
        part_num = i + 1
        output_filename = f"{series_id}-{part_num}.html"
        output_path = os.path.join(target_dir, output_filename)
        
        print(f"\n[{part_num}/{len(urls)}] ダウンロード中: {url}")
        
        command = [
            "npx",
            "single-file-cli",
            url,
            output_path,
            "--browser-executable-path", browser_path,
            "--browser-args", '["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--headless=new"]'
        ]
        
        result = subprocess.run(command)
        if result.returncode != 0:
            print(f"❌ 失敗しました (エラーコード: {result.returncode})")
            continue
        
        print(f"✅ 保存完了: {output_filename}")
        
        # 保存したHTMLからメタデータを抽出
        title, desc = extract_meta(output_path)
        
        # 1件目のタイトルと説明を「シリーズ全体」の代表として採用
        if i == 0:
            series_title = title
            series_desc = desc
            
        parts.append({
            "label": f"第{part_num}回: {title}",
            "url": f"/archives/{output_filename}"
        })

    if not parts:
        print("\n❌ 1件も取得できませんでした。")
        return

    # --- JSONへの自動追記・更新処理 ---
    json_path = os.path.join(project_root, "src", "components", "related", "data", "articles.json")
    today = datetime.now().strftime("%Y-%m-%d")
    
    articles = []
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                articles = json.load(f)
        except Exception as e:
            print(f"⚠️ JSON読み込みエラー: {e}")

    updated = False
    for article in articles:
        # 指定された series_id と同じものがあれば上書き
        if article.get("id") == series_id:
            article["parts"] = parts # 最新のURLリストに更新
            
            # まだ説明が手入力されていない（初期値のまま）場合のみ、再抽出したものを入れる
            if article.get("description") == "ここに説明を入力" or not article.get("description"):
                article["description"] = series_desc
                
            updated = True
            print(f"\n🔄 既存の連載データ(ID: {series_id})にコンテンツを統合しました。")
            break
            
    if not updated:
        # 存在しない場合は新規作成
        new_article = {
            "id": series_id,
            "title": series_title,
            "description": series_desc,
            "publishedDate": today,
            "category": "メディア",
            "parts": parts
        }
        articles.append(new_article)
        print(f"\n✨ 新規連載データを追加しました(ID: {series_id})。")

    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)
        print(f"📝 {json_path} の保存が完了しました！")
        print("※ シリーズのタイトル(title)は1件目のページ名になっています。必要に応じてJSONで手直ししてください。")
    except Exception as e:
        print(f"❌ JSONの書き込みに失敗しました: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("使い方: python backend/archive_series.py <シリーズID> <URL1> <URL2> <URL3> ...")
        sys.exit(1)
        
    series_id = sys.argv[1]
    target_urls = sys.argv[2:]
    archive_series(series_id, target_urls)