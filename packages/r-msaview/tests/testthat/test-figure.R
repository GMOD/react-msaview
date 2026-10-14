skip_if_not_installed("QuickJSR")

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

test_that("the plot builds, with the tree beside the alignment", {
  skip_if_not_installed("ggplot2")
  skip_if_not_installed("patchwork")
  w <- msaview(msa = msa, tree = tree, gff =
    "##gff-version 3\nhuman\tpfam\tdomain\t2\t4\t.\t.\t.\tName=Dom")
  p <- msaview_plot(w, conservation = TRUE)
  expect_s3_class(p, "patchwork")
  file <- tempfile(fileext = ".pdf")
  ggplot2::ggsave(file, p, width = 6, height = 2)
  expect_gt(file.size(file), 1000)

  alone <- msaview_plot(msaview(msa = msa))
  expect_s3_class(alone, "ggplot")
  built <- ggplot2::ggplot_build(alone)
  expect_true(any(vapply(built$data, function(d) "label" %in% names(d),
                         logical(1))))
})
