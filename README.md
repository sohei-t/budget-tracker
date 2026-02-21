# Budget Tracker

WBS（Work Breakdown Structure）形式のタスク・進捗管理Webアプリケーション。大項目・中項目・小項目の3階層でタスクを管理し、予定と実績を記録することで進捗を可視化します。

## 概要

Budget Trackerは、プロジェクト管理に最適なWBSライクなタスク管理ツールです。予定工数と実績工数を管理し、進捗率や遅延率を自動計算します。ダークモード対応、キーボードショートカット、高速検索機能を備えた、モダンなSPA（Single Page Application）です。

## 主な機能

### タスク管理
- **3階層タスク構造**: 大項目 → 中項目 → 小項目のツリー構造
- **予定管理**: 開始日・終了日・予定工数（時間）を設定
- **実績記録**: 作業時間を記録し、自動的に進捗率を計算
- **進捗可視化**: プログレスバーで進捗を直感的に把握
- **遅延検知**: 遅れているタスクを自動的に警告表示

### UI/UX
- **ダークモード**: システム設定に自動追従、手動切り替えも可能
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップに対応
- **キーボードショートカット**:
  - `G + D`: Dashboard表示
  - `G + T`: Tasks表示
  - `N`: 新規タスク作成
  - `Ctrl + K`: 検索
  - `Ctrl + D`: ダークモード切り替え
  - `?`: ショートカット一覧表示
- **高速検索**: インクリメンタルサーチでタスクを即座に検索

### パフォーマンス
- **高速起動**: SQLite WALモード、最適化されたクエリ
- **効率的なレンダリング**: イベント委譲、仮想DOM不使用のバニラJS
- **LAN内アクセス**: 同じネットワーク内のデバイスからアクセス可能

## 技術スタック

### バックエンド
- **Node.js** 18+ LTS
- **Express** 4.x - Webフレームワーク
- **better-sqlite3** - SQLiteドライバ（WALモード有効化）
- **Helmet** - セキュリティヘッダー
- **CORS** - クロスオリジン対応
- **Compression** - gzip圧縮

### フロントエンド
- **Vanilla JavaScript** (ES2020+) - フレームワークレス
- **Custom CSS Variables** - テーマ切り替え
- **Hash-based Routing** - SPAルーティング
- **LocalStorage** - クライアント側状態管理

### テスト
- **Jest** 29.x - テストフレームワーク
- **Supertest** 6.x - API統合テスト
- **カバレッジ**: 97.92% (270件のテスト、100%合格)

### セキュリティ
- **Helmet**: セキュリティヘッダー設定
- **CORS**: クロスオリジン制御
- **XSS対策**: 入力サニタイゼーション
- **CSRF対策**: トークン検証（計画中）

## セットアップ

### 必要な環境
- Node.js 18.0.0以上
- npm 8.0.0以上

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/budget-tracker.git
cd budget-tracker

# 依存関係をインストール
npm install

