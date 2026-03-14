#!/usr/bin/env python3
"""
🚀 シンプル化されたGitHub公開スクリプト v8.0
project/public/ から直接GitHubにプッシュ（一時clone方式）
"""

import os
import sys
import subprocess
import shutil
import re
import json
import tempfile
from pathlib import Path
from typing import Optional

class SimplifiedGitHubPublisher:
    """シンプル化されたGitHub公開クラス"""

    def __init__(self, project_path: str = None, auto_mode: bool = False):
        """
        Args:
            project_path: プロジェクトのパス（AI-Apps内のフォルダ）
            auto_mode: 対話なしで自動実行するか（デフォルト: False）
        """
        self.project_path = Path(project_path or os.getcwd())
        self.auto_mode = auto_mode
        self._load_env()

        self.app_name = self._get_app_name()
        self.public_path = self.project_path / "project" / "public"
        self.temp_dir = None
        self.github_username = self._get_github_username()

    def _load_env(self):
        """環境変数を読み込み"""
        env_file = self.project_path / ".env"
        if not env_file.exists():
            return

        try:
            from dotenv import load_dotenv
            load_dotenv(env_file)
        except ImportError:
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip()

    def _get_app_name(self) -> Optional[str]:
        """PROJECT_INFO.yamlからアプリ名を取得"""
        project_info_path = self.project_path / "PROJECT_INFO.yaml"
        if not project_info_path.exists():
            return None

        try:
            with open(project_info_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip().startswith('name:'):
                        app_name = line.split(':', 1)[1].strip()
                        return app_name.strip('"').strip("'")
        except Exception as e:
            print(f"⚠️ PROJECT_INFO.yaml読み込みエラー: {e}")
        return None

    def _get_github_username(self) -> str:
        """GitHub usernameを取得（M4 Mac対応版）"""
        username = os.environ.get('GITHUB_USERNAME')
        if username:
            return username

        # M4 Macに対応したghパスを試行
        gh_paths = [
            os.path.expanduser('~/bin/gh'),  # M4 Mac用（ARM64版）
            '/usr/local/bin/gh',  # Intel Mac用
            'gh'  # PATH上のgh
        ]

        for gh_path in gh_paths:
            try:
                if os.path.exists(gh_path) or shutil.which(gh_path):
                    result = subprocess.run(
                        [gh_path, 'api', 'user', '--jq', '.login'],
                        capture_output=True,
                        text=True
                    )
                    if result.returncode == 0:
                        return result.stdout.strip()
            except:
                continue

        return "username"

    def _run_command(self, cmd: str, cwd: Path = None) -> bool:
        """コマンドを実行"""
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"⚠️ コマンド失敗: {cmd}")
            if result.stderr:
                print(f"   エラー: {result.stderr}")
            return False
        return True

    def get_slug(self) -> str:
        """アプリ名からslugを生成"""
        if self.app_name:
            name = self.app_name
        else:
            name = self.project_path.name
            name = re.sub(r'^\d{8}-', '', name)
            name = re.sub(r'-agent$', '', name)

        slug = name.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        slug = slug.strip('-')

        return slug

    def validate_public(self) -> bool:
        """project/public/ の検証"""
        if not self.public_path.exists():
            print(f"❌ project/public/ フォルダが見つかりません: {self.public_path}")
            return False

        required_files = ['index.html', 'about.html', 'README.md']
        missing_files = []

        for file in required_files:
            if not (self.public_path / file).exists():
                missing_files.append(file)

        if missing_files:
            print(f"⚠️ 必須ファイル不足: {', '.join(missing_files)}")
            print(f"  検証パス: {self.public_path}")
            return False

        print(f"✅ project/public/ フォルダ検証OK")
        return True

    def clean_public(self):
        """開発ツール・認証情報を自動除外（厳密化版）"""
        print("\n🧹 開発ツール・機密ファイルをクリーンアップ中（厳密モード）...")

        # ========================================
        # ドットファイル/フォルダの除外（最優先）
        # ========================================
        # ポートフォリオ公開では基本的にすべてのドットファイルを除外
        # 理由: コード閲覧がメインのため、開発用設定ファイルは不要
        # 迷ったら除外する方が安全
        print("\n  📁 ドットファイル/フォルダを除外中...")

        # 再帰的にドットファイル/フォルダを検索して削除
        dotfiles_removed = []
        for item in list(self.public_path.rglob('.*')):
            if item.exists():
                try:
                    rel_path = item.relative_to(self.public_path)
                    if item.is_dir():
                        shutil.rmtree(item)
                        dotfiles_removed.append(f"{rel_path}/")
                    else:
                        item.unlink()
                        dotfiles_removed.append(str(rel_path))
                except Exception as e:
                    print(f"  ⚠️ 削除失敗: {item} ({e})")

        if dotfiles_removed:
            for removed in dotfiles_removed:
                print(f"  ✅ 削除（ドットファイル）: {removed}")
        else:
            print("  ✅ ドットファイルなし")

        # ========================================
        # 除外するディレクトリ（拡張版）
        # ========================================
        exclude_dirs = [
            'tests', 'test', '__tests__', 'spec', 'specs',  # テストフォルダ
            '__pycache__', 'node_modules', 'venv', 'env',  # 依存関係
            'credentials', 'secrets', 'private',  # 認証情報
            'docs', 'design', 'planning', 'documentation',  # 内部ドキュメント
            'backup', 'old', 'temp', 'tmp', 'cache',  # バックアップ
            'coverage', 'htmlcov',  # カバレッジ
            'logs', 'log'  # ログ
        ]

        # ========================================
        # 除外するファイルパターン（拡張版）
        # ========================================
        exclude_patterns = [
            # テストファイル
            '*.test.js', '*.spec.ts', '*.test.ts', '*.spec.js', 'test_*.py',
            # 開発ツール
            '*agent*.py', '*_agent.py', 'documenter_agent.py',
            'generate_*.js', 'generate_*.py', 'audio_generator*.py',
            # 認証ファイル
            '*.key.json', '*-key.json', '*.pem', '*.cert', '*.key', '*.pfx',
            'env.*', '*.env',
            # 開発ドキュメント
            'WBS*.json', 'DESIGN*.md', 'PROJECT_INFO.yaml', 'SPEC*.md',
            # 設定ファイル
            'pytest.ini', 'jest.config.js', 'karma.conf.js',
            # OS生成ファイル
            'Thumbs.db', 'desktop.ini',
            # エディタファイル
            '*~',
            # ログファイル
            '*.log', '*.out',
            # バックアップ
            '*.backup', '*.bak', '*.old',
            # ロックファイル
            'package-lock.json', 'yarn.lock', 'Pipfile.lock',
            # 実行スクリプト
            'launch_app.command', '*.command', '*.sh', '*.bat',
            # ソースマップ（オプション）
            '*.map'
        ]

        print("\n  📁 その他の不要ファイル/フォルダを除外中...")

        # ホワイトリスト（除外から保護するディレクトリ）
        whitelist_dirs = ['ai-docs']

        for dir_name in exclude_dirs:
            for dir_path in self.public_path.rglob(dir_name):
                if dir_path.is_dir():
                    rel = dir_path.relative_to(self.public_path)
                    if any(part in whitelist_dirs for part in rel.parts):
                        print(f"  ⏭️ 保護（ホワイトリスト）: {rel}/")
                        continue
                    shutil.rmtree(dir_path)
                    print(f"  ✅ 削除: {rel}/")

        for pattern in exclude_patterns:
            for file in self.public_path.rglob(pattern):
                if file.is_file():
                    rel = file.relative_to(self.public_path)
                    if any(part in whitelist_dirs for part in rel.parts):
                        print(f"  ⏭️ 保護（ホワイトリスト）: {rel}")
                        continue
                    file.unlink()
                    print(f"  ✅ 削除: {rel}")

    def clone_portfolio_repo(self, slug: str) -> Path:
        """ai-agent-portfolioリポジトリを一時ディレクトリにclone（M4 Mac対応）"""
        print("\n📥 ai-agent-portfolioリポジトリをclone中...")

        self.temp_dir = Path(tempfile.mkdtemp(prefix="portfolio_"))
        repo_url = f"https://github.com/{self.github_username}/ai-agent-portfolio.git"

        # M4 Mac対応: /usr/bin/gitを優先使用
        git_cmd = '/usr/bin/git' if os.path.exists('/usr/bin/git') else 'git'

        clone_cmd = f"{git_cmd} clone --depth 1 {repo_url} {self.temp_dir}"
        result = subprocess.run(clone_cmd, shell=True, capture_output=True, text=True)

        if result.returncode != 0:
            print("📝 ai-agent-portfolioリポジトリが存在しません - 新規作成します")
            self.temp_dir.mkdir(parents=True, exist_ok=True)
            self._run_command(f"{git_cmd} init", cwd=self.temp_dir)
            self._run_command(f"{git_cmd} checkout -b main", cwd=self.temp_dir)
            self._run_command(f"{git_cmd} remote add origin {repo_url}", cwd=self.temp_dir)

            # 初回コミット用README作成
            readme_path = self.temp_dir / "README.md"
            with open(readme_path, 'w') as f:
                f.write(f"# AI Agent Portfolio\n\nAI-generated portfolio apps\n")

            self._run_command(f"{git_cmd} add .", cwd=self.temp_dir)
            self._run_command(f'{git_cmd} commit -m "Initial commit"', cwd=self.temp_dir)
        else:
            print(f"✅ Clone完了: {self.temp_dir}")

        return self.temp_dir

    def copy_to_temp_portfolio(self, slug: str):
        """project/public/ を一時リポジトリの{slug}/にコピー"""
        print(f"\n📦 {slug} をポートフォリオにコピー中...")

        target_path = self.temp_dir / slug

        # 既存フォルダがあれば削除
        if target_path.exists():
            print(f"🔄 既存の {slug} を更新します")
            shutil.rmtree(target_path)

        # コピー
        shutil.copytree(self.public_path, target_path)
        print(f"✅ コピー完了: {target_path}")

    def _setup_git_credential_helper(self, repo_path: Path):
        """Git認証ヘルパーを設定（M4 Mac対応）"""
        # 既存の認証ヘルパースクリプトを確認
        helper_paths = [
            Path.home() / 'bin' / 'gh-credential-helper.sh',
            Path(__file__).parent / 'gh-credential-helper.sh'
        ]

        helper_script = None
        for path in helper_paths:
            if path.exists():
                helper_script = str(path)
                break

        if not helper_script:
            # 認証ヘルパースクリプトを動的に作成
            temp_helper = repo_path / '.git' / 'credential-helper.sh'
            temp_helper.parent.mkdir(parents=True, exist_ok=True)

            with open(temp_helper, 'w') as f:
                f.write('#!/bin/bash\n')
                f.write('# GitHub CLI credential helper for M4 Mac\n')
                f.write('if [ -x "$HOME/bin/gh" ]; then\n')
                f.write('    exec "$HOME/bin/gh" auth git-credential "$@"\n')
                f.write('elif command -v gh &> /dev/null; then\n')
                f.write('    exec gh auth git-credential "$@"\n')
                f.write('else\n')
                f.write('    echo "Error: GitHub CLI not found" >&2\n')
                f.write('    exit 1\n')
                f.write('fi\n')

            os.chmod(temp_helper, 0o755)
            helper_script = str(temp_helper)

        # Git設定にcredential helperを設定
        subprocess.run(
            ['git', 'config', 'credential.helper', f'!{helper_script}'],
            cwd=repo_path,
            capture_output=True
        )

    def git_commit_and_push(self, slug: str) -> bool:
        """Git commit & push（M4 Mac対応版）"""
        print("\n📤 GitHubにプッシュ中...")

        # 認証ヘルパーを設定
        self._setup_git_credential_helper(self.temp_dir)

        # gitコマンドは/usr/bin/gitを使用（M4 Mac対応）
        git_cmd = '/usr/bin/git' if os.path.exists('/usr/bin/git') else 'git'

        commands = [
            f"{git_cmd} add {slug}/",
            f'{git_cmd} commit -m "feat: update {slug}"',
            f"{git_cmd} push origin main"
        ]

        for cmd in commands:
            if not self._run_command(cmd, cwd=self.temp_dir):
                if "git push" in cmd:
                    print("📝 リポジトリ作成を試みます...")
                    # ghコマンドもM4 Mac対応
                    gh_cmd = os.path.expanduser('~/bin/gh') if os.path.exists(os.path.expanduser('~/bin/gh')) else 'gh'
                    create_cmd = f'{gh_cmd} repo create ai-agent-portfolio --public -d "AI Agent Portfolio" --source . --push'
                    if self._run_command(create_cmd, cwd=self.temp_dir):
                        print("✅ リポジトリ作成・プッシュ成功")
                        return True
                return False

        print("✅ mainブランチへのプッシュ完了")
        return True

    def sync_to_gh_pages(self, slug: str) -> bool:
        """mainブランチの内容をgh-pagesブランチに同期（GitHub Pages用）"""
        print("\n🔄 gh-pagesブランチに同期中...")

        git_cmd = '/usr/bin/git' if os.path.exists('/usr/bin/git') else 'git'

        # gh-pagesブランチが存在するか確認
        result = subprocess.run(
            f"{git_cmd} ls-remote --heads origin gh-pages",
            shell=True, cwd=self.temp_dir, capture_output=True, text=True
        )

        gh_pages_exists = bool(result.stdout.strip())

        if gh_pages_exists:
            # gh-pagesブランチをfetch
            self._run_command(f"{git_cmd} fetch origin gh-pages:gh-pages", cwd=self.temp_dir)
            # gh-pagesにチェックアウト
            self._run_command(f"{git_cmd} checkout gh-pages", cwd=self.temp_dir)
        else:
            # gh-pagesブランチを新規作成（orphanブランチとして）
            print("📝 gh-pagesブランチを新規作成します...")
            self._run_command(f"{git_cmd} checkout --orphan gh-pages", cwd=self.temp_dir)
            # 全ファイルを一度削除（orphanブランチなので）
            self._run_command(f"{git_cmd} rm -rf .", cwd=self.temp_dir)

        # mainブランチから該当slugフォルダをコピー
        self._run_command(f"{git_cmd} checkout main -- {slug}/", cwd=self.temp_dir)

        # コミット＆プッシュ
        self._run_command(f"{git_cmd} add {slug}/", cwd=self.temp_dir)

        # 変更があるかチェック
        diff_result = subprocess.run(
            f"{git_cmd} diff --cached --quiet",
            shell=True, cwd=self.temp_dir, capture_output=True
        )

        if diff_result.returncode != 0:
            # 変更がある場合のみコミット
            self._run_command(
                f'{git_cmd} commit -m "sync: {slug} from main to gh-pages"',
                cwd=self.temp_dir
            )
            if not self._run_command(f"{git_cmd} push origin gh-pages", cwd=self.temp_dir):
                print("⚠️ gh-pagesへのプッシュに失敗しました")
                # mainに戻す
                self._run_command(f"{git_cmd} checkout main", cwd=self.temp_dir)
                return False
            print("✅ gh-pagesブランチへの同期完了")
        else:
            print("✅ gh-pagesは既に最新です（変更なし）")

        # mainブランチに戻る
        self._run_command(f"{git_cmd} checkout main", cwd=self.temp_dir)

        return True

    def cleanup_temp_dir(self):
        """一時ディレクトリを削除"""
        if self.temp_dir and self.temp_dir.exists():
            print(f"\n🧹 一時ディレクトリを削除: {self.temp_dir}")
            shutil.rmtree(self.temp_dir)
            self.temp_dir = None

    def display_completion(self, slug: str):
        """完了メッセージ表示"""
        pages_url = f"https://{self.github_username}.github.io/ai-agent-portfolio/{slug}/"
        repo_url = f"https://github.com/{self.github_username}/ai-agent-portfolio"

        print("\n" + "="*60)
        print("🎉 GitHub公開完了！")
        print("="*60)
        print(f"\n📦 リポジトリURL:")
        print(f"   {repo_url}")
        print(f"\n📊 公開確認:")
        print(f"   {repo_url}/tree/main/{slug}")
        print(f"\n🌐 GitHub Pages（有効化した場合）:")
        print(f"   {pages_url}")
        print(f"   {pages_url}about.html")
        print("\n" + "="*60)

    def verify_before_publish(self) -> bool:
        """公開前の最終セキュリティチェック"""
        print("\n🔍 公開前セキュリティチェック...")

        issues_found = []

        # ========================================
        # ドットファイル/フォルダの検出（最優先チェック）
        # ========================================
        dotfiles = list(self.public_path.rglob('.*'))
        if dotfiles:
            for item in dotfiles:
                rel_path = item.relative_to(self.public_path)
                item_type = "フォルダ" if item.is_dir() else "ファイル"
                issues_found.append(f"  ❌ ドット{item_type}: {rel_path}")

        # ========================================
        # その他の危険なパターン
        # ========================================
        dangerous_patterns = {
            '**/*.key.json': 'APIキーファイル',
            '**/*.pem': '証明書ファイル',
            '**/credentials/*': '認証情報フォルダ',
            '**/old/*': 'バックアップフォルダ',
            '**/backup/*': 'バックアップフォルダ',
            '**/test*/*': 'テストフォルダ',
            '**/*agent*.py': '開発ツール'
        }

        for pattern, description in dangerous_patterns.items():
            for file_path in self.public_path.glob(pattern):
                if file_path.exists():
                    issues_found.append(f"  ❌ {description}: {file_path.relative_to(self.public_path)}")

        if issues_found:
            print("\n⚠️ 以下の問題が検出されました:")
            for issue in issues_found:
                print(issue)

            # auto_modeの場合は自動でクリーンアップを実行
            if self.auto_mode:
                print("\n🤖 自動モード: クリーンアップを自動実行します")
                self.clean_public()
                return True

            print("\n対応を選択してください:")
            print("1. 自動クリーンアップを実行して続行")
            print("2. 処理を中止")

            try:
                choice = input("\n選択 (1/2): ").strip()
                if choice == "1":
                    print("\n🧹 追加クリーンアップを実行中...")
                    self.clean_public()
                    return True
                else:
                    print("\n❌ 処理を中止しました")
                    return False
            except EOFError:
                # 標準入力がない場合（非対話環境）は自動クリーンアップ
                print("\n🤖 非対話環境検出: クリーンアップを自動実行します")
                self.clean_public()
                return True
        else:
            print("  ✅ セキュリティチェック: 問題なし")
            return True

    def publish(self) -> bool:
        """メイン実行関数"""
        print("\n" + "="*60)
        print("🚀 GitHub公開 v8.1（一時clone方式・gh-pages同期対応）")
        print("="*60)

        try:
            # 1. slug決定
            slug = self.get_slug()
            print(f"\n📝 公開slug: {slug}")

            # 2. project/public/ 検証
            if not self.validate_public():
                return False

            # 3. クリーニング
            self.clean_public()

            # 4. セキュリティチェック
            if not self.verify_before_publish():
                return False

            # 5. 一時ディレクトリにclone
            self.clone_portfolio_repo(slug)

            # 6. コピー
            self.copy_to_temp_portfolio(slug)

            # 7. mainブランチにGit push
            if not self.git_commit_and_push(slug):
                return False

            # 8. gh-pagesブランチに同期（GitHub Pages用）
            if not self.sync_to_gh_pages(slug):
                print("⚠️ gh-pages同期に失敗しましたが、mainへの公開は完了しています")
                # mainへの公開は成功しているので続行

            # 9. 完了メッセージ
            self.display_completion(slug)

            return True

        finally:
            # 10. 一時ディレクトリ削除（必ず実行）
            self.cleanup_temp_dir()


def main():
    """コマンドライン実行用"""
    # オプション解析
    args = sys.argv[1:]
    auto_mode = '--auto' in args or '-a' in args
    non_options = [a for a in args if not a.startswith('-')]

    if non_options:
        project_path = non_options[0]
    else:
        project_path = os.getcwd()

    project_path = os.path.abspath(project_path)

    if not os.path.exists(project_path):
        print(f"❌ パスが見つかりません: {project_path}")
        sys.exit(1)

    if auto_mode:
        print("🤖 自動モード有効: 対話なしで実行します")

    publisher = SimplifiedGitHubPublisher(project_path, auto_mode=auto_mode)
    success = publisher.publish()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
