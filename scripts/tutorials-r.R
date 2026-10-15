#!/usr/bin/env Rscript
# Runs the R half of every tutorial's Web | R switch: each ```r block between
# `<!-- usage: r -->` and `<!-- /usage -->`, in a fresh environment and a
# scratch directory, the way a reader pastes it. A file the block writes that
# the panel shows as ../media/<name> is copied into docs/media, so the figure
# is the output of the code beside it.
#   Rscript scripts/tutorials-r.R [topic ...]   every tutorial, or those named
# Needs ggmsaview (remotes::install_github("GMOD/ggmsaview")) and ggplot2.
args <- commandArgs(trailingOnly = TRUE)
files <- Sys.glob("docs/tutorials/*.md")
files <- files[basename(files) != "CLAUDE.md"]
if (length(args)) {
  files <- files[sub("\\.md$", "", basename(files)) %in% args]
}

panels <- function(lines) {
  starts <- grep("^<!--\\s*usage:\\s*r\\s*-->$", trimws(lines))
  lapply(starts, function(s) {
    rest <- seq(s + 1, length(lines))
    end <- rest[grep("^<!--\\s*(/usage|usage:\\s*\\w+)\\s*-->$",
                     trimws(lines[rest]))[1]]
    lines[(s + 1):(end - 1)]
  })
}

fences <- function(panel) {
  open <- grep("^```r\\s*$", panel)
  close <- grep("^```\\s*$", panel)
  lapply(open, function(o) panel[(o + 1):(min(close[close > o]) - 1)])
}

dir.create("docs/media", showWarnings = FALSE)
failed <- character(0)
for (file in files) {
  topic <- sub("\\.md$", "", basename(file))
  for (panel in panels(readLines(file))) {
    shown <- regmatches(panel, regexpr("\\.\\./media/[^)]+", panel))
    dir <- tempfile(topic)
    dir.create(dir)
    env <- new.env(parent = globalenv())
    ok <- tryCatch({
      withr::with_dir(dir, for (code in fences(panel)) {
        eval(parse(text = code), env)
      })
      TRUE
    }, error = function(e) {
      message(topic, ": ", conditionMessage(e))
      FALSE
    })
    if (!ok) {
      failed <- c(failed, topic)
      next
    }
    for (path in shown) {
      made <- file.path(dir, basename(path))
      if (!file.exists(made)) {
        message(topic, ": the panel shows ", path, " but its code wrote no ",
                basename(path))
        failed <- c(failed, topic)
      } else {
        file.copy(made, file.path("docs/media", basename(path)),
                  overwrite = TRUE)
        message(topic, ": wrote docs/media/", basename(path))
      }
    }
  }
}
if (length(failed)) {
  stop("R panels failed: ", paste(unique(failed), collapse = ", "))
}
