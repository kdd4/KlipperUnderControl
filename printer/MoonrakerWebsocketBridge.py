from config import *

import websockets
import json
import uuid

async def moonraker_request(method: str, params: dict = None):
    url = f'ws://{MOONRAKER_IP}:{MOONRAKER_PORT}/websocket'
    headers = {'X-Api-Key': API_KEY} if API_KEY else None
    request_id = str(uuid.uuid4())

    async with websockets.connect(url, additional_headers=headers) as ws:
        request = {
            'jsonrpc': '2.0',
            'method': method,
            'params': params or {},
            'id': request_id
        }
        await ws.send(json.dumps(request))
        response = await ws.recv()
        return json.loads(response)
