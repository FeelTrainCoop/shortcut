#!/bin/bash
$(echo "eb setenv"

	cat .env | while read line
	do
	  echo "$line"
	done

)

exit 0