the <- new.env(parent = emptyenv())

utils::globalVariables(".data")

need <- function(pkg, what) {
  if (!requireNamespace(pkg, quietly = TRUE)) {
    stop(what, " needs the ", pkg, " package: install.packages(\"", pkg, "\")",
         call. = FALSE)
  }
}

js_context <- function() {
  if (is.null(the$ctx)) {
    need("QuickJSR", "A static figure")
    ctx <- QuickJSR::JSContext$new(stack_size = 64 * 1024 * 1024)
    ctx$source(file = system.file("js", "msaview-core.js", package = "msaviewr"))
    the$ctx <- ctx
  }
  the$ctx
}

as_frame <- function(x) {
  if (length(x) == 0 || length(x[[1]]) == 0) {
    return(NULL)
  }
  as.data.frame(lapply(x, function(col) {
    vapply(col, function(v) if (is.null(v)) NA else v,
           if (is.character(unlist(col))) character(1) else
             if (is.logical(unlist(col))) logical(1) else numeric(1))
  }), stringsAsFactors = FALSE)
}

#' Lay out a viewer as tables
#'
#' Runs the viewer's own model, in an embedded QuickJS engine, over the
#' widget's props and returns what it would draw as data frames: the rows in
#' tree order, the color of each letter, the tree's segments, the domains,
#' highlights and clades in visible columns, the legends and the conservation
#' of each column. Collapsed clades, a focus, hidden gappy columns and the
#' color scheme are all applied, as on screen. [msaview_plot()] draws the
#' result.
#'
#' @param widget A viewer from [msaview()], with any layers added.
#' @return An `msaview_layout`: a list with `rows`, `colors`, `tree`,
#'   `domains`, `highlights`, `clades`, `legends`, `conservation`,
#'   `num_columns`, `reference` and `fill_cells`.
#' @importFrom utils globalVariables
#' @export
#' @examples
#' \dontrun{
#' msaview_layout(msaview(msa = ">a\nMKAANSE\n>b\nMKA-NSE"))
#' }
msaview_layout <- function(widget) {
  if (!inherits(widget, "msaview")) {
    stop("widget must be a viewer made by msaview()")
  }
  out <- js_context()$call("msaviewFigure", as.character(props_json(widget$x$props)))
  raw <- jsonlite::fromJSON(out, simplifyVector = FALSE)
  tree <- raw$tree
  structure(
    list(
      rows = data.frame(
        name = vapply(raw$rows$name, as.character, character(1)),
        seq = vapply(raw$rows$seq, as.character, character(1)),
        stringsAsFactors = FALSE
      ),
      colors = as_frame(raw$colors),
      tree = if (!is.null(tree)) list(
        segments = as_frame(tree$segments),
        collapsed = as_frame(tree$collapsed),
        by_length = isTRUE(tree$byLength)
      ),
      domains = as_frame(raw$domains),
      highlights = as_frame(raw$highlights),
      clades = as_frame(raw$clades),
      legends = lapply(raw$legends, function(l) list(
        title = l$title,
        label = vapply(l$label, as.character, character(1)),
        color = vapply(l$color, as.character, character(1))
      )),
      conservation = vapply(raw$conservation, as.numeric, numeric(1)),
      num_columns = raw$numColumns,
      reference = raw$reference,
      fill_cells = isTRUE(raw$fillCells)
    ),
    class = "msaview_layout"
  )
}

#' @export
print.msaview_layout <- function(x, ...) {
  cat("<msaview_layout>", nrow(x$rows), "rows x", x$num_columns, "columns",
      if (!is.null(x$tree)) "with a tree", "\n")
  invisible(x)
}

# one letter per cell, rows top to bottom, as a character matrix
letter_matrix <- function(layout) {
  n <- layout$num_columns
  chars <- strsplit(layout$rows$seq, "", fixed = TRUE)
  m <- matrix(NA_character_, nrow = length(chars), ncol = n)
  for (i in seq_along(chars)) {
    k <- min(length(chars[[i]]), n)
    if (k > 0) m[i, seq_len(k)] <- chars[[i]][seq_len(k)]
  }
  m
}

