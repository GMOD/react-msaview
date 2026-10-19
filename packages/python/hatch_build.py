from pathlib import Path

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        bundle = Path(self.root) / "jbrowsemsa" / "static" / "widget.js"
        if not bundle.is_file():
            raise FileNotFoundError(
                f"{bundle} is missing. Build it with "
                "`pnpm --filter jbrowsemsa build` from the repository root."
            )
