from config import *
import MoonrakerPrinter as Printer
import MoonrakerServer as Server
import MoonrakerServerFile as Files
import ServerAuth as Auth

import asyncio
import requests
import time
import json

async def make_request(method, endpoint, data):
    result = None
    match method:
        case 'printer':
            match endpoint:
                case 'info': result = await Printer.info()
                case 'emergency_stop': result =  await Printer.emergency_stop()
                case 'restart': result =  await Printer.restart()
                case 'firmware_restart': result =  await Printer.firmware_restart()
                case 'objects/list': result =  await Printer.objects_list()
                case 'objects/query': result =  await Printer.objects_query(data['objects'])
                case 'query_endstops/status': result =  await Printer.query_endstops_status()
                case 'gcode/script': result =  await Printer.gcode_script(data['script'])
                case 'gcode/help': result =  await Printer.gcode_help()
                case 'print/start': result =  await Printer.print_start(data['filename'])
                case 'print/pause': result =  await Printer.print_pause()
                case 'print/resume': result =  await Printer.print_resume()
                case 'print/cancel': result =  await Printer.print_cancel()
                case _: print(f'Error wrong endpoint: {method}/{endpoint}')
        case 'server':
            match endpoint:
                case 'info': result = await Server.info()
                case 'config': result = await Server.config()
                case 'temperature_store': result = await Server.temperature_store(data['include_monitors'])
                case 'gcode_store': result = await Server.gcode_store(data['count'])
                case 'restart': result = await Server.restart()
                case _: print(f'Error wrong endpoint: {method}/{endpoint}')
        case 'files':
            match endpoint:
                case 'list': result = await Files.list(data['root'])
                case 'roots': result = await Files.roots()
                case 'metedata': result = await Files.metadata(data['filename'])
                case 'metescan': result = await Files.metascan(data['filename'])
                case 'thumbnails': result = await Files.thumbnails(data['filename'])
                case 'get_directory': result = await Files.get_directory(data['path'], data.get('extended', False))
                case 'post_directory': result = await Files.post_directory(data['path'])
                case 'delete_directory': result = await Files.delete_directory(data['path'], data.get('force', False))
                case 'move': result = await Files.move(data['source'], data['dest'])
                case 'copy': result = await Files.copy(data['source'], data['dest'])
                case 'upload':
                    result = await Files.upload(data['path'], data['filename'], bytes(data['file']),
                                                data['root'], data.get('print', False))
                case 'download':
                    download_result = await Files.download(data['filename'], data['root'])
                    result = {'result': download_result['TEXT']}
                case _: print(f'Error wrong endpoint: {method}/{endpoint}')
        case _:
            print(f'Error wrong method: {method}')
    return result

async def refresh_auth(tokens: dict):
    if tokens['expires_at'] > time.time():
        return tokens
    tokens = Auth.refresh_user(tokens['refresh_token'])

    if not tokens['success']:
        tokens = Auth.login_user(SERVER_LOGIN, SERVER_PASSWORD)
        if not tokens['success']:
            print(f"Error with refreshing JWT token, http_code: {tokens['httpcode']}, error: {tokens['error']}")
            exit()
    return tokens

async def complete_task(task: dict, tokens: dict):
    try:
        if DEBUG_MODE:
            print("Starting task: ", task)
        task_id = task['id']
        endpoint = task['endpoint']
        method = task['method']
        data = json.loads(task['data']) if task['data'] != 'NULL' else None

        result_json = await make_request(method, endpoint, data)
        status_code = 200 if result_json is not None else 400

        tokens = await refresh_auth(tokens)
        post_task = requests.post(
            url=f'http://{SERVER_IP}:{SERVER_PORT}/api/printer.php',
            headers={
                'Authorization': f'Bearer {tokens['access_token']}',
                'Content-Type': 'application/json'
            },
            json={
                'id': task_id,
                'result': result_json if result_json is not None else 'NONE' ,
                'httpCode': status_code,
                'error': result_json.get('error','')
            }
        )

        if post_task.status_code != 200:
            print(f"Error post task: id: {task_id}, code: {post_task.status_code}, text: {post_task.text}")
        else:
            print(f'Complete id: {task_id}, result: {result_json}\n')
    except Exception as exc:
        if DEBUG_MODE:
            raise RuntimeError('complete_task error') from exc
        print('Exception in complete_task:', exc)

async def main():
    tokens = Auth.login_user(SERVER_LOGIN, SERVER_PASSWORD)

    # Unauthorized

    if not tokens['success'] and tokens['httpcode'] == 401:
        tokens = Auth.register_user(SERVER_LOGIN, SERVER_PASSWORD)
        if not tokens['success']:
            if tokens['httpcode'] == 409 or tokens['httpcode'] == 422:
                print("WRONG LOGIN OR PASSWORD")
            else:
                print(f"REGISTER ERROR. http_code: {tokens['httpcode']}")
            exit()

    while True:
        try:
            time.sleep(1)
            tokens = await refresh_auth(tokens)
            response = requests.get(
                url=f"http://{SERVER_IP}:{SERVER_PORT}/api/printer.php",
                headers={
                    'Authorization': f'Bearer {tokens['access_token']}'
                }
            )

            response_json = response.json()

            if response.status_code != 200:
                print(f'Bad response status code: {response.status_code}, response: {response_json}')
                continue

            if not response_json['success']:
                print('Not success: ', response_json)
                continue

            tasks = response_json['result']

            async with asyncio.TaskGroup() as tg:
                for task in tasks:
                    tg.create_task(complete_task(task, tokens))

        except Exception as exc:
            if DEBUG_MODE:
                raise RuntimeError('complete_task error') from exc
            print('Exception in main: ', exc)


if __name__ == '__main__':
    asyncio.run(main())