# サーバーを起動
npm start
```

サーバーが起動したら、ブラウザで以下にアクセス:
- **ローカル**: http://localhost:3000
- **LAN内**: http://<your-ip>:3000

### 開発モード

```bash
# 自動リロード付きで起動
npm run dev
```

## 使い方

### 初回起動
1. サーバーを起動 (`npm start`)
2. ブラウザで http://localhost:3000 にアクセス
3. Dashboard画面が表示されます

### タスクの作成
1. 「Tasks」ページへ移動
2. 「New Task」ボタンをクリック（またはキーボードで `N` を押す）
3. タスク情報を入力:
   - **名前**: タスクの名称
   - **階層**: 大項目・中項目・小項目
   - **親タスク**: 中項目・小項目の場合は親を選択
   - **予定**: 開始日・終了日・予定工数（時間）
4. 「Create」ボタンで保存

### 実績の記録
1. タスク行をクリックして詳細を表示
2. 「Record Work」ボタンをクリック
3. 作業時間（時間）と日付を入力
4. 「Save」で記録

### 進捗の確認
- **Dashboard**: 全体の進捗サマリーを表示
- **Tasks**: 各タスクの詳細な進捗を表示
- **プログレスバー**: 各タスク行に進捗率を表示
- **遅延警告**: 遅れているタスクは赤く表示

## テスト実行

### 全テストを実行
```bash
npm test
```

### カバレッジレポート付きで実行
```bash
npm run test:coverage
```

### ウォッチモード（開発中）
```bash
npm run test:watch
```

### テスト結果
- **総テスト数**: 270件
- **合格率**: 100%
- **カバレッジ**: 97.92%
  - Statements: 97.92%
  - Branches: 94.05%
  - Functions: 100%
  - Lines: 97.92%

## ディレクトリ構造

```
budget-tracker/
├── public/                 # フロントエンド（静的ファイル）
│   ├── index.html          # エントリーポイント
│   ├── css/
│   │   └── main.css        # スタイルシート（CSS Variables使用）
│   └── js/
│       ├── app.js          # アプリケーション初期化
│       ├── router.js       # ハッシュベースルーティング
│       ├── store.js        # 状態管理
│       ├── api.js          # APIクライアント
│       ├── components/     # UIコンポーネント
│       │   ├── dashboard.js
│       │   ├── taskList.js
│       │   ├── taskDetail.js
│       │   ├── taskForm.js
│       │   ├── actualForm.js
│       │   ├── progressBar.js
│       │   ├── modal.js
│       │   └── toast.js
│       └── utils/          # ユーティリティ
│           ├── dom.js
│           ├── dates.js
│           └── shortcuts.js
├── src/                    # バックエンド（Node.js + Express）
│   ├── server.js           # サーバーエントリーポイント
│   ├── models/             # データモデル（SQLite）
│   │   ├── task.js
│   │   ├── actual.js
│   │   └── db.js
│   ├── services/           # ビジネスロジック
│   │   ├── taskService.js
│   │   └── actualService.js
│   ├── controllers/        # リクエストハンドラー
│   │   ├── taskController.js
│   │   └── actualController.js
│   ├── routes/             # ルート定義
│   │   ├── tasks.js
│   │   └── actuals.js
│   ├── middleware/         # ミドルウェア
│   │   ├── errorHandler.js
│   │   └── validator.js
│   └── utils/              # ユーティリティ
│       └── logger.js
├── tests/                  # テストコード（Jest）
│   ├── models/
│   ├── services/
│   ├── controllers/
│   └── integration/
├── data/                   # データベースファイル
│   └── budget-tracker.db   # SQLiteデータベース
├── package.json            # npm設定
└── README.md               # このファイル
```

## API仕様

### タスクAPI

#### GET /api/tasks
すべてのタスクを取得

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "開発フェーズ",
      "level": "large",
      "parent_id": null,
      "planned_start": "2024-01-01",
      "planned_end": "2024-03-31",
      "planned_hours": 480,
      "actual_hours": 120,
      "progress_rate": 25,
      "is_delayed": false
    }
  ]
}
```

#### GET /api/tasks/:id
特定のタスクを取得

#### POST /api/tasks
新規タスクを作成

**リクエストボディ**:
```json
{
  "name": "タスク名",
  "level": "large|medium|small",
  "parent_id": 1,
  "planned_start": "2024-01-01",
  "planned_end": "2024-01-31",
  "planned_hours": 40
}
```

#### PUT /api/tasks/:id
タスクを更新

#### DELETE /api/tasks/:id
タスクを削除

### 実績API

#### GET /api/actuals
すべての実績を取得

#### POST /api/actuals
実績を記録

**リクエストボディ**:
```json
{
  "task_id": 1,
  "work_date": "2024-01-15",
  "hours": 8,
  "description": "作業内容"
}
```

#### PUT /api/actuals/:id
実績を更新

#### DELETE /api/actuals/:id
実績を削除

## パフォーマンス最適化

- **SQLite WALモード**: 読み書き並行処理の高速化
- **PRAGMA最適化**: journal_mode, synchronous, cache_size, temp_store
- **N+1クエリ削減**: 親子関係をJOINで一度に取得
- **イベント委譲**: DOMイベントリスナーを最小化
- **Compression**: gzip圧縮でレスポンスサイズを削減

## セキュリティ対策

- **Helmet**: セキュリティヘッダー（XSS、Clickjacking対策）
- **CORS**: 許可されたオリジンのみアクセス可能
- **入力検証**: すべての入力をバリデーション
- **SQLインジェクション対策**: プリペアドステートメント使用
- **XSS対策**: HTML特殊文字のエスケープ

## ライセンス

MIT License

Copyright (c) 2024 Budget Tracker Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

**Generated with [Claude Code](https://claude.com/claude-code)**