cell_colors <- function(layout, letters, field) {
  colors <- layout$colors
  out <- matrix(NA_character_, nrow(letters), ncol(letters))
  if (is.null(colors)) return(out)
  if (all(is.na(colors$col))) {
    out[] <- colors[[field]][match(letters, colors$letter)]
  } else {
    cols <- col(letters)
    out[] <- colors[[field]][match(paste(cols, letters),
                                   paste(colors$col, colors$letter))]
  }
  out
}

reference_matches <- function(layout, letters) {
  ref <- match(layout$reference, layout$rows$name)
  if (is.null(layout$reference) || is.na(ref)) {
    return(matrix(FALSE, nrow(letters), ncol(letters)))
  }
  same <- sweep(letters, 2, letters[ref, ], "==")
  same[is.na(same)] <- FALSE
  same[ref, ] <- FALSE
  same
}

#' Draw a viewer as a ggplot
#'
#' Draws an [msaview_layout()] with ggplot2: the alignment as a raster of
#' colored cells with its letters on top, the domains and highlights over it,
#' the row names down its side, and the tree beside it. The figure is ordinary
#' ggplot2, so `ggsave()`, themes and patchwork apply, and knitr renders it in
#' PDF and Word output.
#'
#' @param x A viewer from [msaview()], or its [msaview_layout()].
#' @param letters Draw each residue's letter. By default, when the alignment
#'   has at most 4000 cells, about what a page can print legibly.
#' @param letter_size Letter size in mm.
#' @param row_labels Name each row down the alignment's side. By default, when
#'   there are at most 60 rows.
#' @param tree_width The tree's width as a fraction of the alignment's.
#' @param conservation Draw the conservation of each column as a bar track
#'   above the alignment.
#' @return A ggplot, or a patchwork of the tree, the alignment and the
#'   conservation track when there is more than one panel.
#' @export
#' @examples
#' \dontrun{
#' w <- msaview(msa = ">human\nMKAANSE\n>mouse\nMKA-NSE",
#'              tree = "(human:0.1,mouse:0.2);") +
#'   geom_msa_highlight(start = 2, end = 4, label = "motif")
#' msaview_plot(w)
#' ggplot2::ggsave("alignment.pdf", msaview_plot(w), width = 6, height = 2)
#' }
msaview_plot <- function(x, letters = NULL, letter_size = 3, row_labels = NULL,
                         tree_width = 0.3, conservation = FALSE) {
  need("ggplot2", "msaview_plot()")
  layout <- if (inherits(x, "msaview_layout")) x else msaview_layout(x)
  aln <- alignment_plot(layout, letters, letter_size,
                        row_labels %||% (nrow(layout$rows) <= 60))
  panels <- list(aln = aln)
  if (!is.null(layout$tree)) {
    panels$tree <- tree_plot(layout)
  }
  if (conservation) {
    panels$track <- conservation_plot(layout)
  }
  if (length(panels) == 1) {
    return(aln)
  }
  need("patchwork", "A figure with a tree or a track")
  tree <- panels$tree %||% patchwork::plot_spacer()
  if (is.null(panels$track)) {
    return(patchwork::wrap_plots(tree, aln, nrow = 1,
                                 widths = c(tree_width, 1)))
  }
  patchwork::wrap_plots(
    patchwork::plot_spacer(), panels$track, tree, aln,
    nrow = 2, widths = c(if (is.null(panels$tree)) 0 else tree_width, 1),
    heights = c(0.15, 1)
  )
}

#' @rdname msaview_plot
#' @param object A viewer from [msaview()].
#' @param ... Passed to [msaview_plot()].
#' @exportS3Method ggplot2::autoplot
autoplot.msaview <- function(object, ...) {
  msaview_plot(object, ...)
}

`%||%` <- function(a, b) if (is.null(a)) b else a

