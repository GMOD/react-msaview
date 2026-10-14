#' Save a viewer as a static figure
#'
#' Runs \code{react-msaview-cli export-svg --props} on the widget's props, so
#' the figure draws every layer the widget does, with no browser. A \code{.png}
#' or \code{.pdf} file is converted from that SVG by the rsvg package.
#'
#' @param widget A viewer from \code{\link{msaview}}, with any layers added.
#' @param file Output path ending in \code{.svg}, \code{.png} or \code{.pdf}.
#' @param width Width of the view in pixels; the whole alignment is drawn
#'   whatever its width, and this sizes the tree and label area beside it.
#' @param scale Pixels per SVG unit in a \code{.png}, 2 for a sharp figure on
#'   a high-density screen or a print at 192 dpi.
#' @param cli The program that runs react-msaview-cli and its leading
#'   arguments. The default, \code{npx}, needs Node.js. Set
#'   \code{options(msaview.cli = ...)} to use an installed copy.
#' @return \code{file}, invisibly.
#' @examples
#' \dontrun{
#' w <- msaview(msa = ">a\nMKAANSE\n>b\nMKA-NSE") +
#'   geom_msa_highlight(start = 2, end = 4, label = "motif")
#' msaview_save(w, "alignment.pdf")
#' }
#' @export
msaview_save <- function(widget, file, width = 1200, scale = 2,
                         cli = getOption(
                           "msaview.cli",
                           c("npx", "--yes", "react-msaview-cli")
                         )) {
  if (!inherits(widget, "msaview")) {
    stop("widget must be a viewer made by msaview()")
  }
  ext <- tolower(tools::file_ext(file))
  if (!ext %in% c("svg", "png", "pdf")) {
    stop("file must end in .svg, .png or .pdf, not '", basename(file), "'")
  }
  if (ext != "svg" && !requireNamespace("rsvg", quietly = TRUE)) {
    stop("writing a .", ext, " needs the rsvg package: install.packages(\"rsvg\")")
  }

  props_file <- tempfile(fileext = ".json")
  on.exit(unlink(props_file), add = TRUE)
  writeLines(props_json(widget$x$props), props_file, useBytes = TRUE)

  svg <- if (ext == "svg") file else tempfile(fileext = ".svg")
  if (ext != "svg") on.exit(unlink(svg), add = TRUE)
  output <- suppressWarnings(system2(
    cli[[1]],
    c(cli[-1], "export-svg", "--props", shQuote(props_file),
      "--width", format(width, scientific = FALSE), "-o", shQuote(svg)),
    stdout = TRUE, stderr = TRUE
  ))
  status <- attr(output, "status")
  if (!is.null(status) && status != 0 || !file.exists(svg)) {
    stop("react-msaview-cli failed:\n", paste(output, collapse = "\n"))
  }

  if (ext == "png") {
    rsvg::rsvg_png(svg, file, width = round(svg_width(svg) * scale))
  } else if (ext == "pdf") {
    rsvg::rsvg_pdf(svg, file)
  }
  invisible(file)
}

# The JSON htmlwidgets would send the browser, with the arguments
# htmlwidgets:::toJSON2 passes jsonlite, so the CLI reads what MSAViewer reads.
props_json <- function(props) {
  jsonlite::toJSON(
    props,
    dataframe = "columns", null = "null", na = "null", auto_unbox = TRUE,
    digits = NA, use_signif = TRUE, force = TRUE, POSIXt = "ISO8601",
    UTC = TRUE, rownames = FALSE, keep_vec_names = TRUE, strict_atomic = TRUE
  )
}

svg_width <- function(svg) {
  head <- readChar(svg, 4096, useBytes = TRUE)
  as.numeric(sub('^.*?<svg[^>]*? width="([0-9.]+)".*$', "\\1", head,
                 perl = TRUE))
}
