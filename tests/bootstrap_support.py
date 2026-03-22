import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class BootstrapWorkspaceTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.target = Path(self.temp_dir.name)
        shutil.copytree(ROOT / "bootstrap", self.target / "bootstrap")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    @property
    def brief_path(self) -> Path:
        return self.target / "bootstrap" / "project_brief.yaml"

    def init_git_repo(self) -> None:
        subprocess.run(["git", "init"], cwd=self.target, check=True)
        subprocess.run(["git", "config", "user.name", "AI Operating System"], cwd=self.target, check=True)
        subprocess.run(["git", "config", "user.email", "ai-os@local"], cwd=self.target, check=True)

    def commit_bootstrap_baseline(self) -> None:
        self.init_git_repo()
        subprocess.run(["git", "add", "."], cwd=self.target, check=True)
