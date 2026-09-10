# backend/set_storage_cors.py
import os
from google.cloud import storage

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

client = storage.Client.from_service_account_json(service_account_path)

# バケットを自動検出
buckets = list(client.list_buckets())
if not buckets:
    raise ValueError("❌ Storage バケットが見つかりません。")

target_bucket = None
for b in buckets:
    if "hasulog" in b.name:
        target_bucket = b
        break
if not target_bucket:
    target_bucket = buckets[0]

print(f"🎯 対象バケット: {target_bucket.name}")

# CORS設定の定義
# 開発環境 (localhost) および本番ドメイン、全オリジン (*) からの GET / HEAD を許可
cors_configuration = [
    {
        "origin": ["*"],
        "method": ["GET", "HEAD", "OPTIONS"],
        "responseHeader": [
            "Content-Type",
            "Content-Encoding",
            "Content-Length",
            "Access-Control-Allow-Origin"
        ],
        "maxAgeSeconds": 3600
    }
]

target_bucket.cors = cors_configuration
target_bucket.patch()

print(f"✅ バケット '{target_bucket.name}' に CORS 設定を適用しました！")
print(f"   設定内容: {target_bucket.cors}")