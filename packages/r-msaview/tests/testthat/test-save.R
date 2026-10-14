msa <- ">Homo sapiens\nMKAANSE\n>Mouse\nMKA-NSE"

test_that("the props JSON keeps arrays of one and integer columns", {
  w <- msaview(msa = msa) +
    geom_msa_highlight(start = 2, end = 4, label = "motif") +
    geom_msa_highlight(columns = 7)
  json <- as.character(props_json(w$x$props))
  expect_match(json, '"highlights":[{', fixed = TRUE)
  expect_match(json, '"highlightColumns":[7]', fixed = TRUE)
})

test_that("a file type the CLI cannot write is refused before it runs", {
  expect_error(msaview_save(msaview(msa = msa), "fig.jpg", cli = "false"),
               "must end in")
  expect_error(msaview_save(list(), "fig.svg"), "msaview()")
})

test_that("a failing CLI stops with its output", {
  script <- tempfile(fileext = ".R")
  writeLines('cat("broken\\n", file = stderr()); quit(status = 3)', script)
  expect_error(
    msaview_save(msaview(msa = msa), tempfile(fileext = ".svg"),
                 cli = c("Rscript", shQuote(script))),
    "broken"
  )
})

# MSAVIEW_CLI names the built CLI, e.g. packages/cli/dist/index.js
test_that("the saved figure draws the widget's layers", {
  cli <- Sys.getenv("MSAVIEW_CLI")
  skip_if(cli == "", "MSAVIEW_CLI is unset")
  w <- msaview(msa = msa) +
    geom_msa_highlight(start = 2, end = 4, label = "motif")
  svg <- tempfile(fileext = ".svg")
  msaview_save(w, svg, cli = c("node", cli))
  text <- paste(readLines(svg, warn = FALSE), collapse = "\n")
  expect_match(text, "motif", fixed = TRUE)
  expect_match(text, ">Mouse<", fixed = TRUE)
})
