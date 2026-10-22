#!/usr/bin/env sh

file_env() {
  name="$1"
  path=$(printenv "${name}_FILE")
  if [ -z "$path" ]; then
    return
  fi
  if [ ! -r "$path" ]; then
    echo "Warning: ${name}_FILE is set but '$path' is not readable, ignoring it" >&2
    return
  fi
  value=$(sed 's/^[[:space:]]*//; s/[[:space:]]*$//' "$path")
  export "$name"="$value"
}

file_env ORFARCHIV_DB_URL
file_env ORFARCHIV_DB_URLS
file_env ORFARCHIV_EMBEDDING_TOKEN

exec node .
