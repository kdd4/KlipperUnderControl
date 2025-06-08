from config import *
import fake.MoonrakerPrinter as Printer
import fake.MoonrakerServer as Server
import fake.MoonrakerServerFile as Files

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

async def complete_task(task: dict):
    try:
        if DEBUG_MODE:
            print("Starting task: ", task)
        task_id = task['id']
        endpoint = task['endpoint']
        method = task['method']
        data = json.loads(task['data']) if task['data'] != 'NULL' else None

        result_json = await make_request(method, endpoint, data)
        status_code = 200 if result_json is not None else 400

        post_task = requests.post(
            url=f'http://{SERVER_IP}:{SERVER_PORT}/api/printer.php',
            headers={'Content-Type': 'application/json'},
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
    while True:
        try:
            time.sleep(1)
            response = requests.get(
                url="http://localhost:8088/api/printer.php",
                headers={'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30'}
            )

            print(response.text)
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
                    tg.create_task(complete_task(task))

        except Exception as exc:
            if DEBUG_MODE:
                raise RuntimeError('complete_task error') from exc
            print('Exception in main: ', exc)


if __name__ == '__main__':
    asyncio.run(main())