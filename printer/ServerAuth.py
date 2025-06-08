from config import *

import requests

def register_user(login: str, password: str):
    response = requests.post(
        url=f"http://{SERVER_IP}:{SERVER_PORT}/api/register.php",
        headers={'Content-Type': 'application/json'},
        json={
            'login': login,
            'password': password
        }
    )

    try:
        result: dict = response.json()
    except Exception as exc:
        raise RuntimeError(f'register_user parsing from json error. response text: {response.text}') from exc

    result['httpcode'] = response.status_code
    return result

def login_user(login: str, password: str):
    response = requests.post(
        url=f"http://{SERVER_IP}:{SERVER_PORT}/api/login.php",
        headers={'Content-Type': 'application/json'},
        json={
            'login': login,
            'password': password
        }
    )

    try:
        result: dict = response.json()
    except Exception as exc:
        raise RuntimeError(f'login_user parsing from json error. response text: {response.text}') from exc

    result['httpcode'] = response.status_code
    return result

def logout_user(refresh_token: str):
    response = requests.post(
        url=f"http://{SERVER_IP}:{SERVER_PORT}/api/logout.php",
        headers={'Content-Type': 'application/json'},
        json={
            'refresh_token': refresh_token
        }
    )

    try:
        result: dict = response.json()
    except Exception as exc:
        raise RuntimeError(f'logout_user parsing from json error. response text: {response.text}') from exc

    result['httpcode'] = response.status_code
    return result

def refresh_user(refresh_token: str):
    response = requests.post(
        url=f"http://{SERVER_IP}:{SERVER_PORT}/api/refresh.php",
        headers={'Content-Type': 'application/json'},
        json={
            'refresh_token': refresh_token
        }
    )

    try:
        result: dict = response.json()
    except Exception as exc:
        raise RuntimeError(f'refresh_user parsing from json error. response text: {response.text}') from exc

    result['httpcode'] = response.status_code
    return result
