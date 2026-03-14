#!/usr/bin/env python3
"""
🚀 GitHub公開スクリプト v8.0 - 厳格版
DELIVERYフォルダのみを https://github.com/sohei-t/ai-agent-portfolio にプッシュ
"""

import os
import sys
import subprocess
import shutil
import re
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional

class GitHubPublisherV8:
    """厳格なGitHub公開ルールを実装"""

    def __init__(self, project_path: str = None):
        """
        Args:
            project_path: プロジェクトのパス（AI-Apps内のフォルダ）
        """
        self.project_path = Path(project_path or os.getcwd())
        self.delivery_path = self.project_path / "DELIVERY"

        # ハードコードされたリポジトリ設定
        self.github_username = os.environ.get("GITHUB_USERNAME", "your-username")
        self.repo_name = "ai-agent-portfolio"
        self.portfolio_repo = Path.home() / "Desktop" / "GitHub" / self.repo_name
        self.remote_url = f"https://github.com/{self.github_username}/{self.repo_name}.git"

    def _run_command(self, cmd: str, cwd: Path = None) -> bool:
        """コマンド実行"""
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                cwd=cwd or self.project_path,
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                print(f"❌ エラー: {result.stderr}")
                return False
            return True
        except Exception as e:
            print(f"❌ コマンド実行エラー: {e}")
            return False

    def get_slug(self, project_name: str = None) -> str:
        """プロジェクト名からslugを生成（日付除去）"""
        if not project_name:
            project_name = self.project_path.name

        # 日付プレフィックス除去（YYYYMMDD- or YYYY-MM-DD-）
        slug = re.sub(r'^\d{8}-', '', project_name)
        slug = re.sub(r'^\d{4}-\d{2}-\d{2}-', '', slug)

        # -agent サフィックス除去
        slug = re.sub(r'-agent$', '', slug)

        # 正規化
        slug = slug.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')

        return slug

    def validate_delivery(self) -> bool:
        """DELIVERYフォルダの検証"""
        if not self.delivery_path.exists():
            print("❌ DELIVERYフォルダが見つかりません")
            print("  先に以下を実行してください:")
            print("  1. delivery_organizer.py でDELIVERYフォルダ作成")
            print("  2. documenter_agent_v2.py でドキュメント生成")
            return False

        # 必須ファイルチェック
        required_files = ['README.md', 'about.html', 'index.html']
        missing = []
        for file in required_files:
            if not (self.delivery_path / file).exists():
                missing.append(file)

        if missing:
            print(f"⚠️ 必須ファイルが不足: {', '.join(missing)}")
            print("  delivery_organizer.py を実行してください")
            return False

        print("✅ DELIVERYフォルダ検証OK")
        return True

    def clean_delivery(self):
        """DELIVERYフォルダから不要ファイルを除去"""
        exclude_patterns = [
            '.git', '.gitignore', '.env', '.env.*',
            '__pycache__', '*.pyc', '.pytest_cache',
            '.DS_Store', 'Thumbs.db',
            'node_modules', 'venv', '.venv',
            '*.log', '*.tmp', '*.bak',
            'test_*', '*_test.py'
        ]

        print("🧹 不要ファイルをクリーニング中...")
        for pattern in exclude_patterns:
            for path in self.delivery_path.rglob(pattern):
                if path.is_file():
                    path.unlink()
                elif path.is_dir():
                    shutil.rmtree(path)

    def prepare_portfolio_repo(self) -> bool:
        """ポートフォリオリポジトリの準備"""
        if not self.portfolio_repo.exists():
            print(f"📁 ポートフォリオリポジトリを作成: {self.portfolio_repo}")
            self.portfolio_repo.mkdir(parents=True, exist_ok=True)

            # Git初期化
            self._run_command("git init", cwd=self.portfolio_repo)
            self._run_command(f"git remote add origin {self.remote_url}", cwd=self.portfolio_repo)

            # 基本ファイル作成
            readme = self.portfolio_repo / "README.md"
            readme.write_text(f"# AI Agent Portfolio\n\nAI-generated applications showcase\n")

            gitignore = self.portfolio_repo / ".gitignore"
            gitignore.write_text(".DS_Store\nnode_modules/\n.env\n")

            self._run_command("git add .", cwd=self.portfolio_repo)
            self._run_command('git commit -m "Initial commit"', cwd=self.portfolio_repo)

        return True

    def copy_delivery_to_app_folder(self, slug: str) -> Path:
        """DELIVERYフォルダをアプリ専用フォルダにコピー"""
        # apps/フォルダ内にアプリ専用フォルダを作成
        apps_dir = self.portfolio_repo / "apps"
        apps_dir.mkdir(exist_ok=True)

        target_path = apps_dir / slug

        # 既存フォルダがある場合は削除
        if target_path.exists():
            print(f"🔄 既存の {slug} を更新中...")
            shutil.rmtree(target_path)

        print(f"📦 DELIVERYフォルダを apps/{slug} にコピー中...")
        shutil.copytree(self.delivery_path, target_path)

        print(f"✅ コピー完了: {target_path}")
        return target_path

    def update_portfolio_index(self, slug: str):
        """ポートフォリオのindex.htmlを更新"""
        index_path = self.portfolio_repo / "index.html"

        if not index_path.exists():
            # 新規作成
            content = self._create_portfolio_index()
        else:
            content = index_path.read_text()

        # アプリリンクを追加（重複チェック付き）
        if f'href="apps/{slug}/"' not in content:
            app_link = f'<li><a href="apps/{slug}/">{slug}</a> - <a href="apps/{slug}/about.html">About</a></li>\n'
            content = content.replace('<!-- APP_LINKS -->', app_link + '<!-- APP_LINKS -->')

        index_path.write_text(content)
        print("✅ ポートフォリオindex.html更新")

    def _create_portfolio_index(self) -> str:
        """ポートフォリオのindex.html テンプレート"""
        return """<!DOCTYPE html>
<html>
<head>
    <title>AI Agent Portfolio</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>🚀 AI Agent Portfolio</h1>
    <p>AI-generated applications showcase by sohei-t</p>
    <h2>📱 Applications</h2>
    <ul>
        <!-- APP_LINKS -->
    </ul>
</body>
</html>"""

    def git_operations(self, slug: str, update_type: str = "add") -> bool:
        """Git操作（add, commit, push）"""
        print("\n📤 GitHubにプッシュ中...")

        # Git操作
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if update_type == "update":
            commit_msg = f"update: {slug} - Updated at {timestamp}"
        else:
            commit_msg = f"feat: {slug} - AI-generated app added at {timestamp}"

        commands = [
            "git add .",
            f'git commit -m "{commit_msg}"',
            f"git push -u origin main"
        ]

        for cmd in commands:
            if not self._run_command(cmd, cwd=self.portfolio_repo):
                if "git push" in cmd and "rejected" in str(cmd):
                    print("⚠️ リモートに変更があります。プル後に再実行してください")
                    self._run_command("git pull origin main --rebase", cwd=self.portfolio_repo)
                    self._run_command(cmd, cwd=self.portfolio_repo)
                else:
                    return False

        print("✅ GitHubプッシュ完了")
        return True

    def publish(self, update: bool = False) -> Dict[str, str]:
        """メイン公開処理"""
        print("=" * 60)
        print("🚀 GitHub Portfolio Publisher v8.0")
        print(f"📍 対象リポジトリ: {self.remote_url}")
        print("=" * 60)

        # 1. DELIVERYフォルダ検証
        if not self.validate_delivery():
            return {"status": "error", "message": "DELIVERY validation failed"}

        # 2. クリーニング
        self.clean_delivery()

        # 3. slug取得
        slug = self.get_slug()
        print(f"📝 アプリ名: {slug}")

        # 4. ポートフォリオリポジトリ準備
        self.prepare_portfolio_repo()

        # 5. DELIVERYをapps/フォルダにコピー
        target_path = self.copy_delivery_to_app_folder(slug)

        # 6. ポートフォリオindex更新
        self.update_portfolio_index(slug)

        # 7. Git操作
        update_type = "update" if update else "add"
        if not self.git_operations(slug, update_type):
            return {"status": "error", "message": "Git operations failed"}

        # 8. 完了
        result = {
            "status": "success",
            "slug": slug,
            "local_path": str(target_path),
            "github_url": f"https://github.com/{self.github_username}/{self.repo_name}/tree/main/apps/{slug}",
            "pages_url": f"https://{self.github_username}.github.io/{self.repo_name}/apps/{slug}/"
        }

        print("\n" + "=" * 60)
        print("✅ 公開完了！")
        print(f"📁 ローカル: {result['local_path']}")
        print(f"🔗 GitHub: {result['github_url']}")
        print(f"🌐 Pages: {result['pages_url']}")
        print("=" * 60)

        return result


def main():
    """CLI実行"""
    if len(sys.argv) > 1:
        project_path = sys.argv[1]
    else:
        project_path = os.getcwd()

    # updateフラグチェック
    update = "--update" in sys.argv or "-u" in sys.argv

    publisher = GitHubPublisherV8(project_path)
    result = publisher.publish(update=update)

    if result["status"] == "error":
        print(f"❌ エラー: {result['message']}")
        sys.exit(1)


if __name__ == "__main__":
    main()