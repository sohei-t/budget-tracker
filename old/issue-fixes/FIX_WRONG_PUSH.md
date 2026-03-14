# 🚨 誤ったGitHub Push の修正手順

## 問題
`github_portfolio_publisher.py`（古いスクリプト）を使用したため、DELIVERYフォルダだけでなくプロジェクト全体がGitHubにpushされてしまった。

## 原因
- **誤**: `github_portfolio_publisher.py` - プロジェクト全体をpush
- **正**: `simplified_github_publisher.py` - DELIVERYフォルダのみpush

## 修正手順

### 1. 既存の誤ったリポジトリをクリーンアップ

#### Option A: リポジトリを削除して作り直す（推奨）
```bash
# GitHubでリポジトリを削除
gh repo delete portfolio-alien-game --yes

# 正しいスクリプトで再公開
cd ~/Desktop/AI-Apps/alien-game-agent
python3 $AGENT_TEMPLATE_DIR/src/simplified_github_publisher.py .
```

#### Option B: 既存リポジトリを修正
```bash
# リポジトリをクローン
cd ~/Desktop/temp
git clone https://github.com/{username}/portfolio-alien-game
cd portfolio-alien-game

# 全ファイル削除（.gitは残す）
rm -rf *

# DELIVERYフォルダの内容だけをコピー
cp -r ~/Desktop/AI-Apps/alien-game-agent/DELIVERY/* .

# コミットしてpush
git add -A
git commit -m "fix: Remove unnecessary files, keep only DELIVERY contents"
git push origin main
```

### 2. 今後の正しい使用方法

```bash
# Phase 6では必ずこのスクリプトを使用
python3 $AGENT_TEMPLATE_DIR/src/simplified_github_publisher.py .
```

### 3. 正しい公開構造

```
ai-agent-portfolio/
└── alien-game/           # アプリ名（日付なし）
    ├── src/             # ゲーム本体のソースコード
    ├── tests/           # テストコード
    ├── docs/            # 設計書・仕様書
    ├── about.html       # ビジュアル説明
    ├── explanation.mp3  # 音声解説
    └── README.md        # 技術仕様
```

## 予防策（実施済み）

1. **古いスクリプトをリネーム**
   - `github_portfolio_publisher.py` → `old_github_portfolio_publisher.py.backup`
   - `portfolio_publisher.py` → `old_portfolio_publisher.py.backup`

2. **CLAUDE.md更新**
   - 全箇所で`simplified_github_publisher.py`を使用するよう変更

3. **明確な指示**
   - Phase 6では`simplified_github_publisher.py`のみ使用
   - DELIVERYフォルダの内容のみpush

## チェックリスト

- [ ] 既存の誤ったリポジトリを修正
- [ ] 正しいスクリプトで再公開
- [ ] GitHub Pagesを有効化
- [ ] README.mdにライブリンク追加を確認
- [ ] 不要なファイルが公開されていないことを確認