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


def extract_minimal_payload(stream: dict) -> tuple[str, dict] | tuple[None, None]:
    """
    descriptionなどの長文を除外し、動画ID・タイトル・表示・集計に必要な
    最低限のフィールドのみを抽出する
    """
    stream_id = stream.get("id")
    if not stream_id:
        return None, None

    # 最低限必要な主要フィールド
    payload = {
        "id": stream_id,
        "title": stream.get("title", ""),
    }

    # システムやカード描画に必要な最低限の属性のみ追加（存在する場合のみ）
    optional_fields = [
        "season",         # 例: '103', '104'
        "type",           # 例: 'with_meets', 'story', 'fes_live'
        "date",           # 例: '2023-04-15'
        "youtubeUrl",     # YouTube URL
        "thumbnailUrl",   # サムネイル
        "participants",   # 参加メンバー
        "is_official",    # 公式フラグ
    ]

    for field in optional_fields:
        if field in stream and stream[field] is not None:
            payload[field] = stream[field]

    return stream_id, payload


def load_all_json_data() -> dict[str, dict]:
    """対象JSONから最低限のデータを抽出し、ID単位で重複をまとめる"""
    streams_map = {}
    
    for filename in JSON_FILES:
        filepath = os.path.join(DATA_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                loaded_count = 0
                for item in data:
                    if not isinstance(item, dict):
                        continue
                    stream_id, payload = extract_minimal_payload(item)
                    if stream_id:
                        streams_map[stream_id] = payload
                        loaded_count += 1
                print(f"📄 読み込み完了: {filename} ({loaded_count} 件 抽出)")
        else:
            print(f"⚠️ スキップ（見つかりません）: {filename}")
            
    return streams_map


def upload_streams():
    streams_map = load_all_json_data()
    total_streams = len(streams_map)
    print(f"\n🚀 合計 {total_streams} 件（最低限データ）をFirestore（streamsコレクション）に送信・更新します...")

    if total_streams == 0:
        print("送信対象のデータがありませんでした。")
        return

    batch = db.batch()
    batch_count = 0
    total_uploaded = 0

    for stream_id, stream_doc_data in streams_map.items():
        doc_ref = db.collection("streams").document(stream_id)
        
        # merge=True で既存の視聴回数（viewCount等）を保持したままメタデータのみ更新・新規追加
        batch.set(doc_ref, stream_doc_data, merge=True)
        batch_count += 1
        total_uploaded += 1

        # Firestoreのバッチ上限（500件）ごとにコミット
        if batch_count >= 450:
            batch.commit()
            print(f"⏳ {total_uploaded} / {total_streams} 件 送信完了...")
            batch = db.batch()
            batch_count = 0

    if batch_count > 0:
        batch.commit()

    print(f"\n🎉 全 {total_uploaded} 件のデータ送信・更新が完了しました！")


if __name__ == "__main__":
    upload_streams()