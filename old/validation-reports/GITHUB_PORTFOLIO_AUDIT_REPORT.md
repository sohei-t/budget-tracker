# 🔍 GitHub Portfolio セキュリティ監査レポート

**監査日**: 2025-12-18
**対象リポジトリ**: https://github.com/sohei-t/ai-agent-portfolio
**総ファイル数**: 504ファイル

---

## 📊 監査結果サマリー

### 🟡 発見された問題（中リスク）

**1. 認証ファイルパスの露出**
- **ファイル**: `gradius-clone-v2/generate_audio_gcp.js`
- **行**: 7
- **内容**: ローカルファイルパスが露出
  ```javascript
  keyFilename: '$GOOGLE_APPLICATION_CREDENTIALS'
  ```

**リスク評価:**
- 🟡 **中リスク** - ファイルパス情報のみで秘密鍵は含まれない
- ローカルマシンの構造が推測可能
- 実際の秘密鍵ファイルはGitHubに含まれていない（✅確認済み）

---

## ✅ 確認事項

### 1. 実際の秘密鍵ファイルの有無

**確認コマンド:**
```bash
find . -name "*credential*" -o -name "*.key.json" -o -name "service-account*.json"
```

**結果:** ❌ 見つからず（✅安全）

### 2. credentials/ フォルダの有無

**確認コマンド:**
```bash
ls -la */credentials/
```

**結果:** `No credentials/ folders found`（✅安全）

### 3. 秘密鍵の実体（private_key）の有無

**確認コマンド:**
```bash
grep -r "BEGIN.*PRIVATE KEY" .
```

**結果:** 見つからず（✅安全）

### 4. GCP認証キーJSON構造の有無

**確認コマンド:**
```bash
find . -name "*.json" -exec grep -l "private_key_id\|service_account\|client_email" {} \;
```

**結果:** 見つからず（✅安全）

### 5. .env ファイルの有無

**確認コマンド:**
```bash
find . -name ".env*" -o -name "*.pem" -o -name "*.p12"
```

**結果:** 見つからず（✅安全）

### 6. その他の機密情報

**確認コマンド:**
```bash
grep -r "GITHUB_TOKEN\|API_KEY\|SECRET\|PASSWORD" --include="*.js" --include="*.py"
```

**結果:** Reactビルドファイル（minified）のみ - 問題なし（✅安全）

---

## 📁 プロジェクト構造

### 公開されているプロジェクト

```
ai-agent-portfolio/
├── Invaders-game-v2/
├── Invaders-game/
├── dungeon-battles/
├── gradius-clone-v2/      ← 問題ファイルを含む
├── gradius-clone/
├── piano-app/
├── .nojekyll
└── index.html
```

### 言語内訳
- JavaScript: 38.5%
- TypeScript: 37.6%
- HTML: 18.7%
- Python: 2.9%
- CSS: 2.1%
- Shell: 0.2%

---

## 🚨 発見された問題の詳細

### Problem 1: generate_audio_gcp.js - 認証ファイルパス露出

**ファイル:** `gradius-clone-v2/generate_audio_gcp.js:7`

**現在のコード:**
```javascript
const client = new textToSpeech.TextToSpeechClient({
    keyFilename: '$GOOGLE_APPLICATION_CREDENTIALS'
});
```

**問題点:**
1. ローカルマシンのファイルパスが露出
2. ユーザー名（tsujisouhei）が公開
3. ディレクトリ構造が推測可能

**実際のリスク:**
- 🟡 **中リスク** - パス情報のみ（秘密鍵は含まれない）
- 実際の `gcp-workflow-key.json` はGitHub上に存在しない（✅確認済み）
- ローカル環境でのみ動作するコード

**推奨される修正:**
```javascript
// 修正案1: 環境変数を使用
const client = new textToSpeech.TextToSpeechClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                  './credentials/gcp-workflow-key.json'
});

// 修正案2: 相対パスを使用
const client = new textToSpeech.TextToSpeechClient({
    keyFilename: './credentials/gcp-workflow-key.json'
});

// 修正案3: Application Default Credentials（推奨）
const client = new textToSpeech.TextToSpeechClient();
// 環境変数 GOOGLE_APPLICATION_CREDENTIALS で自動検出
```

---

## 🟢 安全が確認された項目

### ✅ 秘密鍵ファイル

- `credentials/` フォルダは含まれていない
- `*.key.json` ファイルは含まれていない
- `service-account*.json` は含まれていない
- RSA秘密鍵（`BEGIN PRIVATE KEY`）は含まれていない

### ✅ 環境変数ファイル

- `.env` ファイルは含まれていない
- `.env.local` / `.env.production` は含まれていない
- `.pem` / `.p12` / `.pfx` は含まれていない

### ✅ Git履歴

- Git履歴に秘密鍵が含まれていない
- credentials/ フォルダのコミット履歴なし
- `.key.json` のコミット履歴なし

---

## 📋 追加で確認したファイル

### 1. バックアップファイル

**発見:**
```
./dungeon-battles/src/old_github_portfolio_publisher.py.backup
./dungeon-battles/src/old_portfolio_publisher.py.backup
```

