# backend/archive.py
import os
import sys
import glob
import subprocess
import re
import json
import gzip
import tempfile
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage as gcs_storage

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# サービスアカウント鍵の探索
candidate_paths = [
    os.path.join(BASE_DIR, "serviceAccountKey.json"),
    os.path.join(PROJECT_ROOT, "serviceAccountKey.json"),
    os.path.join(os.getcwd(), "serviceAccountKey.json")
]

service_account_path = None
for path in candidate_paths:
    if os.path.exists(path):
        service_account_path = path
        break

if not service_account_path:
    raise FileNotFoundError("❌ backend/serviceAccountKey.json が見つかりません。")

cred = credentials.Certificate(service_account_path)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
gcs_client = gcs_storage.Client.from_service_account_json(service_account_path)

def get_target_bucket():
    """ プロジェクト内の Storage バケットを自動判別 """
    buckets = list(gcs_client.list_buckets())
    if not buckets:
        raise ValueError("❌ Storage バケットが見つかりません。")
    for b in buckets:
        if "hasulog" in b.name:
            return b
    return buckets[0]

def get_chromium_path():
    pattern = os.path.expanduser("~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome")
    matches = glob.glob(pattern)
    if matches:
        return sorted(matches)[-1]
    return None

def extract_meta(html_text: str):
    title = "タイトルを取得できませんでした"
    description = "ここに説明を入力"
    try:
        t_match = re.search(r'<title[^>]*>(.*?)</title>', html_text, re.IGNORECASE | re.DOTALL)
        if t_match:
            title = t_match.group(1).strip()

        patterns = [
            r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']',
            r'<meta[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']',
            r'<meta[^>]*property=["\']og:description["\'][^>]*content=["\'](.*?)["\']',
            r'<meta[^>]*content=["\'](.*?)["\'][^>]*property=["\']og:description["\']'
        ]
        for p in patterns:
            d_match = re.search(p, html_text, re.IGNORECASE)
            if d_match:
                description = d_match.group(1).strip()
                break
    except Exception:
        pass
    return title, description

def clean_title(title: str) -> str:
    t = title.split('|')[0].strip()
    t = re.sub(r'【前編】|【後編】|（前編）|（後編）', '', t).strip()
    return t

def capture_and_upload(url: str, filename_base: str, browser_path: str, bucket):
    """ SingleFileで保存 -> Gzip圧縮 -> Storageへアップロード -> メタデータ返却 """
    with tempfile.TemporaryDirectory() as temp_dir:
        output_html = os.path.join(temp_dir, f"{filename_base}.html")
        gz_output_path = f"{output_html}.gz"

        print(f"📥 取得中: {url}")
        command = [
            "npx", "single-file-cli", url, output_html,
            "--browser-executable-path", browser_path,
            "--load-deferred-images",
            "--load-deferred-images-dispatch-scroll-event",
            "--browser-wait-delay", "2000",
            "--remove-unused-fonts",
            "--remove-video-src",
            "--remove-audio-src",
            "--browser-args", '["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--headless=new"]'
        ]

        result = subprocess.run(command)
        if result.returncode != 0 or not os.path.exists(output_html):
            print(f"❌ キャプチャに失敗しました (code: {result.returncode})")
            return None, None, None

        with open(output_html, 'r', encoding='utf-8', errors='ignore') as f:
            html_content = f.read()

        title, desc = extract_meta(html_content)

        # Gzip圧縮
        print("📦 Gzip圧縮中...")
        with open(output_html, 'rb') as f_in:
            with gzip.open(gz_output_path, 'wb', compresslevel=9) as f_out:
                f_out.writelines(f_in)

        # Storage アップロード
        target_filename = f"{filename_base}.html.gz"
        blob_path = f"archives/{target_filename}"
        blob = bucket.blob(blob_path)
        blob.content_type = "text/html; charset=utf-8"
        blob.content_encoding = "gzip"

        size_kb = os.path.getsize(gz_output_path) / 1024
        print(f"🚀 Storage アップロード中: {blob_path} ({size_kb:.1f} KB)...")
        blob.upload_from_filename(gz_output_path)

        try:
            blob.make_public()
            public_url = blob.public_url
        except Exception:
            public_url = f"https://storage.googleapis.com/{bucket.name}/{blob_path}"

        # Firestore (article_archives) にもバックアップ
        db.collection("article_archives").document(filename_base).set({
            "id": filename_base,
            "filename": target_filename,
            "bucket": bucket.name,
            "storagePath": blob_path,
            "url": public_url,
            "sizeBytes": os.path.getsize(gz_output_path),
            "updatedAt": firestore.SERVER_TIMESTAMP
        }, merge=True)

        return target_filename, title, desc

