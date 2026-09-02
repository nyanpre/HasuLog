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

def archive_page(url: str, output_filename: str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    target_dir = os.path.join(project_root, "public", "archives")
    
    os.makedirs(target_dir, exist_ok=True)
    output_path = os.path.join(target_dir, output_filename)

    browser_path = get_chromium_path()
    if not browser_path:
        print("❌ Playwright 版 Chromium が見つかりません。")
        sys.exit(1)
    
    print(f"🔄 アーカイブを開始します...")
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
    
    # --- タイトルの抽出 ---
    page_title = "タイトルを取得できませんでした"
    try:
        with open(output_path, 'r', encoding='utf-8') as f:
            content = f.read()
            match = re.search(r'<title[^>]*>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
            if match:
                page_title = match.group(1).strip()
    except Exception:
        pass

    # --- JSONへの自動追記・更新処理 ---
    json_path = os.path.join(project_root, "src", "components", "related", "data", "articles.json")
    new_article_id = output_filename.replace(".html", "")
    today = datetime.now().strftime("%Y-%m-%d")
    
    # 既存データの読み込み
    articles = []
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                articles = json.load(f)
        except Exception as e:
            print(f"⚠️ 既存JSONの読み込みに失敗しました: {e}")

    updated = False
    for article in articles:
        # 🌟 元のURL (originalUrl) をキーにして既存データか判定
        if article.get("originalUrl") == url:
            # 既存データの場合は、タイトルとHTMLへのパスのみ最新化する
            # （手入力した description や category、固有の id, publishedDate は維持）
            article["title"] = page_title
            article["contentUrl"] = f"/archives/{output_filename}"
            updated = True
            print(f"🔄 既存の記事データを更新しました (ID: {article.get('id')})")
            break
            
    if not updated:
        # 🌟 存在しない場合は新規作成
        new_article = {
            "id": new_article_id,       # 固有ID（ファイル名をベースに生成）
            "originalUrl": url,         # 元のURL（今後の更新キー）
            "title": page_title,
            "description": "ここに説明を入力",
            "publishedDate": today,
            "category": "メディア",
            "contentUrl": f"/archives/{output_filename}"
        }
        articles.append(new_article)
        print(f"✨ 新規記事データを追加しました (ID: {new_article_id})")

    # JSONファイルへ書き出し
    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)
        print(f"📝 {json_path} の保存が完了しました！")
    except Exception as e:
        print(f"❌ JSONの書き込みに失敗しました: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("使い方: python backend/archive.py <URL> <出力ファイル名.html>")
        sys.exit(1)
        
    archive_page(sys.argv[1], sys.argv[2])