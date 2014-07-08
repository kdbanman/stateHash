id=$(openssl rand -base64 8)

echo "============" >> out.log
echo "" >> out.log
echo $id >> out.log
echo "" >> out.log
echo "============" >> out.log

echo "============" >> err.log
echo "" >> err.log
echo $id >> err.log
echo "" >> err.log
echo "============" >> err.log

git pull && npm install && ( forever restart -a -l forever.log -o out.log -e err.log srv.js || forever start -a -l forever.log -o out.log -e err.log srv.js )