def run_archive(article_id: str, urls: list):
    browser_path = get_chromium_path()
    if not browser_path:
        print("❌ Playwright 版 Chromium が見つかりません。")
        sys.exit(1)

    bucket = get_target_bucket()
    print(f"🎯 保存先Storageバケット: {bucket.name}")

    clean_id = article_id.replace(".html.gz", "").replace(".html", "")
    json_path = os.path.join(PROJECT_ROOT, "src", "components", "related", "data", "articles.json")
    today = datetime.now().strftime("%Y-%m-%d")

    articles = []
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                articles = json.load(f)
        except Exception as e:
            print(f"⚠️ 既存JSONの読み込みエラー: {e}")

    # ==========================
    # パターン1: URLが1つの場合
    # ==========================
    if len(urls) == 1:
        url = urls[0]
        print(f"\n📄 [単一記事アーカイブ] ID: {clean_id}")
        target_filename, title, desc = capture_and_upload(url, clean_id, browser_path, bucket)
        if not target_filename:
            return

        updated = False
        for article in articles:
            if article.get("id") == clean_id or article.get("originalUrl") == url:
                article["id"] = clean_id
                article["contentUrl"] = f"/archives/{target_filename}"
                if article.get("description") == "ここに説明を入力" or not article.get("description"):
                    article["description"] = desc
                updated = True
                print(f"🔄 既存記事データ(ID: {clean_id})を更新しました。")
                break

        if not updated:
            new_article = {
                "id": clean_id,
                "originalUrl": url,
                "title": title,
                "description": desc,
                "publishedDate": today,
                "category": "メディア",
                "contentUrl": f"/archives/{target_filename}"
            }
            articles.append(new_article)
            print(f"✨ 新規記事データを追加しました (ID: {clean_id})")

    # ==========================
    # パターン2: URLが2つ以上の場合（連載）
    # ==========================
    else:
        print(f"\n📚 [連載アーカイブ] ID: {clean_id} (対象: {len(urls)} 件)")
        parts = []
        item_title = ""
        item_desc = ""

        for i, url in enumerate(urls):
            part_num = i + 1
            part_filename_base = f"{clean_id}-{part_num}"
            print(f"\n--- [{part_num}/{len(urls)}] ---")
            target_filename, title, desc = capture_and_upload(url, part_filename_base, browser_path, bucket)
            
            if not target_filename:
                continue

            if i == 0:
                item_title = clean_title(title)
                item_desc = desc

            parts.append({
                "label": f"第{part_num}ページ",
                "url": f"/archives/{target_filename}"
            })

        if not parts:
            print("\n❌ 1件も保存できませんでした。")
            return

        updated = False
        for article in articles:
            if article.get("id") == clean_id:
                article["parts"] = parts
                if article.get("description") == "ここに説明を入力" or not article.get("description"):
                    article["description"] = item_desc
                updated = True
                print(f"\n🔄 既存連載データ(ID: {clean_id})を更新しました。")
                break

        if not updated:
            new_article = {
                "id": clean_id,
                "title": item_title,
                "description": item_desc,
                "publishedDate": today,
                "category": "メディア",
                "source": "WEBメディア",
                "parts": parts
            }
            articles.append(new_article)
            print(f"\n✨ 新規連載データを追加しました (ID: {clean_id})")

    # JSON保存
    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)
        print(f"\n📝 {json_path} の更新が完了しました！")
    except Exception as e:
        print(f"❌ JSON保存失敗: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("使い方:")
        print("  単一記事: python backend/archive.py <記事ID> <URL>")
        print("  連載記事: python backend/archive.py <連載ID> <URL1> <URL2> <URL3> ...")
        sys.exit(1)

    # 引数の解釈: 最初のURLでないものを ID と判定
    if sys.argv[1].startswith("http://") or sys.argv[1].startswith("https://"):
        target_urls = [sys.argv[1]]
        target_id = sys.argv[2]
    else:
        target_id = sys.argv[1]
        target_urls = sys.argv[2:]

    run_archive(target_id, target_urls)