# 🚨 緊急: GitHub公開リポジトリに認証パス情報が含まれている

**発見日時**: 2025-12-18
**重大度**: 🟡 MEDIUM（中リスク）
**状態**: 🚨 対応推奨

---

## 📋 問題の詳細

### 公開されているファイル

**リポジトリ**: https://github.com/sohei-t/ai-agent-portfolio
**ファイル**: `gradius-clone-v2/generate_audio_gcp.js`
**GitHub URL**: https://github.com/sohei-t/ai-agent-portfolio/blob/main/gradius-clone-v2/generate_audio_gcp.js

**公開されている情報（7行目）:**
```javascript
keyFilename: '$GOOGLE_APPLICATION_CREDENTIALS'
```

### 露出している情報

1. **ユーザー名**: `tsujisouhei`
2. **ローカルパス**: `$AGENT_TEMPLATE_DIR/`
3. **認証ファイル名**: `gcp-workflow-key.json`
4. **ディレクトリ構造**: `credentials/` フォルダの存在

---

## ⚠️ リスク評価

### 🟡 中リスク（即座の危険性は低いが対応推奨）

**理由:**
- ✅ 実際の秘密鍵ファイル（gcp-workflow-key.json）はGitHubに含まれていない
- ✅ RSA秘密鍵の実体は公開されていない
- ⚠️ ローカルマシンの構造・ユーザー名が露出
- ⚠️ 認証ファイルの場所が推測可能

**想定される影響:**
- 攻撃者がローカル環境の構造を推測できる
- ソーシャルエンジニアリング攻撃のターゲット情報になる可能性
- 他のプロジェクトの認証情報の場所を推測される

---

## ❓ ご質問への回答

### Q1: gitignoreに書いてありますか？

**A: いいえ、書いてありません。**

```bash
# 確認結果
$ cd ~/Desktop/ai-agent-portfolio-audit/gradius-clone-v2
$ ls -la .gitignore
ls: .gitignore: No such file or directory

# ルートの.gitignoreも存在しない
$ cd ~/Desktop/ai-agent-portfolio-audit
$ ls -la .gitignore
ls: .gitignore: No such file or directory
```

**結論**: `gradius-clone-v2/` に `.gitignore` は存在せず、`generate_audio_gcp.js` はそのまま公開されています。

---

### Q2: 環境変数にすると実行忘れが出ますか？

**A: はい、その通りです。**

**問題点:**
```javascript
// 環境変数方式（実行忘れのリスク）
const client = new textToSpeech.TextToSpeechClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// ワークフローで以下を実行し忘れる可能性
export GOOGLE_APPLICATION_CREDENTIALS="$GOOGLE_APPLICATION_CREDENTIALS"
```

**Claude Codeの自動化では:**
- 環境変数設定を忘れる
- スクリプト実行時にエラー
- ワークフローが中断

---

## ✅ 推奨される解決策（実行忘れを防ぐ）

### 🎯 Solution 1: 相対パス + 実行時チェック（推奨）

```javascript
const fs = require('fs');
const path = require('path');
const textToSpeech = require('@google-cloud/text-to-speech');

// 相対パスで認証ファイルを探す（実行忘れなし）
function findCredentials() {
    const possiblePaths = [
        // プロジェクト内
        './credentials/gcp-workflow-key.json',
        '../credentials/gcp-workflow-key.json',
        // テンプレート環境
        path.join(process.env.HOME, 'Desktop/git-worktree-agent/credentials/gcp-workflow-key.json'),
        // 環境変数
        process.env.GOOGLE_APPLICATION_CREDENTIALS
    ];

    for (const credPath of possiblePaths) {
        if (credPath && fs.existsSync(credPath)) {
            console.log(`✅ 認証ファイル検出: ${credPath}`);
            return credPath;
        }
    }

    console.error('❌ GCP認証ファイルが見つかりません');
    console.error('以下のいずれかを配置してください:');
    console.error('  - ./credentials/gcp-workflow-key.json');
    console.error('  - ../credentials/gcp-workflow-key.json');
    console.error('  - $GOOGLE_APPLICATION_CREDENTIALS');
    process.exit(1);
}

const client = new textToSpeech.TextToSpeechClient({
    keyFilename: findCredentials()
});
```

**メリット:**
- ✅ 複数のパスを自動探索（実行忘れなし）
- ✅ エラーメッセージで設定方法を提示
- ✅ 絶対パスを公開しない
- ✅ ローカル・CI環境で動作

---

### 🎯 Solution 2: コメント化 + デフォルト相対パス

```javascript
const textToSpeech = require('@google-cloud/text-to-speech');

// デフォルト: 相対パス（GitHubには公開されない場所）
// 環境変数が設定されていればそちらを優先
const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                       '../credentials/gcp-workflow-key.json';

const client = new textToSpeech.TextToSpeechClient({
    keyFilename: credentialPath
});

// 使用方法:
// 1. デフォルト（相対パス）: そのまま実行
// 2. 環境変数: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
```

**メリット:**
- ✅ デフォルト動作で相対パス使用（実行忘れなし）
- ✅ 環境変数も使用可能（柔軟性）
- ✅ 絶対パスを公開しない

---

### 🎯 Solution 3: .gitignore追加 + パス修正

