# backend/upload_archives_to_storage.py
import os
import glob
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage as gcs_storage

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

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
    raise FileNotFoundError("❌ サービスアカウント鍵が見つかりません。")

print(f"🔑 認証キーを読み込みました: {service_account_path}")
cred = credentials.Certificate(service_account_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Google Cloud Storage クライアントを直接使用してバケットを自動検出
gcs_client = gcs_storage.Client.from_service_account_json(service_account_path)

def get_target_bucket():
    buckets = list(gcs_client.list_buckets())
    if not buckets:
        print("\n❌ プロジェクト内に Storage バケットが1つも存在しません。")
        print("👉 Firebase Console ( https://console.firebase.google.com/project/hasulog/storage ) を開き、")
        print("   『使ってみる (Get started)』をクリックして Storage を有効化してください。\n")
        return None

    print(f"📦 検出されたバケット一覧:")
    for b in buckets:
        print(f"   - {b.name}")

    # hasulog が含まれるバケットを優先、なければ先頭
    target = None
    for b in buckets:
        if "hasulog" in b.name:
            target = b
            break
    if not target:
        target = buckets[0]

    print(f"🎯 使用するバケット: {target.name}")
    return target

def extract_doc_id(filename: str) -> str:
    base = filename
    for ext in [".html.gz", ".gz", ".html"]:
        if base.endswith(ext):
            base = base[:-len(ext)]
    return base

def upload_archives_to_storage():
    bucket = get_target_bucket()
    if not bucket:
        return

    archives_dir = os.path.join(PROJECT_ROOT, "public", "archives")
    if not os.path.exists(archives_dir):
        print(f"❌ ディレクトリが見つかりません: {archives_dir}")
        return

    gz_files = glob.glob(os.path.join(archives_dir, "**", "*.gz"), recursive=True)
    print(f"📂 対象ファイル数: {len(gz_files)} 件 ({archives_dir})")

    success_count = 0

    for file_path in gz_files:
        filename = os.path.basename(file_path)
        doc_id = extract_doc_id(filename)
        
        blob_path = f"archives/{filename}"
        blob = bucket.blob(blob_path)

        blob.content_type = "text/html; charset=utf-8"
        blob.content_encoding = "gzip"

        size_kb = os.path.getsize(file_path) / 1024
        print(f"🚀 アップロード中: {filename} ({size_kb:.1f} KB)...")

        try:
            blob.upload_from_filename(file_path)
            
            # 公開URLの作成（バケットの権限モデルに応じてフォールバック）
            try:
                blob.make_public()
                public_url = blob.public_url
            except Exception:
                # 均一なバケットレベルのアクセス制御が有効な場合は公開URL文字列を直接構築
                public_url = f"https://storage.googleapis.com/{bucket.name}/{blob_path}"

            db.collection("article_archives").document(doc_id).set({
                "id": doc_id,
                "filename": filename,
                "bucket": bucket.name,
                "storagePath": blob_path,
                "url": public_url,
                "sizeBytes": os.path.getsize(file_path),
                "updatedAt": firestore.SERVER_TIMESTAMP
            }, merge=True)

            success_count += 1
        except Exception as e:
            print(f"❌ アップロード失敗 ({filename}): {e}")

    print(f"\n🎉 完了！ 全 {len(gz_files)} 件中 {success_count} 件を Storage にアップロードしました。")

if __name__ == "__main__":
    upload_archives_to_storage()