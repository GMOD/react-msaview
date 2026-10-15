import React from 'react'

import { makeStyles } from '@jbrowse/core/util/tss-react'

const useStyles = makeStyles()(theme => ({
  list: {
    display: 'grid',
    gridTemplateColumns: 'minmax(8em, max-content) minmax(0, 1fr)',
    columnGap: theme.spacing(3),
    margin: 0,
  },
  row: {
    display: 'contents',
  },
  key: {
    fontWeight: 600,
    padding: theme.spacing(0.75, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  code: {
    marginLeft: theme.spacing(1),
    fontWeight: 400,
    fontSize: '0.75em',
    fontFamily: 'monospace',
    color: theme.palette.text.secondary,
  },
  value: {
    margin: 0,
    padding: theme.spacing(0.75, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: '0.85em',
    maxHeight: '8em',
    overflow: 'auto',
  },
  nested: {
    '& > dl': {
      paddingLeft: theme.spacing(2),
      borderLeft: `2px solid ${theme.palette.divider}`,
    },
  },
}))

export function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !React.isValidElement(value)
  )
}

export function isEmpty(value: unknown) {
  return isRecord(value) && Object.keys(value).length === 0
}

export default function MetadataTable({
  record,
  labels = {},
  monospaceKeys,
}: {
  record: Record<string, unknown>
  labels?: Record<string, string>
  monospaceKeys?: Set<string>
}) {
  const { classes, cx } = useStyles()
  return (
    <dl className={classes.list}>
      {Object.entries(record)
        .filter(([, value]) => value != null && !isEmpty(value))
        .map(([key, value]) => {
          const label = labels[key]
          const nested = isRecord(value)
          return (
            <div key={key} className={classes.row}>
              <dt className={classes.key}>
                {label ?? key}
                {label && label !== key ? (
                  <span className={classes.code}>{key}</span>
                ) : null}
              </dt>
              <dd
                className={cx(
                  classes.value,
                  nested && classes.nested,
                  monospaceKeys?.has(key) && classes.mono,
                )}
              >
                {nested ? (
                  <MetadataTable
                    record={value}
                    labels={labels}
                    monospaceKeys={monospaceKeys}
                  />
                ) : Array.isArray(value) ? (
                  value.join('\n')
                ) : React.isValidElement(value) ? (
                  value
                ) : (
                  String(value)
                )}
              </dd>
            </div>
          )
        })}
    </dl>
  )
}
