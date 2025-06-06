from config import *
import fake.MoonrakerPrinter as Printer
import fake.MoonrakerServer as Server
import MoonrakerServerFile as Files

import asyncio
import requests
import time
import json

async def makeRequest(method, endpoint, data):
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
                case 'list': result = Files.list(data['root'])
                case 'roots': result = Files.roots()
                case 'metedata': result = Files.metadata(data['filename'])
                case 'metescan': result = Files.metascan(data['filename'])

        case _:
            print(f'Error wrong method: {method}')
    return result

async def completeTask(task: dict):
    try:
        print(task)
        task_id = task['id']
        endpoint = task['endpoint']
        method = task['method']
        data = json.loads(task['data']) if task['data'] != 'NULL' else None

        result_json = await makeRequest(method, endpoint, data)
        status_code = 200 if result_json is not None else 400

        post_task = requests.put(
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
            print(f"Error post task: id: {id}, code: {post_task.status_code}, text: {post_task.text}")
        else:
            print(f'Complete id: {id}, result: {result_json}\n')
    except Exception as ex:
        print('Exception in completeTask: ', ex)


async def main():
    while True:
        time.sleep(0.5)
        try:
            response = requests.get(
                url="http://localhost:8088/api/printer.php"
            )

            tasks = response.json()

            if response.status_code != 200:
                print('Bad response: ', tasks)

            async with asyncio.TaskGroup() as tg:
                for task in tasks:
                    tg.create_task(completeTask(task))

        except Exception as ex:
            print('Exception in main: ', ex)


if __name__ == '__main__':
    asyncio.run(main())