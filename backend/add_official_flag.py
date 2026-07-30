import json
import os

# jsonファイルのパス（前回修正したパス）
json_path = 'data/withmeets_wiki_data.json'

def update_json_flags():
    # 1. 既存のJSONを読み込む
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 2. 各データにフラグを追加する
    for item in data:
        # 🌟修正: キー名を 'url' から 'youtubeUrl' に変更
        # youtubeUrlにURL文字列が入っていればTrue、""(空文字)ならFalseになります
        if item.get('youtubeUrl'): 
            item['is_official'] = True
        else:
            item['is_official'] = False

    # 3. 更新したデータを上書き保存する
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    print("✅ すべてのデータに is_official フラグを正しく追加・修正しました！")

if __name__ == "__main__":
    update_json_flags()