**確認結果:** Pythonスクリプトのバックアップ - 機密情報なし（✅安全）

### 2. generation_report.json / generation_plan.json

**場所:** `gradius-clone-v2/`

**確認結果:** プロジェクト生成レポート - 機密情報なし（✅安全）

### 3. config/*.json ファイル

**場所:** `dungeon-battles/config/`
- `system_dependencies.json`
- `game_parameters.json`
- `balanced_parameters.json`

**確認結果:** ゲーム設定ファイル - 機密情報なし（✅安全）

---

## 🛠️ 推奨される対応

### 🔴 即座対応（優先度: 高）

#### 1. generate_audio_gcp.js の修正

**Option A: 環境変数使用（推奨）**

```javascript
// 修正後
const client = new textToSpeech.TextToSpeechClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});
```

**README.md に追加:**
```markdown
## Setup

### Environment Variables
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/credentials.json"
```
```

**Option B: コメント化**

```javascript
// 開発環境用 - 本番では環境変数を使用
// const client = new textToSpeech.TextToSpeechClient({
//     keyFilename: './credentials/gcp-workflow-key.json'
// });

// 本番環境（環境変数から自動検出）
const client = new textToSpeech.TextToSpeechClient();
```

**Option C: ファイル削除**

generate_audio_gcp.js がポートフォリオ公開に不要な場合:
```bash
cd gradius-clone-v2
git rm generate_audio_gcp.js
git commit -m "security: Remove file with credential path exposure"
git push
```

---

### 🟡 推奨対応（優先度: 中）

#### 2. .gitignore の追加/確認

各プロジェクトに `.gitignore` を追加:

```gitignore
# 認証情報
credentials/
*.key.json
*-key.json
service-account*.json
gcp-*.json
.env
.env.*

# 開発ファイル
generate_audio_gcp.js  # ローカル環境用
*.backup
```

#### 3. README.md にセキュリティ情報追加

```markdown
## Security Notes

- Credential files are not included in this repository
- To run audio generation locally, set up your own GCP credentials
- See: https://cloud.google.com/docs/authentication/getting-started
```

---

### 🟢 任意対応（優先度: 低）

#### 4. バックアップファイルの削除

```bash
cd dungeon-battles/src
git rm old_github_portfolio_publisher.py.backup
git rm old_portfolio_publisher.py.backup
git commit -m "chore: Remove unnecessary backup files"
git push
```

---

## 🔄 修正手順（推奨）

### Step 1: リポジトリをクローン

```bash
cd ~/Desktop
git clone https://github.com/sohei-t/ai-agent-portfolio.git
cd ai-agent-portfolio
```

### Step 2: 問題ファイルを修正

```bash
# gradius-clone-v2/generate_audio_gcp.js を修正
nano gradius-clone-v2/generate_audio_gcp.js

# 以下に変更:
# keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
```

### Step 3: .gitignore を追加

```bash
cat >> .gitignore <<'EOF'
# 認証情報
credentials/
*.key.json
*-key.json
service-account*.json
gcp-*.json
.env
.env.*

# 開発ファイル
**/generate_audio_gcp.js

# バックアップ
*.backup
*.old
EOF
```

### Step 4: コミット＆プッシュ

```bash
git add .
git commit -m "security: Fix credential path exposure and add .gitignore"
git push origin main
```

---

## 📊 最終評価

### セキュリティスコア

**総合評価:** 🟢 **良好**

```
秘密鍵ファイル: ✅ なし
credentials/: ✅ なし
.env ファイル: ✅ なし
Git履歴: ✅ クリーン
```

**発見された問題:**
- 🟡 認証ファイルパス露出（中リスク）× 1件

**リスク評価:**
- 実際の秘密鍵は含まれていない
- ローカルパス情報のみの露出
- 即座の危険性はない

### 推奨アクション

1. **即座**: `generate_audio_gcp.js` の修正または削除
2. **推奨**: `.gitignore` 追加
3. **任意**: バックアップファイル削除

---

## 🎯 結論

**ai-agent-portfolio リポジトリは概ね安全です**

✅ **確認事項:**
- 秘密鍵ファイルは含まれていない
- credentials/ フォルダは存在しない
- Git履歴にも機密情報なし

⚠️ **発見された問題:**
- `generate_audio_gcp.js` にローカルパス露出（中リスク）
- 実際の秘密鍵は含まれていないため即座の危険性なし

🔧 **推奨対応:**
- `generate_audio_gcp.js` を修正（環境変数使用に変更）
- または削除（ポートフォリオ公開に不要な場合）

---

## 📝 対比: git-worktree-agent リポジトリ

**ai-agent-portfolio:** 🟢 安全
- 秘密鍵ファイルなし
- 認証情報なし
- Git履歴クリーン

**git-worktree-agent:** 🔴 リスク残存（SECURITY_INCIDENT_REPORT.md参照）
- Git履歴に `credentials/imagen-key.json` が含まれている（Commit 882cfd2）
- RSA秘密鍵が漏洩
- 即座対応必須（キー無効化＋履歴クリーニング）

---

**監査実施者**: Claude Code（セキュリティ監査）
**日時**: 2025-12-18
**次回見直し**: generate_audio_gcp.js修正後