# pretty breaks that stay off the last column, whose label the panel edge cuts
column_breaks <- function(m) {
  b <- pretty(c(1, m))
  b[b >= 1 & b <= m * 0.96]
}

#' @exportS3Method knitr::knit_print
knit_print.msaview <- function(x, ..., options = NULL) {
  if (knitr::is_html_output() ||
      !requireNamespace("QuickJSR", quietly = TRUE) ||
      !requireNamespace("ggplot2", quietly = TRUE)) {
    return(NextMethod())
  }
  knitr::knit_print(msaview_plot(x), ..., options = options)
}

row_scale <- function(layout, labels) {
  n <- nrow(layout$rows)
  ggplot2::scale_y_continuous(
    limits = c(-n - 0.5, -0.5), expand = c(0, 0),
    breaks = if (labels) -seq_len(n) else NULL,
    labels = if (labels) layout$rows$name else NULL
  )
}

bare_theme <- function() {
  ggplot2::theme_minimal() +
    ggplot2::theme(
      panel.grid = ggplot2::element_blank(),
      axis.title = ggplot2::element_blank()
    )
}

alignment_plot <- function(layout, letters, letter_size, row_labels) {
  n <- nrow(layout$rows)
  m <- layout$num_columns
  aes <- ggplot2::aes
  letter_mat <- letter_matrix(layout)
  fills <- cell_colors(layout, letter_mat, "fill")
  matches <- reference_matches(layout, letter_mat)
  draw_letters <- if (is.null(letters)) n * m <= 4000 else letters

  p <- ggplot2::ggplot() + bare_theme() + row_scale(layout, row_labels) +
    ggplot2::scale_x_continuous(limits = c(0.5, m + 0.5), expand = c(0, 0),
                                breaks = column_breaks(m), position = "top")
  if (layout$fill_cells && n > 0 && m > 0) {
    raster <- fills
    raster[matches] <- "#0000000a"
    raster[is.na(raster)] <- "transparent"
    p <- p + ggplot2::annotation_raster(
      grDevices::as.raster(raster), xmin = 0.5, xmax = m + 0.5,
      ymin = -n - 0.5, ymax = -0.5, interpolate = FALSE
    )
  }

  domains <- layout$domains
  if (!is.null(domains)) {
    values <- stats::setNames(domains$fill, domains$label)
    values <- values[!duplicated(names(values))]
    p <- p +
      ggplot2::geom_rect(
        data = domains,
        aes(xmin = .data$start - 0.5, xmax = .data$end + 0.5,
            ymin = -.data$row - 0.5, ymax = -.data$row + 0.5,
            fill = .data$label),
        colour = domains$stroke, alpha = if (layout$fill_cells) 0.35 else 0.8,
        linewidth = 0.3
      ) +
      ggplot2::scale_fill_manual(name = domain_legend_title(layout),
                                 values = values)
  }

  if (draw_letters && n > 0 && m > 0) {
    cells <- data.frame(
      x = as.vector(col(letter_mat)), y = -as.vector(row(letter_mat)),
      letter = as.vector(letter_mat),
      color = as.vector(
        if (layout$fill_cells) cell_colors(layout, letter_mat, "text")
        else fills
      ),
      match = as.vector(matches),
      stringsAsFactors = FALSE
    )
    cells <- cells[!is.na(cells$letter), ]
    cells$letter[cells$match] <- "."
    cells$color[is.na(cells$color) | cells$match] <- "#000000de"
    if (!is.null(domains) && layout$fill_cells) {
      over <- vapply(seq_len(nrow(cells)), function(i) {
        any(domains$row == -cells$y[i] & domains$start <= cells$x[i] &
              domains$end >= cells$x[i])
      }, logical(1))
      cells$color[over] <- "#000000de"
    }
    p <- p + ggplot2::geom_text(
      data = cells, aes(x = .data$x, y = .data$y, label = .data$letter),
      colour = cells$color, size = letter_size, family = "sans"
    )
  }

  p <- p + highlight_layers(layout) + clade_layers(layout, m)
  p
}

