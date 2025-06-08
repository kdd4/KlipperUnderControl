from config import *

import websockets
import json
import uuid

from websockets.asyncio.client import connect

async def moonraker_request(method: str, params: dict = None):
    url = f'ws://{MOONRAKER_IP}:{MOONRAKER_PORT}/websocket'
    headers = {'X-Api-Key': API_KEY} if API_KEY else None
    request_id = str(uuid.uuid4())

    request = {
        'jsonrpc': '2.0',
        'method': method,
        'params': params or {},
        'id': request_id
    }

    async with connect(url, additional_headers=headers) as ws:
        await ws.send(json.dumps(request))
        response = await ws.recv()
        return json.loads(response)
