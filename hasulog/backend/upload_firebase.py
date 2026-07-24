import os
import json
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Firebaseコンソールからダウンロードしたサービスアカウントキーのパス
CRED_PATH = "serviceAccountKey.json"

def initialize_firestore():
    cred = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(cred)
    return firestore.client()

def upload_data(db, file_name):
    file_path = os.path.join('data', file_name)
    if not os.path.exists(file_path):
        print(f"⚠️ ファイルが見つかりません: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not data:
        print(f"⚠️ データが空です: {file_name}")
        return

    # 保存先のコレクション名を指定
    collection_ref = db.collection('streams')
    
    # バッチ処理で効率的にアップロード（上限500件を回避するため400件ずつ処理）
    batch = db.batch()
    count = 0

    try:
        for item in data:
            # スクリプトで生成した 'id' をFirestoreのドキュメントIDとしてそのまま使用
            doc_ref = collection_ref.document(item['id'])
            batch.set(doc_ref, item)
            count += 1
            
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()

        # 残りのデータをコミット
        if count % 400 != 0:
            batch.commit()
            
        print(f"✅ {count} 件のデータを {file_name} からアップロードしました！")
    except Exception as e:
        print(f"❌ アップロードエラー ({file_name}): {e}")

if __name__ == "__main__":
    if not os.path.exists(CRED_PATH):
        print(f"❌ エラー: 認証キー '{CRED_PATH}' が同じ階層に見つかりません。")
    else:
        db = initialize_firestore()
        upload_data(db, 'withmeets_wiki_data.json')
        upload_data(db, 'withstation_wiki_data.json')