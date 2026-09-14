import json
import os
import uuid

# 対象のJSONファイルパス（環境に合わせて適宜変更してください）
JSON_FILE_PATH = "streams.json"

# 追加するデータ
new_entry = {
    "id": str(uuid.uuid4()),
    "season": "106Autumn",
    "type": "with_meets",
    "date": "2026/09/13",
    "title": "姫芽のASMR",
    "participants": "安養寺姫芽",
    "youtubeUrl": "https://youtu.be/c-pL3BlxZmY",
    "thumbnailUrl": "https://i.ytimg.com/vi/c-pL3BlxZmY/maxresdefault.jpg",
    "description": "【SOUND ONLY #With蓮ノ空】ダミーヘッドマイクを使用した安養寺姫芽のASMR配信。前半は肩こり解消のストレッチを一緒に行い、後半はホラーゲーム実況に挑戦。",
    "raw_title_node": "2026/09/13 「姫芽のASMR」",
    "is_official": True
}

def add_stream_entry(file_path: str, entry: dict):
    if not os.path.exists(file_path):
        data = []
    else:
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = []

    # 重複チェック（youtubeUrlのIDが既に存在するか確認）
    existing_urls = [item.get("youtubeUrl", "") for item in data]
    if entry["youtubeUrl"] in existing_urls:
        print(f"スキップ: 既に登録済みの動画です ({entry['youtubeUrl']})")
        return

    # データを末尾に追加
    data.append(entry)

    # 日付昇順でソートする場合は以下を有効化してください
    # data.sort(key=lambda x: x.get("date", ""))

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f"追加完了: 「{entry['title']}」({entry['date']}) を {file_path} に書き込みました。")

if __name__ == "__main__":
    add_stream_entry(JSON_FILE_PATH, new_entry)