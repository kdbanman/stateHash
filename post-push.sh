git pull && npm install && ( forever restart -a -l forever.log -o out.log -e err.log srv.js || forever start -a -l forever.log -o out.log -e err.log srv.js )
