for f in *.js.template; do cp "$f" "${f/.js.template/.js}"; done
