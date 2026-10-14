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
    if (!has_bundle("js/msaview-core.js")) stop(bundle_hint, call. = FALSE)
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
    values <- unlist(col)
    type <- if (is.character(values)) character(1) else
      if (is.logical(values) || is.null(values)) logical(1) else numeric(1)
    na <- type[NA_integer_]
    vapply(col, function(v) if (is.null(v)) na else v, type)
  }), stringsAsFactors = FALSE)
}

#' Lay out a viewer as tables
#'
#' Runs the viewer's own model, in an embedded QuickJS engine, over the
#' widget's props and returns what it would draw as data frames: the rows in
#' tree order, the color of each letter, the tree's segments, the domains,
#' highlights and clades in visible columns, the legends and every column
#' track the viewer can draw above the alignment. Collapsed clades, a focus, hidden gappy columns and the
#' color scheme are all applied, as on screen. [msaview_plot()] draws the
#' result.
#'
#' @param widget A viewer from [msaview()], with any layers added.
#' @return An `msaview_layout`: a list with `rows`, `colors`, `tree`,
#'   `domains`, `highlights`, `clades`, `legends`, `tracks`, `num_columns`,
#'   `row_height`, `reference` and `fill_cells`. Each track is a list with
#'   its `id`, `name`, `kind`, pixel `height`, whether the viewer shows it
#'   (`on`), and its content: `values` for a bar, `letters` for a logo, `arcs`
#'   for an arc and `cells` for a text track.
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
  props <- inline_remote(widget$x$props)
  out <- js_context()$call("msaviewFigure", as.character(props_json(props)))
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
      tracks = lapply(raw$tracks, parse_track),
      num_columns = raw$numColumns,
      row_height = raw$rowHeight,
      reference = raw$reference,
      fill_cells = isTRUE(raw$fillCells)
    ),
    class = "msaview_layout"
  )
}

parse_track <- function(t) {
  list(
    id = t$id, name = t$name, kind = t$kind, on = isTRUE(t$on),
    height = t$height, color = t$color, max_bits = t$maxBits,
    values = if (!is.null(t$values)) vapply(t$values, as.numeric, numeric(1)),
    letters = as_frame(t$letters),
    arcs = as_frame(t$arcs),
    cells = as_frame(t$cells)
  )
}

# QuickJS fetches nothing, so R reads each URL the props name into the text
# prop the viewer would have filled from it
inline_remote <- function(props) {
  for (layer in c("msa", "tree", "gff")) {
    url_prop <- paste0(layer, "Url")
    handle_prop <- paste0(layer, "Filehandle")
    url <- props[[handle_prop]]$uri %||% props[[url_prop]]
    if (!is.null(url) && is.null(props[[layer]])) {
      props[[layer]] <- paste(readLines(url, warn = FALSE), collapse = "\n")
    }
    props[[url_prop]] <- NULL
    props[[handle_prop]] <- NULL
  }
  props
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
#' @param tracks The column tracks to draw above the alignment: `TRUE` for
#'   the ones the viewer shows, `FALSE` for none, or the ids or names of the
#'   ones to draw, such as `"sequence-logo"`, which the viewer hides by
#'   default. `msaview_layout(x)$tracks` lists them all.
#' @return A ggplot, or a patchwork of the tree, the alignment and the tracks
#'   when there is more than one panel.
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
                         tree_width = 0.3, tracks = TRUE) {
  need("ggplot2", "msaview_plot()")
  layout <- if (inherits(x, "msaview_layout")) x else msaview_layout(x)
  aln <- alignment_plot(layout, letters, letter_size,
                        row_labels %||% (nrow(layout$rows) <= 60))
  shown <- pick_tracks(layout$tracks, tracks)
  has_tree <- !is.null(layout$tree)
  if (length(shown) == 0 && !has_tree) {
    return(aln)
  }
  need("patchwork", "A figure with a tree or a track")
  track_panels <- lapply(shown, track_plot, layout = layout)
  left <- c(rep(list(patchwork::plot_spacer()), length(shown)),
            list(if (has_tree) tree_plot(layout) else patchwork::plot_spacer()))
  heights <- c(vapply(shown, function(t) t$height, numeric(1)),
               max(nrow(layout$rows), 1) * layout$row_height)
  patchwork::wrap_plots(
    c(rbind(left, c(track_panels, list(aln)))),
    ncol = 2, byrow = TRUE, heights = heights,
    widths = c(if (has_tree) tree_width else 0, 1)
  )
}

