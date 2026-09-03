# backend/archive.py
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
            
            # description または og:description の抽出
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

def archive_page(article_id: str, url: str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    target_dir = os.path.join(project_root, "public", "archives")
    
    os.makedirs(target_dir, exist_ok=True)
    
    # .html 拡張子の自動補正
    clean_id = article_id.replace(".html", "")
    output_filename = f"{clean_id}.html"
    output_path = os.path.join(target_dir, output_filename)

    browser_path = get_chromium_path()
    if not browser_path:
        print("❌ Playwright 版 Chromium が見つかりません。")
        sys.exit(1)
    
    print(f"🔄 アーカイブを開始します (ID: {clean_id})")
    print(f"URL: {url}")
    print(f"出力先: {output_path}")

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
        print(f"\n❌ アーカイブに失敗しました (エラーコード: {result.returncode})")
        return

    print("\n✅ アーカイブ成功！HTMLを保存しました。")
    
    # HTMLからタイトルと説明を自動抽出
    title, desc = extract_meta(output_path)

    # --- JSONへの自動追記・更新処理 ---
    json_path = os.path.join(project_root, "src", "components", "related", "data", "articles.json")
    today = datetime.now().strftime("%Y-%m-%d")
    
    articles = []
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                articles = json.load(f)
        except Exception as e:
            print(f"⚠️ 既存JSONの読み込みに失敗しました: {e}")

    updated = False
    for article in articles:
        # ID または元のURLで既存データを判定
        if article.get("id") == clean_id or article.get("originalUrl") == url:
            article["id"] = clean_id
            article["title"] = title
            article["contentUrl"] = f"/archives/{output_filename}"
            if article.get("description") == "ここに説明を入力" or not article.get("description"):
                article["description"] = desc
            updated = True
            print(f"🔄 既存の記事データを更新しました (ID: {clean_id})")
            break
            
    if not updated:
        new_article = {
            "id": clean_id,
            "originalUrl": url,
            "title": title,
            "description": desc,
            "publishedDate": today,
            "category": "メディア",
            "contentUrl": f"/archives/{output_filename}"
        }
        articles.append(new_article)
        print(f"✨ 新規記事データを追加しました (ID: {clean_id})")

    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)
        print(f"📝 {json_path} の保存が完了しました！")
    except Exception as e:
        print(f"❌ JSONの書き込みに失敗しました: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("使い方: python backend/archive.py <記事ID> <URL>")
        sys.exit(1)
        
    arg1 = sys.argv[1]
    arg2 = sys.argv[2]
    
    # URLとIDの指定順が逆でも自動判定
    if arg1.startswith("http://") or arg1.startswith("https://"):
        url = arg1
        article_id = arg2
    else:
        article_id = arg1
        url = arg2
        
    archive_page(article_id, url)