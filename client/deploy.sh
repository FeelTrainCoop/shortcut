if sudo cp -R dist/* /var/www/html ; then
  echo "Copied files to Apache public directory!"
else
  echo "Something went wrong..."
fi
