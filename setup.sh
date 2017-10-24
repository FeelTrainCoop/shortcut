# This script creates local versions of template files, but
# only if those local versions don't already exist. It won't
# overwrite your custom settings.

cd client/src/config/
for f in *.js.template; do
  if [ ! -f "${f/.js.template/.js}" ]; then
    echo "File ${f/.js.template/.js} not found, creating."
    cp "$f" "${f/.js.template/.js}";
  fi
done
cd ../images/
for f in *.png.template; do
  if [ ! -f "${f/.png.template/.png}" ]; then
    echo "File ${f/.png.template/.png} not found, creating."
    cp "$f" "${f/.png.template/.png}";
  fi
done
cd ../../../server/
if [ ! -f ".env" ]; then
  echo "File .env not found, creating."
  cp .env-template .env;
fi
echo "Done creating local versions of template files."
