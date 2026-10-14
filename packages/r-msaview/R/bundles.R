bundle_hint <- paste0(
  "msaviewr was installed without its JavaScript, which main does not track. ",
  "Install the built package with ",
  "remotes::install_github(\"GMOD/JBrowseMSA@r-dist\"), or in a checkout run ",
  "`pnpm build && pnpm sync:r-bundle` before installing."
)

has_bundle <- function(path) {
  nzchar(system.file(path, package = "msaviewr"))
}

.onAttach <- function(libname, pkgname) {
  if (!has_bundle("htmlwidgets/lib/react-msaview.umd.js")) {
    packageStartupMessage(bundle_hint)
  }
}
