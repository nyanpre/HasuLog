# backend/compress_existing_archives.py
import os
import glob
import gzip
import json

def compress_existing_htmls():
    # パス解決
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    archives_dir = os.path.join(project_root, "public", "archives")
    json_path = os.path.join(project_root, "src", "components", "related", "data", "articles.json")

    # 1. 既存の HTML ファイルを検索して Gzip 圧縮
    html_files = glob.glob(os.path.join(archives_dir, "*.html"))
    
    if not html_files:
        print("📭 圧縮対象の .html ファイルが見つかりませんでした。")
    else:
        print(f"📦 {len(html_files)} 件の .html ファイルを Gzip に圧縮します...\n")
        for html_path in html_files:
            gz_path = f"{html_path}.gz"
            try:
                # 圧縮処理
                with open(html_path, 'rb') as f_in:
                    with gzip.open(gz_path, 'wb', compresslevel=9) as f_out:
                        f_out.writelines(f_in)
                
                # 圧縮が成功したら元の .html を削除
                os.remove(html_path)
                print(f"✅ 圧縮完了: {os.path.basename(gz_path)}")
            except Exception as e:
                print(f"❌ 圧縮エラー ({os.path.basename(html_path)}): {e}")

    # 2. articles.json の URL パスを .gz 拡張子に一括更新
    print("\n📝 articles.json の URL を .gz 向けに更新します...")
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                articles = json.load(f)

            updated_count = 0
            for article in articles:
                # contentUrl（単発記事）の更新
                if article.get("contentUrl") and article["contentUrl"].endswith(".html"):
                    article["contentUrl"] = article["contentUrl"] + ".gz"
                    updated_count += 1
                
                # parts（連載・複数ページ記事）の更新
                if article.get("parts"):
                    for part in article["parts"]:
                        if part.get("url") and part["url"].endswith(".html"):
                            part["url"] = part["url"] + ".gz"
                            updated_count += 1

            # 変更があった場合のみ保存
            if updated_count > 0:
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(articles, f, ensure_ascii=False, indent=2)
                print(f"🎉 articles.json 内の {updated_count} 箇所の URL を '.html.gz' に書き換えました！")
            else:
                print("✨ articles.json 内に更新が必要な URL はありませんでした。")

        except Exception as e:
            print(f"❌ JSONの更新に失敗しました: {e}")
    else:
        print(f"⚠️ JSONファイルが存在しません: {json_path}")

if __name__ == "__main__":
    compress_existing_htmls()