domain_legend_title <- function(layout) {
  for (legend in layout$legends) {
    if (any(legend$label %in% layout$domains$label)) return(legend$title)
  }
  NULL
}

highlight_layers <- function(layout) {
  h <- layout$highlights
  if (is.null(h)) return(list())
  n <- nrow(layout$rows)
  m <- layout$num_columns
  h$xmin <- ifelse(is.na(h$start), 0.5, h$start - 0.5)
  h$xmax <- ifelse(is.na(h$end), m + 0.5, h$end + 0.5)
  h$ymin <- ifelse(is.na(h$row), -n - 0.5, -h$row - 0.5)
  h$ymax <- ifelse(is.na(h$row), -0.5, -h$row + 0.5)
  fill <- ifelse(is.na(h$color), "#ff8c00", h$color)
  stroke <- ifelse(is.na(h$color), "#d25a00", h$color)
  labelled <- h[!is.na(h$label), ]
  list(
    ggplot2::geom_rect(
      data = h,
      ggplot2::aes(xmin = .data$xmin, xmax = .data$xmax,
                   ymin = .data$ymin, ymax = .data$ymax),
      fill = fill, colour = stroke, alpha = 0.28, linewidth = 0.6
    ),
    if (nrow(labelled) > 0) ggplot2::geom_label(
      data = labelled,
      ggplot2::aes(x = .data$xmax, y = .data$ymax, label = .data$label),
      hjust = 0, vjust = 1, size = 2.8, label.size = 0, fill = "white",
      alpha = 0.85
    )
  )
}

clade_layers <- function(layout, m) {
  cl <- layout$clades
  if (is.null(cl)) return(list())
  cl <- cl[cl$mark == "highlight", ]
  if (nrow(cl) == 0) return(list())
  list(ggplot2::geom_rect(
    data = cl,
    ggplot2::aes(xmin = 0.5, xmax = m + 0.5,
                 ymin = -.data$last - 0.5, ymax = -.data$first + 0.5),
    fill = cl$color, inherit.aes = FALSE
  ))
}

tree_plot <- function(layout) {
  t <- layout$tree
  p <- ggplot2::ggplot() + bare_theme() + row_scale(layout, FALSE) +
    ggplot2::theme(axis.text = ggplot2::element_blank())
  cl <- layout$clades
  if (!is.null(cl)) {
    marked <- cl[cl$mark == "highlight", ]
    if (nrow(marked) > 0) {
      p <- p + ggplot2::annotate(
        "rect", xmin = -Inf, xmax = Inf,
        ymin = -marked$last - 0.5, ymax = -marked$first + 0.5,
        fill = marked$color
      )
    }
  }
  if (!is.null(t$segments)) {
    p <- p + ggplot2::geom_segment(
      data = t$segments,
      ggplot2::aes(x = .data$x, y = -.data$y, xend = .data$xend,
                   yend = -.data$yend),
      linewidth = 0.4, lineend = "square"
    )
  }
  if (!is.null(t$collapsed)) {
    p <- p + ggplot2::geom_polygon(
      data = t$collapsed,
      ggplot2::aes(x = .data$x, y = -.data$y, group = .data$group),
      fill = "grey70", colour = "grey30", linewidth = 0.3
    )
  }
  p + ggplot2::scale_x_continuous(expand = ggplot2::expansion(mult = c(0.02, 0.02)))
}

conservation_plot <- function(layout) {
  d <- data.frame(x = seq_along(layout$conservation), y = layout$conservation)
  ggplot2::ggplot(d, ggplot2::aes(x = .data$x, y = .data$y)) +
    ggplot2::geom_col(width = 1, fill = "grey55") +
    ggplot2::scale_x_continuous(limits = c(0.5, layout$num_columns + 0.5),
                                expand = c(0, 0)) +
    ggplot2::scale_y_continuous(limits = c(0, 1), expand = c(0, 0),
                                breaks = NULL) +
    bare_theme() +
    ggplot2::theme(axis.text.x = ggplot2::element_blank()) +
    ggplot2::labs(y = "Conservation")
}