pick_tracks <- function(all, tracks) {
  if (isTRUE(tracks)) {
    return(Filter(function(t) t$on, all))
  }
  if (isFALSE(tracks) || is.null(tracks)) {
    return(list())
  }
  ids <- vapply(all, function(t) t$id, character(1))
  names <- vapply(all, function(t) t$name, character(1))
  unknown <- setdiff(tracks, c(ids, names))
  if (length(unknown) > 0) {
    stop("no track named ", paste0("'", unknown, "'", collapse = ", "),
         "; the viewer has ", paste0("'", ids, "'", collapse = ", "),
         call. = FALSE)
  }
  Filter(function(t) t$id %in% tracks || t$name %in% tracks, all)
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

track_plot <- function(track, layout) {
  m <- layout$num_columns
  p <- switch(track$kind,
    bar = bar_track(track),
    logo = logo_track(track),
    arc = arc_track(track),
    text = text_track(track),
    ggplot2::ggplot()
  )
  p +
    ggplot2::scale_x_continuous(limits = c(0.5, m + 0.5), expand = c(0, 0)) +
    bare_theme() +
    ggplot2::theme(
      axis.text = ggplot2::element_blank(),
      axis.title.y = ggplot2::element_text(angle = 0, vjust = 0.5, hjust = 1,
                                           size = 8)
    ) +
    ggplot2::labs(y = track$name)
}

bar_track <- function(track) {
  d <- data.frame(x = seq_along(track$values), y = track$values)
  ggplot2::ggplot(d, ggplot2::aes(x = .data$x, y = .data$y)) +
    ggplot2::geom_col(width = 1, fill = track$color %||% "grey55") +
    ggplot2::scale_y_continuous(limits = c(0, 1), expand = c(0, 0))
}

arc_track <- function(track) {
  a <- track$arcs
  p <- ggplot2::ggplot() +
    ggplot2::scale_y_continuous(limits = c(0, 1), expand = c(0, 0))
  if (is.null(a)) return(p)
  span <- max(a$end - a$start, 1)
  t <- seq(0, 1, length.out = 33)
  curves <- do.call(rbind, lapply(seq_len(nrow(a)), function(i) {
    apex <- 0.95 * sqrt((a$end[i] - a$start[i]) / span)
    data.frame(
      x = a$start[i] + (a$end[i] - a$start[i]) * t,
      y = 4 * apex * t * (1 - t),
      group = i, color = a$color[i] %||% NA
    )
  }))
  curves$color[is.na(curves$color)] <- "#000000de"
  p + ggplot2::geom_path(
    data = curves,
    ggplot2::aes(x = .data$x, y = .data$y, group = .data$group),
    colour = curves$color, linewidth = 0.3
  )
}

text_track <- function(track) {
  cells <- track$cells
  p <- ggplot2::ggplot() +
    ggplot2::scale_y_continuous(limits = c(0, 1), expand = c(0, 0))
  if (is.null(cells)) return(p)
  filled <- cells[!is.na(cells$fill), ]
  if (nrow(filled) > 0) {
    p <- p + ggplot2::geom_rect(
      data = filled,
      ggplot2::aes(xmin = .data$col - 0.5, xmax = .data$col + 0.5,
                   ymin = 0, ymax = 1),
      fill = filled$fill
    )
  }
  p + ggplot2::geom_text(
    data = cells, ggplot2::aes(x = .data$col, y = 0.5, label = .data$letter),
    colour = cells$text, size = 2.5, family = "sans"
  )
}

logo_track <- function(track) {
  l <- track$letters
  p <- ggplot2::ggplot() +
    ggplot2::scale_y_continuous(limits = c(0, track$max_bits), expand = c(0, 0))
  if (is.null(l)) return(p)
  l <- l[l$ymax - l$ymin > track$max_bits / 200, ]
  shapes <- logo_polygons(l)
  if (is.null(shapes)) {
    return(p + ggplot2::geom_rect(
      data = l,
      ggplot2::aes(xmin = .data$col - 0.45, xmax = .data$col + 0.45,
                   ymin = .data$ymin, ymax = .data$ymax),
      fill = ifelse(is.na(l$color), "grey40", l$color)
    ))
  }
  p + ggplot2::geom_polygon(
    data = shapes,
    ggplot2::aes(x = .data$x, y = .data$y, group = .data$group,
                 subgroup = .data$contour),
    fill = shapes$fill
  )
}

# each letter's outline in the system sans font, scaled to its slice of the
# column the way the viewer stretches a glyph; NULL without systemfonts
logo_polygons <- function(l) {
  outlines <- lapply(unique(l$letter), glyph_unit)
  names(outlines) <- unique(l$letter)
  if (nrow(l) == 0 || any(vapply(outlines, is.null, logical(1)))) return(NULL)
  pieces <- lapply(seq_len(nrow(l)), function(i) {
    o <- outlines[[l$letter[i]]]
    data.frame(
      x = l$col[i] - 0.45 + 0.9 * o$x,
      y = l$ymin[i] + (l$ymax[i] - l$ymin[i]) * o$y,
      contour = o$contour, group = i,
      fill = if (is.na(l$color[i])) "grey40" else l$color[i]
    )
  })
  do.call(rbind, pieces)
}

glyph_unit <- function(letter) {
  if (!is.null(the$glyphs[[letter]])) return(the$glyphs[[letter]])
  if (!requireNamespace("systemfonts", quietly = TRUE) ||
      !exists("glyph_outline", asNamespace("systemfonts"))) {
    return(NULL)
  }
  font <- systemfonts::match_fonts("sans", weight = "bold")
  info <- systemfonts::glyph_info(letter, path = font$path, index = font$index)
  o <- tryCatch(
    systemfonts::glyph_outline(info$index[1], font$path, font$index, size = 100),
    error = function(e) NULL
  )
  if (is.null(o) || nrow(o) == 0) return(NULL)
  unit <- data.frame(
    x = (o$x - min(o$x)) / diff(range(o$x)),
    y = (o$y - min(o$y)) / diff(range(o$y)),
    contour = o$contour
  )
  if (is.null(the$glyphs)) the$glyphs <- list()
  the$glyphs[[letter]] <- unit
  unit
}
