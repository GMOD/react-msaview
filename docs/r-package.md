# R package

The R package is [ggmsaview](https://github.com/GMOD/ggmsaview), in a repository
of its own.

- **In:** an alignment (FASTA, Stockholm, Clustal, A3M, or a Biostrings object),
  a tree (Newick, ape, treeio or ggtree), and the annotations to draw on them
- **Out:** this viewer as an htmlwidget for RStudio, R Markdown, Quarto and
  Shiny; a ggplot2 figure drawn from the viewer's own layout, with
  `msaview_plot()`; or the viewer's own SVG export, with `msaview_save()`

```r
remotes::install_github("GMOD/ggmsaview")
```

Its [gallery](https://github.com/GMOD/ggmsaview#gallery) draws each example
twice, with this viewer's SVG export beside the ggplot2 figure.
