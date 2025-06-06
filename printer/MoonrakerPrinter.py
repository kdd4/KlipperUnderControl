import MoonrakerWebsocketBridge as Bridge

import asyncio

async def info():
    response = await Bridge.moonraker_request(
        'printer.info'
    )
    return response

async def emergency_stop():
    response = await Bridge.moonraker_request(
        'printer.emergency_stop'
    )
    return response

async def restart():
    response = await Bridge.moonraker_request(
        'printer.restart'
    )
    return response

async def firmware_restart():
    response = await Bridge.moonraker_request(
        'printer.firmware_restart'
    )
    return response

async def objects_list():
    response = await Bridge.moonraker_request(
        'printer.objects.list'
    )
    return response

async def objects_query(objects_params: dict):
    response = await Bridge.moonraker_request(
        'printer.objects.query',
        {'objects': objects_params}
    )
    return response

async def query_endstops_status():
    response = await Bridge.moonraker_request(
        'printer.query_endstops.status'
    )
    return response

async def gcode_script(script: str):
    response = await Bridge.moonraker_request(
        'printer.gcode.script',
        {'script': script}
    )
    return response

async def gcode_help():
    response = await Bridge.moonraker_request(
        'printer.gcode.help'
    )
    return response

async def print_start(filename: str):
    response = await Bridge.moonraker_request(
        'printer.print.start',
        {'filename': filename}
    )
    return response

async def print_pause():
    response = await Bridge.moonraker_request(
        'printer.print.pause'
    )
    return response

async def print_resume():
    response = await Bridge.moonraker_request(
        'printer.print.resume'
    )
    return response

async def print_cancel():
    response = await Bridge.moonraker_request(
        'printer.print.cancel'
    )
    return response

# ------ TEST CODE ------

async def TEST():
    # Пример получения статуса
    status = await info()
    print('Printer info:', status)

if __name__ == '__main__':
    asyncio.run(TEST())