```bash
# gradius-clone-v2/.gitignore を作成
cat > gradius-clone-v2/.gitignore <<'EOF'
# 認証情報
credentials/
*.key.json
*-key.json

# ローカル設定ファイル
generate_audio_gcp.js
generate_audio_local.js

# 環境変数
.env
.env.*
EOF
```

```javascript
// generate_audio_gcp.js を修正（相対パス）
const client = new textToSpeech.TextToSpeechClient({
    keyFilename: '../credentials/gcp-workflow-key.json'  // 相対パス
});
```

**メリット:**
- ✅ 将来的に同様の問題を防ぐ
- ✅ シンプルな実装
- ⚠️ 既に公開されているファイルは削除が必要

---

## 🔧 即座対応手順

### Option A: ファイルを削除（ポートフォリオに不要な場合）

```bash
cd ~/Desktop
git clone https://github.com/sohei-t/ai-agent-portfolio.git
cd ai-agent-portfolio/gradius-clone-v2

# 削除
git rm generate_audio_gcp.js
git commit -m "security: Remove file with credential path exposure"
git push origin main
```

---

### Option B: 修正して再プッシュ（機能が必要な場合）

```bash
cd ~/Desktop/ai-agent-portfolio/gradius-clone-v2

# 1. .gitignore作成
cat > .gitignore <<'EOF'
credentials/
*.key.json
.env
EOF

# 2. generate_audio_gcp.js を修正
nano generate_audio_gcp.js
# 以下に変更:
# keyFilename: '../credentials/gcp-workflow-key.json'

# 3. コミット
git add .gitignore generate_audio_gcp.js
git commit -m "security: Use relative path and add .gitignore"
git push origin main
```

---

### Option C: Git履歴から削除（完全削除）

```bash
cd ~/Desktop/ai-agent-portfolio

# BFG Repo-Cleanerで削除
brew install bfg
bfg --delete-files generate_audio_gcp.js

# Git GC
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 強制プッシュ
git push --force origin main
```

---

## 📊 各解決策の比較

| 解決策 | 実行忘れ防止 | セキュリティ | 実装難易度 | 推奨度 |
|--------|------------|------------|-----------|--------|
| Solution 1（自動探索） | ✅ 最高 | ✅ 高 | 🟡 中 | ⭐⭐⭐⭐⭐ |
| Solution 2（相対パス） | ✅ 高 | ✅ 高 | ✅ 低 | ⭐⭐⭐⭐ |
| Solution 3（.gitignore） | 🟡 中 | ✅ 高 | ✅ 低 | ⭐⭐⭐ |
| 環境変数のみ | ❌ 低 | ✅ 最高 | ✅ 低 | ⭐⭐ |

---

## 🎯 最終推奨

### 🥇 推奨: Solution 1（自動探索）

**理由:**
1. ✅ 実行忘れを完全に防ぐ
2. ✅ 複数環境で動作（ローカル・CI・テンプレート）
3. ✅ エラー時に親切なメッセージ
4. ✅ 絶対パスを公開しない

**実装:**
```javascript
// 既存のワークフローを壊さずに改善
function findCredentials() {
    const paths = [
        './credentials/gcp-workflow-key.json',
        '../credentials/gcp-workflow-key.json',
        process.env.HOME + '/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json',
        process.env.GOOGLE_APPLICATION_CREDENTIALS
    ].filter(p => p && fs.existsSync(p));

    return paths[0] || null;
}
```

---

## 📝 ワークフローへの統合

### documenter_agent.py で自動生成

```python
def generate_audio_script_gcp(self):
    """GCP TTS用スクリプト生成（自動認証パス探索）"""

    script = """
const fs = require('fs');
const path = require('path');
const textToSpeech = require('@google-cloud/text-to-speech');

function findCredentials() {
    const paths = [
        './credentials/gcp-workflow-key.json',
        '../credentials/gcp-workflow-key.json',
        path.join(process.env.HOME, 'Desktop/git-worktree-agent/credentials/gcp-workflow-key.json'),
        process.env.GOOGLE_APPLICATION_CREDENTIALS
    ];

    for (const p of paths) {
        if (p && fs.existsSync(p)) {
            console.log(`✅ 認証: ${path.basename(p)}`);
            return p;
        }
    }

    throw new Error('GCP認証ファイルが見つかりません');
}

const client = new textToSpeech.TextToSpeechClient({
    keyFilename: findCredentials()
});

// ... 以下、音声生成処理
"""

    return script
```

**メリット:**
- ✅ ワークフローで自動生成（手動編集不要）
- ✅ 常に安全なコードを生成
- ✅ 実行忘れなし

---

## 🚀 次のアクション

### 即座（24時間以内）

1. [ ] `generate_audio_gcp.js` を修正（Solution 1推奨）
2. [ ] GitHubにプッシュ
3. [ ] 公開URLで確認

### 今後の予防

4. [ ] `documenter_agent.py` に自動探索コード生成を追加
5. [ ] CLAUDE.md にセキュリティチェック追加
6. [ ] テンプレートの`.gitignore`に`generate_audio_gcp.js`を追加

---

**作成者**: Claude Code（セキュリティ監査）
**日時**: 2025-12-18
**優先度**: 🟡 MEDIUM（対応推奨）
