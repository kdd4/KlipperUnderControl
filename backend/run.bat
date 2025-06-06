docker build -t backend .
docker run -d -p 8088:80 --name backend backend
pause