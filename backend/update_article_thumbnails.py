# backend/update_article_thumbnails.py
import os
import sys
import json
import re

try:
    from BeautifulSoup import BeautifulSoup
except ImportError:
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        print("❌ BeautifulSoup4 がインストールされていません。")
        print("ターミナルで 'pip install beautifulsoup4' を実行してから再度お試しください。")
        sys.exit(1)

def extract_image_from_html(html_path):
    """HTMLからサムネイル画像を抽出する"""
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        soup = BeautifulSoup(content, 'html.parser')

        # 🌟 0. 最優先: eyecatch系プレースホルダー、l-article-eyecatch、m-article-eyecatch-content-link 内の画像を探す
        eyecatch_img = soup.select_one(
            '.eyecatch-placeholder img, #eyecatch-placeholder img, '
            '.l-article-eyecatch img, #l-article-eyecatch img, '
            '.m-article-eyecatch-content-link img'
        )
        if eyecatch_img and eyecatch_img.get('src'):
            parent_str = ""
            for parent in eyecatch_img.parents:
                parent_str += str(parent.get('class', [])) + str(parent.get('id', ''))

            source_label = "eyecatch-placeholder"
            if 'l-article-eyecatch' in parent_str:
                source_label = "l-article-eyecatch"
            elif 'm-article-eyecatch-content-link' in parent_str:
                source_label = "m-article-eyecatch-content-link"

            return eyecatch_img.get('src').strip(), source_label

        # 1. 次に og:image を探す
        match = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\'](.*?)["\']', content, re.IGNORECASE)
        if not match:
            match = re.search(r'<meta[^>]*content=["\'](.*?)["\'][^>]*property=["\']og:image["\']', content, re.IGNORECASE)
        
        if match:
            return match.group(1).strip(), "og:image"

        # 2. og:image がない場合、コンテンツ内の1枚目の画像を探す
        for img in soup.find_all('img'):
            src = img.get('src')
            if not src:
                continue

            is_in_header = False
            for parent in img.parents:
                classes = parent.get('class', [])
                if isinstance(classes, str):
                    classes = [classes]
                
                if classes and any('detail__header' in c.lower() for c in classes):
                    continue 

                if parent.name == 'header':
                    is_in_header = True
                    break
                
                if classes and any('header' in c.lower() for c in classes):
                    is_in_header = True
                    break
            
            if not is_in_header:
                return src.strip(), "コンテンツ内の1枚目"

        return None, ""

    except Exception as e:
        print(f"❌ HTML読み込みエラー ({html_path}): {e}")
        return None, ""


def update_thumbnails():
    # パス解決
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    json_path = os.path.join(project_root, "src", "components", "related", "data", "articles.json")

    # JSON読み込み
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            articles = json.load(f)
    except Exception as e:
        print(f"❌ JSONの読み込みに失敗しました: {e}")
        return

    updated_count = 0
    print("🔄 サムネイルの抽出・更新チェックを開始します...\n")

    for article in articles:
        # ターゲットとなるローカルHTMLのURLパスを特定
        target_url = None
        if article.get("contentUrl"):
            target_url = article.get("contentUrl")
        elif article.get("parts") and len(article["parts"]) > 0:
            target_url = article["parts"][0]["url"]

        if not target_url:
            continue

        # ローカルファイルの絶対パスを構築
        local_html_path = os.path.join(project_root, "public", target_url.lstrip('/'))

        if os.path.exists(local_html_path):
            new_img_url, extract_type = extract_image_from_html(local_html_path)
            
            if new_img_url:
                current_img_url = article.get("thumbnailUrl", "")
                
                # 🌟 既存のURLの有無にかかわらず、取得できた新しい画像URLが現在の値と異なる（または未設定）なら常に更新する
                if current_img_url != new_img_url:
                    article["thumbnailUrl"] = new_img_url
                    updated_count += 1
                    
                    display_url = new_img_url[:60] + "..." if len(new_img_url) > 60 else new_img_url
                    print(f"✅ 更新({extract_type}): {article['title'][:20]}...")
                    print(f"   -> {display_url}")
                else:
                    pass 
            else:
                print(f"⚠️ 画像が一切見つかりません: {article['title'][:20]}...")
        else:
            print(f"⚠️ HTMLファイルが存在しません: {local_html_path}")

    # JSONへ書き戻し
    if updated_count > 0:
        try:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(articles, f, ensure_ascii=False, indent=2)
            print(f"\n🎉 {updated_count}件のサムネイルを更新し、articles.json に保存しました！")
        except Exception as e:
            print(f"❌ JSONの保存に失敗しました: {e}")
    else:
        print("\n✨ 更新が必要なサムネイルはありませんでした。")

if __name__ == "__main__":
    update_thumbnails()