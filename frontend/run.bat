docker build -t frontend .
docker run -d -p 80:5173 --name frontend frontend
pause