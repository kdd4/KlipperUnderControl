import MoonrakerWebsocketBridge as Bridge
import MoonrakerHTTPBridge as HTTPBridge
from config import UPLOAD_TIMEOUT, DOWNLOAD_TIMEOUT

from typing import BinaryIO
import asyncio

async def list(root: str = 'gcodes'):
    response = await Bridge.moonraker_request(
        'server.files.list',
        {'root': root}
    )
    return response

async def roots():
    response = await Bridge.moonraker_request(
        'server.files.roots'
    )
    return response

async def metadata(filename: str):
    response = await Bridge.moonraker_request(
        'server.files.metadata',
        {'filename': filename}
    )
    return response

async def metascan(filename: str):
    response = await Bridge.moonraker_request(
        'server.files.metascan',
        {'filename': filename}
    )
    return response

async def thumbnails(filename: str):
    response = await Bridge.moonraker_request(
        'server.files.thumbnails',
        {'filename': filename}
    )
    return response

async def get_directory(path: str = 'gcodes', extended: bool = False):
    response = await Bridge.moonraker_request(
        'server.files.get_directory',
        {
            'path': path,
            'extended': extended
        }
    )
    return response

async def post_directory(path: str):
    response = await Bridge.moonraker_request(
        'server.files.post_directory',
        {'path': path}
    )
    return response

async def delete_directory(path: str, force: bool = False):
    response = await Bridge.moonraker_request(
        'server.files.delete_directory',
        {
            'path': path,
            'force': force
        }
    )
    return response

async def move(source: str, dest: str):
    response = await Bridge.moonraker_request(
        'server.files.move',
        {
            'source': source,
            'dest': dest
        }
    )
    return response

async def copy(source: str, dest: str):
    response = await Bridge.moonraker_request(
        'server.files.copy',
        {
            'source': source,
            'dest': dest
        }
    )
    return response

async def upload(upload_path: str, filename:str, file: BinaryIO | bytes, root: str = 'gcodes', print: bool = False):
    params = {
        'root': root,
        'path': upload_path,  # Папка назначения
        'checksum': 'sha256',  # Тип проверки целостности (sha256, crc32 и т.д.)
        'print': 'true' if print else 'false'   # Автоматически запускать печать после загрузки
    }
    files = {'file': (filename, file)}

    response = await HTTPBridge.post(
        url='/server/files/upload',
        params=params,
        files=files,
        timeout=UPLOAD_TIMEOUT
    )
    return response

async def download(filepath: str, root: str = 'gcodes'):
    response = await HTTPBridge.get(
        url=f'/server/files/{root}/{filepath}',
        stream=True,
        timeout=DOWNLOAD_TIMEOUT
    )

    result: bytes = b''
    for chunk in response.iter_content(chunk_size=128):
        result += chunk

    return {
        'TEXT': result,
        'RESPONSE': response
    }

async def delete(filepath: str, root: str = 'gcodes'):
    response = await Bridge.moonraker_request(
        'server.files.delete_file',
        {'path': f'{root}/{filepath}'}
    )
    return response

# ------ TEST CODE ------

async def TEST():
    # Пример получения статуса
    flist = await roots()
    print('Files List:', flist)

    # Upload file
    with open('TEST.gcode', 'rb') as file:
        response = await upload(
            upload_path='',
            filename='TEST1.gcode',
            file=file
        )
        print('\nUpload file:', {'TEXT': response.text, 'RESPONSE': response})

    # Download file
    result = await download('TEST1.gcode')
    print('\nDownload result:', result)

    # Deleting test file
    result = await delete('TEST1.gcode')
    print('\nDelete result:', result)


if __name__ == '__main__':
    asyncio.run(TEST())