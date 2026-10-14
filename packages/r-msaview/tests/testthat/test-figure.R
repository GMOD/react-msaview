skip_if_not_installed("QuickJSR")
skip_if_not(has_bundle("js/msaview-core.js"), "pnpm sync:r-bundle has not run")

msa <- ">human\nMKAANSE\n>mouse\nMKA-NSE\n>fish\nMRA-NSQ"
tree <- "((fish:1,mouse:1):1,human:2);"

test_that("rows come out in the tree's order with their visible columns", {
  lay <- msaview_layout(msaview(msa = msa, tree = tree))
  expect_equal(lay$rows$name, c("fish", "mouse", "human"))
  expect_equal(lay$rows$seq[3], "MKAANSE")
  expect_equal(lay$num_columns, 7)
  expect_true(lay$tree$by_length)
  expect_equal(sort(unique(c(lay$tree$segments$y, lay$tree$segments$yend))),
               c(1, 1.5, 2, 3))
})

test_that("a static scheme colors by letter, a dynamic one by column", {
  static <- msaview_layout(msaview(msa = msa, color_scheme = "clustal"))
  expect_true(all(is.na(static$colors$col)))
  expect_match(static$colors$fill, "^#[0-9a-f]{6,8}$")
  dynamic <- msaview_layout(
    msaview(msa = msa, color_scheme = "clustalx_protein_dynamic")
  )
  expect_false(anyNA(dynamic$colors$col))
})

test_that("a collapsed clade and hidden gaps reach the tables", {
  lay <- msaview_layout(
    msaview(msa = ">a\nMK-A\n>b\nMK-A\n>c\nMKWA", tree = "((a,b),c);",
            allowed_gappyness = 50)
  )
  expect_equal(lay$num_columns, 3)
})

test_that("domains and highlights land in visible columns", {
  gff <- "##gff-version 3\nhuman\tpfam\tdomain\t2\t4\t.\t.\t.\tName=Dom"
  w <- msaview(msa = msa, gff = gff) +
    geom_msa_highlight(row = "mouse", start = 4, end = 5, label = "site")
  lay <- msaview_layout(w)
  expect_equal(lay$domains$row, 1)
  expect_equal(c(lay$domains$start, lay$domains$end), c(2, 4))
  expect_equal(lay$domains$label, "Dom")
  expect_equal(c(lay$highlights$start, lay$highlights$end), c(5, 6))
  expect_equal(lay$highlights$label, "site")
})

test_that("R reads a URL the props name, since QuickJS fetches nothing", {
  fasta <- tempfile(fileext = ".fa")
  writeLines(msa, fasta)
  props <- inline_remote(list(
    msaUrl = paste0("file://", fasta),
    treeFilehandle = list(uri = paste0("file://", fasta))
  ))
  expect_equal(props$msa, msa)
  expect_null(props$msaUrl)
  expect_null(props$treeFilehandle)
})

test_that("highlight_columns draws as 1-based column highlights", {
  lay <- msaview_layout(msaview(msa = msa, highlight_columns = c(2, 3, 6)))
  expect_equal(lay$highlights$start, c(2, 6))
  expect_equal(lay$highlights$end, c(3, 6))
})

test_that("the plot builds, with the tree beside the alignment", {
  skip_if_not_installed("ggplot2")
  skip_if_not_installed("patchwork")
  w <- msaview(msa = msa, tree = tree, gff =
    "##gff-version 3\nhuman\tpfam\tdomain\t2\t4\t.\t.\t.\tName=Dom")
  p <- msaview_plot(w, tracks = "sequence-logo")
  expect_s3_class(p, "patchwork")
  file <- tempfile(fileext = ".pdf")
  ggplot2::ggsave(file, p, width = 6, height = 2)
  expect_gt(file.size(file), 1000)

  alone <- msaview_plot(msaview(msa = msa), tracks = FALSE)
  expect_s3_class(alone, "ggplot")
  built <- ggplot2::ggplot_build(alone)
  expect_true(any(vapply(built$data, function(d) "label" %in% names(d),
                         logical(1))))
})

test_that("the layout lists every track, flagging the ones the viewer shows", {
  lay <- msaview_layout(msaview(msa = msa))
  ids <- vapply(lay$tracks, function(t) t$id, character(1))
  on <- vapply(lay$tracks, function(t) t$on, logical(1))
  expect_equal(ids, c("conservation", "property-conservation", "sequence-logo"))
  expect_equal(on, c(TRUE, TRUE, FALSE))
  expect_length(lay$tracks[[1]]$values, 7)
  logo <- lay$tracks[[3]]$letters
  expect_true(all(logo$ymax > logo$ymin))
  expect_lte(max(logo$ymax), lay$tracks[[3]]$max_bits)
})

test_that("a column track of your own reaches the figure", {
  skip_if_not_installed("ggplot2")
  skip_if_not_installed("patchwork")
  w <- msaview(msa = msa) +
    geom_msa_track(c(0.1, 0.5, 1, 0, 0, 0.2, 0.9), name = "score") +
    geom_msa_track(name = "pairs", kind = "arc",
                   arcs = data.frame(start = 1, end = 5))
  lay <- msaview_layout(w)
  ids <- vapply(lay$tracks, function(t) t$id, character(1))
  expect_true(all(c("score", "pairs") %in% ids))
  arcs <- lay$tracks[[which(ids == "pairs")]]$arcs
  expect_equal(c(arcs$start, arcs$end), c(1, 5))
  p <- msaview_plot(w, tracks = c("score", "pairs", "sequence-logo"))
  # three track rows and the alignment's, two panels each; patchwork holds the
  # last panel outside its patches
  expect_length(p$patches$plots, 7)
  expect_error(msaview_plot(w, tracks = "nope"), "no track named 'nope'")
})
