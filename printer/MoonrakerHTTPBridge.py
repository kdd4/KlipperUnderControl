from config import *

import requests

async def get(url: str, stream: bool | None = None, timeout: int | None = None):
    url = f'http://{MOONRAKER_IP}:{MOONRAKER_PORT}{url}'
    headers = {'X-Api-Key': API_KEY} if API_KEY else None

    response = requests.get(
        url=url,
        headers=headers,
        stream=stream,
        timeout=timeout
    )
    return response

async def post(url: str, params: dict | None = None, files: dict | None= None, timeout: int | None = None):
    url = f'http://{MOONRAKER_IP}:{MOONRAKER_PORT}{url}'
    headers = {'X-Api-Key': API_KEY} if API_KEY else None

    response = requests.post(
        url=url,
        headers=headers,
        params=params,
        files=files,
        timeout=timeout
    )

    return response

