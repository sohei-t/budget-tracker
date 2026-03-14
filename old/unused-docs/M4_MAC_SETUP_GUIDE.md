# M4 Mac対応セットアップガイド

## 🚨 問題の概要

Intel MacからApple Silicon (M4) Macへ移行した際、GitHub CLIの互換性問題により自動プッシュが失敗する問題が発生します。

### エラー症状
- `Bad CPU type in executable` エラー
- GitHub認証ヘルパーが動作しない
- 自動プッシュが失敗する

## 🔧 解決方法

### 1. GitHub CLI ARM64版のインストール

セットアップスクリプトを実行：
```bash
./setup_github_cli_m4.sh
```

このスクリプトは以下を自動実行：
- ARM64版GitHub CLI (v2.63.2) のダウンロード
- ~/bin/gh にインストール
- Git認証ヘルパーの設定
- GitHub認証状態の確認

### 2. GitHub認証の設定

初回のみ、GitHub認証を設定：
```bash
~/bin/gh auth login
```

推奨設定：
1. **Where do you use GitHub?** → `GitHub.com`
2. **Protocol** → `SSH`
3. **SSH key** → 既存のキー（例: `/Users/yourname/.ssh/id_ed25519.pub`）
4. **Title** → デフォルト（`GitHub CLI`）またはカスタム名
5. **Authenticate** → `Login with a web browser`
6. ブラウザでワンタイムコードを入力

### 3. 認証確認

```bash
~/bin/gh auth status
```

正常な出力例：
```
github.com
  ✓ Logged in to github.com account username (keyring)
  - Active account: true
```

## 📋 変更内容

### 修正されたファイル

1. **setup_github_cli_m4.sh** (新規)
   - ARM64版GitHub CLIの自動インストール
   - Git認証ヘルパーの自動設定

2. **src/gh-credential-helper.sh** (新規)
   - M4 Mac対応の認証ヘルパースクリプト
   - ~/bin/ghとシステムのghを自動検出

3. **src/simplified_github_publisher.py** (更新)
   - M4 Mac対応のghパス検出
   - /usr/bin/git を優先使用
   - 動的な認証ヘルパー設定

## 🚀 使用方法

### 新規プロジェクトの公開

```bash
# 1. 新規アプリ作成
./create_new_app.command

# 2. 開発完了後、GitHub公開
cd ~/Desktop/AI-Apps/{app-name}-agent
python3 $AGENT_TEMPLATE_DIR/src/simplified_github_publisher.py .
```

### 既存プロジェクトの再公開

```bash
cd ~/Desktop/AI-Apps/{app-name}-agent
python3 $AGENT_TEMPLATE_DIR/src/simplified_github_publisher.py .
```

## ✅ トラブルシューティング

### 問題: ghコマンドが見つからない
```bash
# セットアップスクリプトを再実行
./setup_github_cli_m4.sh
```

### 問題: 認証エラー
```bash
# 認証を再設定
~/bin/gh auth logout
~/bin/gh auth login
```

### 問題: プッシュ時にパスワード要求
```bash
# SSH認証を確認
ssh-add -l

# SSHキーを追加（パスフレーズ付きの場合）
ssh-add ~/.ssh/id_ed25519
```

## 📝 注意事項

1. **初回セットアップ時**
   - 必ず `setup_github_cli_m4.sh` を実行
   - GitHub認証を完了させる

2. **Intel Macとの互換性**
   - このセットアップはIntel Macでも動作
   - 既存の環境を破壊しない

3. **Homebrew不要**
   - ARM64版のHomebrewは不要
   - GitHub CLIを直接インストール

## 🎉 完了

セットアップ完了後、従来通りワークフローを実行できます：
- Phase 6の自動プッシュが正常動作
- GitHub認証が自動処理される
- M4 Macで完全に動作