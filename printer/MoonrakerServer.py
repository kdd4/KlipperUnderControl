import MoonrakerWebsocketBridge as Bridge

import asyncio

async def info():
    response = await Bridge.moonraker_request(
        "server.info"
    )
    return response

async def config():
    response = await Bridge.moonraker_request(
        "server.config"
    )
    return response

async def temperature_store(include_monitors: bool):
    response = await Bridge.moonraker_request(
        "server.temperature_store",
        {"include_monitors": include_monitors}
    )
    return response

async def gcode_store(count: int):
    response = await Bridge.moonraker_request(
        "server.gcode_store",
        {"count": count}
    )
    return response

async def restart():
    response = await Bridge.moonraker_request(
        "server.restart"
    )
    return response

# ------ TEST CODE ------

async def TEST():
    # Пример получения статуса
    status = await info()
    print("Server info:", status)

if __name__ == "__main__":
    asyncio.run(TEST())