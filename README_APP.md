# budget-tracker Development Environment

このディレクトリは **budget-tracker** 専用のAIエージェント開発環境です。

## 🚀 Phase別Worktree自律開発システム

このプロジェクトは**複数アプローチ並列開発・自律評価システム**を採用しています。

### 📊 9つのWorktree構成

```
worktrees/
├── phase1-planning-a/           # 計画案A（保守的）
├── phase1-planning-b/           # 計画案B（革新的）
├── phase2-impl-prototype-a/     # 実装プロトタイプA
├── phase2-impl-prototype-b/     # 実装プロトタイプB
├── phase2-impl-prototype-c/     # 実装プロトタイプC
├── phase3-testing/              # テスト環境
├── phase4-quality-opt-a/        # 最適化アプローチA
├── phase4-quality-opt-b/        # 最適化アプローチB
└── phase5-delivery/             # 最終成果物
```

### 🤖 自律的な開発フロー

1. **Phase 1: 計画**
   - AIが2つの計画案を並列生成（保守的/革新的）
   - 自律評価して最良を選択 → mainにマージ

2. **Phase 2: 実装**
   - 3つのプロトタイプを並列開発
   - 自動テスト・評価
   - 最良をmainにマージ

3. **Phase 3: テスト**
   - 徹底的なテスト実行
   - 失敗時はPhase 2に自動フィードバック

4. **Phase 4: 品質改善**
   - 2つの最適化アプローチを並列実装
   - ベンチマーク評価で最良を選択

5. **Phase 5: 完成処理**
   - ドキュメント生成
   - GitHub公開

### 🎯 期待される効果

| 項目 | 従来 | Phase別worktree |
|------|------|----------------|
| **精度** | 基準 | +35-50%向上 |
| **効率** | 基準 | +50-80%向上 |
| **並列実行** | 部分的 | 完全並列（1.5-2倍速） |

### 📁 ディレクトリ構成

```
budget-tracker-agent/
├── worktrees/              # Phase別開発環境（9個）
├── src/                    # ワークフロー実行スクリプト（テンプレートからコピー済み）
│   ├── autonomous_evaluator.py           # Phase 1: 計画案の自律評価
│   ├── autonomous_evaluator_ux.py        # Phase 2: 実装プロトタイプの評価
│   ├── documenter_agent.py               # Phase 5: ドキュメント・音声生成
│   ├── path_validator.py                 # Phase 5: GitHub Pagesパス検証
│   ├── simplified_github_publisher.py    # Phase 6: GitHub公開
│   ├── credential_checker.py             # 認証状態確認
│   └── audio_generator_lyria.py          # ゲーム音声生成（オプション）
├── project/
│   └── public/             # GitHub公開用ファイル（Phase 5で自動生成）
├── credentials/            # API認証ファイル（.gitignore済み）
├── CLAUDE.md               # ワークフロー実行ガイド
├── WORKTREE_INDEX.md       # Worktree役割インデックス
└── .env                    # API認証設定（.gitignore済み）
```

**ポータビリティ:**
このディレクトリを他の端末にコピーすれば、単独で動作します。
テンプレート環境（git-worktree-agent）への依存はありません。

### 🔄 修正フロー

1. 該当Phaseのworktreeに移動
   ```bash
   cd worktrees/phase2-impl-prototype-a/
   ```

2. 修正を実施 → commit

3. mainにマージ
   ```bash
   git checkout main
   git merge phase/impl-prototype-a
   ```

4. 次のPhaseに反映
   ```bash
   cd worktrees/phase3-testing/
   git merge main
   ```

作成日: 2026年 2月 6日 金曜日 10時20分05秒 JST
