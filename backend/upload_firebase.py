# backend/upload_firebase.py
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Firebase 初期化
cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
if not os.path.exists(cred_path):
    print("❌ serviceAccountKey.json が backend/ フォルダに見つかりません。")
    exit(1)

cred = credentials.Certificate(cred_path)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

DATA_DIR = os.path.join(os.path.dirname(__file__), "../src/data")
JSON_FILES = [
    "withmeets_wiki_data.json",
    "feslive_wiki_data.json",
    "withstation_wiki_data.json",
    "story_wiki_data.json"
]

def load_all_json_data():
    all_streams = []
    for filename in JSON_FILES:
        filepath = os.path.join(DATA_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                all_streams.extend(data)
                print(f"📄 読み込み完了: {filename} ({len(data)} 件)")
        else:
            print(f"⚠️ スキップ（見つかりません）: {filename}")
    return all_streams

def upload_streams():
    streams = load_all_json_data()
    print(f"\n🚀 合計 {len(streams)} 件のデータをFirestore（streamsコレクション）に送信・更新します...")

    batch = db.batch()
    batch_count = 0
    total_uploaded = 0

    for stream in streams:
        stream_id = stream.get("id")
        if not stream_id:
            continue

        # 送信するデータ構造を整理（不要なNoneを除去）
        stream_doc_data = {
            "id": stream_id,
            "season": stream.get("season", ""),
            "type": stream.get("type", ""),
            "date": stream.get("date", ""),
            "title": stream.get("title", ""),
            "participants": stream.get("participants", ""),
            "youtubeUrl": stream.get("youtubeUrl", ""),
            "thumbnailUrl": stream.get("thumbnailUrl", ""),
            "description": stream.get("description", ""),
            "is_official": stream.get("is_official", True)
        }

        # 任意フィールドの追加
        if "raw_title_node" in stream:
            stream_doc_data["raw_title_node"] = stream["raw_title_node"]
        if "extraYoutubeUrls" in stream:
            stream_doc_data["extraYoutubeUrls"] = stream["extraYoutubeUrls"]

        doc_ref = db.collection("streams").document(stream_id)
        # merge=True で既存フィールドを保持しつつ更新・追加
        batch.set(doc_ref, stream_doc_data, merge=True)
        batch_count += 1
        total_uploaded += 1

        # Firestoreのバッチ上限（500件）ごとにコミット
        if batch_count >= 450:
            batch.commit()
            print(f"⏳ {total_uploaded} / {len(streams)} 件 送信完了...")
            batch = db.batch()
            batch_count = 0

    if batch_count > 0:
        batch.commit()

    print(f"\n🎉 全 {total_uploaded} 件のマスターデータの送信・更新が完了しました！")

if __name__ == "__main__":
    upload_streams()